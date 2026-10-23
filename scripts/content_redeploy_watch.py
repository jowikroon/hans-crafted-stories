#!/usr/bin/env python3
"""Read-only, fail-closed publication check. Only verified outputs permit a redeploy."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.request

PROJECT = 'pesfakewujjwkyybwaom'
ROOT = Path(__file__).resolve().parents[1]
STAMP_FILE = Path('apps/personal/.content-deploy-stamp')
PUBLIC_CONFIG = Path('apps/personal/.env.production')
TRANSIENT = {429, 500, 502, 503, 504, 544}


class CheckError(Exception):
    pass


def timestamp(value):
    if not isinstance(value, str) or not re.fullmatch(
        r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})', value
    ):
        raise CheckError('Invalid or missing published timestamp; comparison not performed.')
    try:
        return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        raise CheckError('Invalid published timestamp; comparison not performed.') from None


def parse_stamp(value):
    parts = value.split('|')
    if len(parts) != 2 or not re.fullmatch(r'[1-9][0-9]*', parts[1]):
        raise CheckError('Invalid repository stamp; manual review required.')
    return timestamp(parts[0]), int(parts[1])


def configuration(root, env):
    url = env.get('CONTENT_SUPABASE_URL', '').strip()
    key = env.get('CONTENT_SUPABASE_PUBLISHABLE_KEY', '').strip()
    if bool(url) != bool(key):
        raise CheckError('Configure both CONTENT_SUPABASE_URL and CONTENT_SUPABASE_PUBLISHABLE_KEY.')
    if not url:
        # Read two literal public frontend settings; never source or execute an env file.
        try:
            text = (root / PUBLIC_CONFIG).read_text()
        except OSError:
            raise CheckError('Public Supabase configuration is missing.') from None
        def setting(name):
            values = re.findall(r'^' + name + r'="([^"\r\n]+)"\s*$', text, re.MULTILINE)
            if len(values) != 1:
                raise CheckError('Public Supabase configuration is missing or ambiguous.')
            return values[0]
        url = setting('VITE_SUPABASE_URL')
        key = setting('VITE_SUPABASE_PUBLISHABLE_KEY')
    if url.rstrip('/') != f'https://{PROJECT}.supabase.co':
        raise CheckError('Unexpected Supabase project URL; comparison not performed.')
    if key.startswith('sb_publishable_'):
        if not re.fullmatch(r'sb_publishable_[A-Za-z0-9_-]{20,}', key):
            raise CheckError('Invalid publishable key configuration.')
    else:
        # Validate legacy anon scope and project, without claiming to verify its signature.
        import base64
        try:
            payload = key.split('.')[1]
            claims = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
            valid = (len(key.split('.')) == 3 and claims['role'] == 'anon'
                     and claims['ref'] == PROJECT and claims['exp'] > time.time())
        except (ValueError, KeyError, IndexError, TypeError):
            valid = False
        if not valid:
            raise CheckError('Only a publishable or unexpired project-matched anon key is allowed.')
    return url.rstrip('/'), key


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Never forward API credentials to a redirect target.


def read_stamp(url, key, *, timeout=15, attempts=3, delay=1, opener=None):
    endpoint = (url + '/rest/v1/blog_posts?select=updated_at&published=eq.true'
                '&order=updated_at.desc.nullslast&limit=1')
    headers = {'apikey': key, 'Prefer': 'count=exact', 'Accept': 'application/json'}
    # Publishable keys are API keys, not bearer JWTs.
    if not key.startswith('sb_publishable_'):
        headers['Authorization'] = 'Bearer ' + key
    request = urllib.request.Request(endpoint, headers=headers)
    opener = opener or urllib.request.build_opener(NoRedirect())
    for attempt in range(attempts):
        try:
            with opener.open(request, timeout=timeout) as response:
                if response.status not in (200, 206):
                    raise CheckError('Unexpected Supabase status; comparison not performed.')
                content_range = response.headers.get('Content-Range', '')
                body = response.read(16385)
                if len(body) > 16384:
                    raise CheckError('Unexpected Supabase payload size; comparison not performed.')
            break
        except urllib.error.HTTPError as error:
            if error.code == 402:
                body = error.read(4096).decode('utf-8', errors='replace')
                # Log only known violation codes, never arbitrary response data or credentials.
                codes = re.findall(r'\b(?:exceed_[a-z_]+_quota|overdue_payment)\b', body)
                detail = ', '.join(sorted(set(codes))) or 'inspect organization usage/billing'
                raise CheckError(f'Supabase HTTP 402: service restriction ({detail}); '
                                 'comparison NOT performed; no redeploy. No paid changes made.') from None
            if error.code in (401, 403):
                raise CheckError(f'Supabase HTTP {error.code}: check public key, grants and RLS; '
                                 'comparison NOT performed; no redeploy.') from None
            if error.code not in TRANSIENT or attempt == attempts - 1:
                raise CheckError(f'Supabase HTTP {error.code}; comparison NOT performed; no redeploy.') from None
        except (urllib.error.URLError, TimeoutError, OSError):
            if attempt == attempts - 1:
                raise CheckError('Supabase unreachable or timed out; comparison NOT performed; no redeploy.') from None
        time.sleep(delay * (attempt + 1))
    if not re.fullmatch(r'0-0/[1-9][0-9]*', content_range):
        raise CheckError('Missing/invalid exact published count or empty dataset; comparison NOT performed.')
    try:
        rows = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        raise CheckError('Invalid Supabase JSON; comparison NOT performed.') from None
    if not isinstance(rows, list) or len(rows) != 1 or not isinstance(rows[0], dict):
        raise CheckError('Missing published row; comparison NOT performed.')
    latest = rows[0].get('updated_at')
    timestamp(latest)
    return f'{latest}|{content_range.split("/")[1]}'


def check(root, env, *, reader=read_stamp):
    url, key = configuration(root, env)
    try:
        previous = (root / STAMP_FILE).read_text().strip()
    except OSError:
        raise CheckError('Repository stamp missing; manual baseline review required.') from None
    old = parse_stamp(previous)
    stamp = reader(url, key)
    current = parse_stamp(stamp)
    # All validation completes before any successful output is written.
    return stamp, old != current


def main(argv=None, *, root=ROOT, env=None, reader=read_stamp):
    env = os.environ if env is None else env
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args(argv)
    try:
        stamp, changed = check(root, env, reader=reader)
    except CheckError as error:
        message = str(error)
        print(f'ERROR: {message}')
        if env.get('GITHUB_STEP_SUMMARY'):
            with open(env['GITHUB_STEP_SUMMARY'], 'a') as file:
                file.write(f'## Publication check FAILED\n\n{message}\n\n'
                           'No comparison result, stamp update or redeploy authorized.\n')
        return 1
    if env.get('GITHUB_OUTPUT'):
        with open(env['GITHUB_OUTPUT'], 'a') as file:
            file.write(f'stamp={stamp}\nchanged={str(changed).lower()}\nverified=true\n')
    message = f'Verified published stamp: {stamp}; changed={str(changed).lower()}'
    print(message)
    if env.get('GITHUB_STEP_SUMMARY'):
        with open(env['GITHUB_STEP_SUMMARY'], 'a') as file:
            file.write('## Publication check verified\n\n' + message + '\n\n' +
                       ('Check only: no stamp update or redeploy.\n' if args.check_only else
                        'A changed stamp may be applied by the guarded main-branch step.\n'))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
