import unittest
from artwork_classification import classify

ALIASES = {'that-spark': 'That Spark', 'beat-drop': 'Beat Drop', 'digital-control': 'Digital Control'}


def asset(file, collection='jowikroon-mystery-social-v6', **extra):
    return dict(title='Original title', family_key='old-family', format='JPG', origins=[dict(file=file, collection=collection)], **extra)


class ClassificationTest(unittest.TestCase):
    def test_profile_headers_are_discoverable_in_both_categories(self):
        row = classify(asset('exports/soundcloud-banner.jpg'), ALIASES)
        self.assertEqual(row['categories'], ['Banner', 'Profile', 'Social'])
        self.assertEqual(row['channels'], ['SoundCloud'])

    def test_archive_folder_does_not_turn_post_into_profile(self):
        row = asset('exports/instagram-release-beat-drop.jpg')
        row['origins'].append(dict(collection='_ARTWORK', file='00 CURRENT (use these)/profile and banner/instagram-release-beat-drop.jpg'))
        result = classify(row, ALIASES)
        self.assertEqual(result['categories'], ['Social', 'Song'])

    def test_shared_avatar_lists_each_intended_channel(self):
        row = asset('exports/soundcloud-profile.jpg')
        row['origins'] += [dict(collection='jowikroon-mystery-social-v6', file=f'exports/{c}-profile.jpg') for c in ['spotify', 'whatsapp']]
        result = classify(row, ALIASES)
        self.assertEqual(result['channels'], ['Instagram', 'SoundCloud', 'Spotify', 'WhatsApp'])
        self.assertNotIn('Banner', result['categories'])

    def test_emotion_pulse_pack_does_not_classify_every_cover_as_brand_element(self):
        result = classify(asset('artwork/png/digital-control.png', 'jowikroon-photographic-emotion-pulse-v6'), ALIASES)
        self.assertEqual(result['categories'], ['Song'])
        self.assertEqual(result['role'], 'Artwork')

    def test_actual_pulse_is_a_brand_element(self):
        row = asset('assets/pulses/digital-control.svg')
        row['format'] = 'SVG'
        result = classify(row, ALIASES)
        self.assertEqual(result['categories'], ['Brand element', 'Song'])
        self.assertEqual(result['family_key'], 'pulse-digital-control')

    def test_body_in_song_name_is_not_a_profile(self):
        row = asset('artwork/plates/16-body.png', 'jowikroon-neon-heart-covers-v2')
        row['origins'].append(dict(collection='jowikroon-neon-complete-photographic-v7', file='artwork/plates/that-spark.png'))
        result = classify(row, ALIASES)
        self.assertEqual(result['categories'], ['Song'])
        self.assertEqual(result['song'], 'That Spark')

    def test_neon_beats_front_does_not_inherit_banner_folder_or_song(self):
        row = asset('cover/NEON-Beats-front-3000.jpg', 'jowikroon-neon-beats-signal-fix-v10')
        row['origins'].append(dict(collection='_ARTWORK', file='Per song/Beat Drop/06 album covers/shared.jpg'))
        result = classify(row, ALIASES)
        self.assertEqual(result['categories'], ['Album'])
        self.assertIsNone(result['song'])

    def test_character_references_stay_in_studio(self):
        result = classify(asset('body-reference-v2.png', 'jowikroon-flow-character-v2-2026-09-23'), ALIASES)
        self.assertEqual(result['categories'], ['Studio'])

    def test_different_story_pages_do_not_collapse_into_one_design(self):
        a = classify(asset('pages/00.jpg', 'jowikroon-island-sessions-comic-v13'), ALIASES)
        b = classify(asset('pages/00.jpg', 'jowikroon-signal-between-story-v14'), ALIASES)
        self.assertNotEqual(a['family_key'], b['family_key'])
        self.assertEqual(a['categories'], ['Social'])
        self.assertNotIn('TikTok', a['channels'])

    def test_preserves_originals_versions_and_selection(self):
        row = asset('exports/instagram-story.jpg', storage_path='originals/hash.jpg', is_current=False, bytes=123, collections=['v6'])
        result = classify(row, ALIASES)
        for key in ['origins', 'storage_path', 'bytes', 'is_current', 'collections']:
            self.assertEqual(result[key], row[key])
        self.assertIn('TikTok', result['channels'])


if __name__ == '__main__':
    unittest.main()
