import base64
from contextlib import contextmanager
import http.server
import io
import json
from pathlib import Path
import socket
import tempfile
import threading
import unittest
from unittest.mock import patch

import content_redeploy_watch as watch

LATEST = '2026-10-14T21:33:34.233146+00:00'
STAMP = LATEST + '|13'
KEY = 'sb_publishable_' + 'a' * 25


@contextmanager
def server(status=200, body=None, content_range='0-0/13', statuses=None):
    calls = []
    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            calls.append((self.path, self.headers))
            code = statuses[min(len(calls) - 1, len(statuses) - 1)] if statuses else status
            self.send_response(code)
            if content_range is not None:
                self.send_header('Content-Range', content_range)
            self.end_headers()
            self.wfile.write(body if body is not None else json.dumps([{'updated_at': LATEST}]).encode())
        def log_message(self, *args):
            pass
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{httpd.server_port}', calls
    finally:
        httpd.shutdown()
        httpd.server_close()
        thread.join()


class PublicationWatchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / watch.STAMP_FILE).parent.mkdir(parents=True)
        (self.root / watch.STAMP_FILE).write_text(STAMP + '\n')
        self.env = {
            'CONTENT_SUPABASE_URL': f'https://{watch.PROJECT}.supabase.co',
            'CONTENT_SUPABASE_PUBLISHABLE_KEY': KEY,
            'GITHUB_OUTPUT': str(self.root / 'outputs'),
            'GITHUB_STEP_SUMMARY': str(self.root / 'summary'),
        }

    def run_main(self, reader):
        with patch('sys.stdout', new_callable=io.StringIO):
            return watch.main(['--check-only'], root=self.root, env=self.env, reader=reader)

    def http_reader(self, url):
        return lambda _url, key: watch.read_stamp(url, key, attempts=3, delay=0, timeout=0.2)

    def assert_no_success(self):
        self.assertFalse((self.root / 'outputs').exists())
        self.assertEqual((self.root / watch.STAMP_FILE).read_text(), STAMP + '\n')
        self.assertIn('FAILED', (self.root / 'summary').read_text())

    def test_successful_http_comparison_no_content_write(self):
        with server() as (url, calls):
            self.assertEqual(self.run_main(self.http_reader(url)), 0)
        self.assertEqual(len(calls), 1)
        self.assertIn('published=eq.true', calls[0][0])
        self.assertIn('limit=1', calls[0][0])
        self.assertEqual(calls[0][1]['Prefer'], 'count=exact')
        self.assertIsNone(calls[0][1].get('Authorization'))
        self.assertIn('changed=false\nverified=true', (self.root / 'outputs').read_text())
        self.assertEqual((self.root / watch.STAMP_FILE).read_text(), STAMP + '\n')

    def test_changed_stamp_is_detected_but_not_written(self):
        self.assertEqual(self.run_main(lambda *_: LATEST + '|14'), 0)
        self.assertIn('changed=true', (self.root / 'outputs').read_text())
        self.assertEqual((self.root / watch.STAMP_FILE).read_text(), STAMP + '\n')

    def test_equivalent_timezone_does_not_trigger_redeploy(self):
        self.assertEqual(self.run_main(lambda *_: '2026-10-14T23:33:34.233146+02:00|13'), 0)
        self.assertIn('changed=false', (self.root / 'outputs').read_text())

    def test_402_is_not_retried_and_never_becomes_success(self):
        with server(402, b'{"message":"exceed_egress_quota, exceed_storage_size_quota"}') as (url, calls):
            self.assertEqual(self.run_main(self.http_reader(url)), 1)
        self.assertEqual(len(calls), 1)
        self.assert_no_success()
        self.assertIn('exceed_egress_quota', (self.root / 'summary').read_text())

    def test_unreachable_supabase_fails_closed(self):
        # Bind without listening: the port cannot be grabbed by another process.
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            url = f'http://127.0.0.1:{sock.getsockname()[1]}'
            self.assertEqual(self.run_main(self.http_reader(url)), 1)
        self.assert_no_success()

    def test_transient_failure_retries_then_succeeds(self):
        with server(statuses=[503, 503, 200]) as (url, calls):
            self.assertEqual(self.run_main(self.http_reader(url)), 0)
        self.assertEqual(len(calls), 3)

    def test_exhausted_503_retries_fail_closed(self):
        with server(status=503) as (url, calls):
            self.assertEqual(self.run_main(self.http_reader(url)), 1)
        self.assertEqual(len(calls), 3)
        self.assert_no_success()

    def test_non_retryable_auth_errors_fail(self):
        for status in (401, 403):
            with self.subTest(status=status), server(status=status) as (url, calls):
                self.assertEqual(self.run_main(self.http_reader(url)), 1)
                self.assertEqual(len(calls), 1)
                self.assert_no_success()

    def test_missing_or_malformed_data_fails_closed(self):
        examples = [
            (b'[]', '*/0'), (b'[]', '0-0/13'), (b'not json', '0-0/13'),
            (b'{}', '0-0/13'), (b'[{"updated_at":null}]', '0-0/13'),
            (b'[{"updated_at":"2026-99-14T21:33:34Z"}]', '0-0/13'),
            (b'[{"updated_at":"2026-10-14T21:33:34Z"}]', None),
            (b'[{"updated_at":"2026-10-14T21:33:34Z"}]', '0-0/*'),
            (b'[{"updated_at":"2026-10-14T21:33:34Z"}]', '0-0/0'),
        ]
        for body, count in examples:
            with self.subTest(body=body, count=count), server(body=body, content_range=count) as (url, _):
                self.assertEqual(self.run_main(self.http_reader(url)), 1)
                self.assert_no_success()

    def test_partial_or_wrong_project_config_fails_before_network(self):
        def forbidden(*_):
            self.fail('Network must not be called')
        self.env['CONTENT_SUPABASE_URL'] = ''
        self.assertEqual(self.run_main(forbidden), 1)
        self.assert_no_success()
        self.env['CONTENT_SUPABASE_URL'] = 'https://other.supabase.co'
        self.assertEqual(self.run_main(forbidden), 1)

    def test_service_role_key_is_rejected(self):
        payload = base64.urlsafe_b64encode(json.dumps({
            'role': 'service_role', 'ref': watch.PROJECT, 'exp': 9999999999
        }).encode()).decode().rstrip('=')
        self.env['CONTENT_SUPABASE_PUBLISHABLE_KEY'] = 'header.' + payload + '.signature'
        self.assertEqual(self.run_main(lambda *_: self.fail('Must not call network')), 1)
        self.assert_no_success()

    def test_public_repo_configuration_works_without_env_execution(self):
        (self.root / watch.PUBLIC_CONFIG).write_text(
            'VITE_SUPABASE_URL="https://' + watch.PROJECT + '.supabase.co"\n'
            'VITE_SUPABASE_PUBLISHABLE_KEY="' + KEY + '"\n'
            'UNRELATED=$(do-not-execute)\n')
        for name in ('CONTENT_SUPABASE_URL', 'CONTENT_SUPABASE_PUBLISHABLE_KEY'):
            self.env.pop(name)
        self.assertEqual(self.run_main(lambda *_: STAMP), 0)

    def test_redirect_never_forwards_credentials(self):
        class Redirect(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(302)
                self.send_header('Location', 'https://example.invalid/credentials')
                self.end_headers()
            def log_message(self, *args):
                pass
        httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Redirect)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            self.assertEqual(self.run_main(self.http_reader(f'http://127.0.0.1:{httpd.server_port}')), 1)
            self.assert_no_success()
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join()

    def test_corrupt_baseline_requires_review(self):
        (self.root / watch.STAMP_FILE).write_text('[]|13')
        self.assertEqual(self.run_main(lambda *_: self.fail('Must not call network')), 1)
        self.assertFalse((self.root / 'outputs').exists())


if __name__ == '__main__':
    unittest.main()
