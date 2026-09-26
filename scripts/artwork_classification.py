"""Classify the archive by asset purpose, never by descriptive archive-folder names.

Pure metadata transformation: originals, origins, current/archive selection and
storage paths are preserved. Run with INPUT_JSON ALIASES_MANIFEST OUTPUT_JSON.
"""
import json
import re
import sys
from pathlib import PurePosixPath, Path


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def classify(row, aliases):
    result = dict(row)
    # Pack-relative paths describe purpose. Backup folders like "profile and
    # banner" or "emotion pulse" are not evidence of the individual asset type.
    primary = [o for o in row['origins'] if o['collection'].startswith('jowikroon-')]
    origins = primary or row['origins']
    paths = [o['file'].lower() if primary else PurePosixPath(o['file']).name.lower() for o in origins]
    names = [PurePosixPath(p).stem for p in paths]
    text = ' '.join(names)
    packs = ' '.join(o['collection'] for o in origins)
    categories, channels = set(), set()
    for token, channel in [('instagram', 'Instagram'), ('tiktok', 'TikTok'), ('spotify', 'Spotify'), ('soundcloud', 'SoundCloud'), ('whatsapp', 'WhatsApp'), ('suno', 'Suno'), ('youtube', 'YouTube')]:
        if any(token in p for p in paths):
            channels.add(channel)

    def matches(pattern):
        return bool(re.search(pattern, text))

    board = matches(r'overview|board|guide|comparison|before-and-after|contact-sheet|narrative-map|new-covers|heart-and|heart-and-the|love-promise|seven-cover|pulse-family|storyboard')
    reference = 'flow-character' in packs
    pulse = any('/pulses/' in '/' + p for p in paths) or matches(r'(?:^|-)pulse$') and row['format'] == 'SVG'
    brand = pulse or matches(r'signal-mark|wordmark|connection-wave|^type-|vector-preview')
    banner = matches(r'banner|header') and not board
    profile = matches(r'avatar|profile|artist-portrait|portrait-lighting-study') and not reference and not board
    social = matches(r'instagram|tiktok|whatsapp-status|(?:^|-)story(?:-|$)|feed|carousel|clue|teaser|launch|wake-up-mobile')
    pages = any(p.startswith(('pages/', 'webtoon/')) for p in paths)
    album = matches(r'album.*(?:front|back)|(?:front|back).*album|neon(?:-beats)?-(?:front|back)|neon cover concept front')
    if 'neon-beats-covers' in packs and matches(r'^front-'):
        album = True
    # Reference album sleeves copied into every song folder do not belong to the
    # first song encountered during import.
    song = None
    for name in names:
        normalized = '-' + slug(name) + '-'
        for key, title in sorted(aliases.items(), key=lambda item: -len(item[0])):
            if '-' + key + '-' in normalized:
                song = title
                break
        if song:
            break
    if not song and not album:
        named_folders = {o['file'].split('/')[1] for o in row['origins'] if o['file'].startswith('Per song/') and '/06 album covers' not in o['file'] and not o['file'].split('/')[1].startswith('00 ')}
        if len(named_folders) == 1:
            folder = next(iter(named_folders))
            song = aliases.get(slug(folder))
    if album:
        song = None
        categories.add('Album')
    if song:
        categories.add('Song')
    if profile or banner:
        categories.add('Profile')
    if banner:
        categories.add('Banner')
    if social or pages or (channels and (profile or banner)):
        categories.add('Social')
    if brand:
        categories.add('Brand element')
    if board or reference:
        categories.add('Studio')
    if not categories:
        categories.add('Studio')
    if matches(r'feed|carousel') or (matches(r'(?:^|-)story(?:-|$)') and not pages):
        channels.add('Instagram')
    # A Story is not automatically a TikTok export. Platform labels require an
    # explicit filename or a reviewed reuse decision.
    role = 'Artwork'
    if reference:
        role = 'Identity reference'
    elif board:
        role = 'Presentation board'
    elif brand:
        role = 'Brand element'
    elif any('/plates/' in '/' + p for p in paths) or matches(r'clean|(?:^|-)plate(?:-|$)'):
        role = 'Clean plate'
    elif any(p.startswith(('preview/', 'artwork/previews/', 'editorial/', 'review/')) for p in paths) or matches(r'preview|inspection|video-frame|qc-frames'):
        role = 'Preview'
    elif row['format'] == 'SVG':
        role = 'Editable vector'
    elif any('/concepts/' in '/' + p for p in paths):
        role = 'Concept cover'

    family = row['family_key']
    title = song or row['title']
    if album and not board:
        side = 'back' if matches(r'back') else 'front'
        title = 'NEON — ' + side + ' cover'
        family = ('pulse-' if pulse else '') + 'album-' + side
    elif song:
        family = ('pulse-' if pulse else 'social-' if social else '') + slug(song)
    elif pages:
        family = origins[0]['collection'] + '-' + slug(names[0])
        title = ('The Signal Between' if 'signal-between-story' in packs else 'Island Sessions') + ' — ' + ('pagina ' if paths[0].startswith('pages/') else '') + names[0]
    elif board:
        family = origins[0]['collection'] + '-' + slug(re.sub(r'-preview$', '', names[0]))

    # Reuse the already-made square profile export for Instagram as requested;
    # it is the same shared portrait, not a newly generated fourth portrait.
    if 'exports/soundcloud-profile.jpg' in paths:
        channels.add('Instagram')
        title = 'JOWIKROON — gedeelde profielfoto'
        family = 'artist-profile-shared'
    # Reviewed vertical campaign assets can also serve the requested TikTok
    # campaign. This is an intended reuse label, not platform certification.
    if any(name in {'instagram-story', 'whatsapp-status', 'portrait-story', 'monthly-series-story', 'wake-up-mobile'} for name in names):
        channels.add('TikTok')
    result.update(categories=sorted(categories), channels=sorted(channels), song=song, title=title, family_key=family, role=role)
    return result


def load_aliases(manifest):
    aliases = {f['id']: f['title'] for f in manifest['files']}
    aliases.update({slug(title): title for title in list(aliases.values())})
    aliases.update({'beat-drop': 'Beat Drop', 'vow': 'The Vow I’m Holding', 'opa': 'Mijn opa weet alles', 'n-1': 'N = 1', 'e-2': 'E = 2', 'neongod': 'Neon God', 'hello-goodbye': 'HelloGoodbye', 'neon-house-of-glass': 'Neon House of Glass'})
    return aliases


if __name__ == '__main__':
    rows = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    aliases = load_aliases(json.loads(Path(sys.argv[2]).read_text(encoding='utf-8')))
    Path(sys.argv[3]).write_text(json.dumps([classify(r, aliases) for r in rows], ensure_ascii=False, indent=2), encoding='utf-8')
