"""Masters the soundtrack and encodes Instagram-ready deliverables.

  python3 scripts/encode.py out/master.mkv [--lang az]

  * Loudness: one linear gain so the full mix lands on -14 LUFS integrated
    (true peak stays below -1 dBTP); the SFX-only stem gets the same gain so it
    keeps its level relative to any music added in Instagram.
  * Video: H.264 High, 1080x1920, 30 fps CFR, yuv420p BT.709, aq-mode 3 against
    banding in the dark gradients, +faststart. Audio: AAC-LC 320 kbps 48 kHz.
"""
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = os.environ.get('FFMPEG', 'ffmpeg')
TARGET_LUFS = -14.0


def run(args, capture=False):
    r = subprocess.run([FF, '-hide_banner', '-nostats', '-y'] + args, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit('ffmpeg failed')
    return r.stderr


def loudness(path):
    err = subprocess.run([FF, '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    summary = err[err.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summary).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summary).group(1))
    return i, tp


TITLES = {
    'en': 'TOSNow — Tour Operator System | ineed.now',
    'az': 'TOSNow — Turoperatorlar üçün sistem | ineed.now',
}


def main():
    args = sys.argv[1:]
    lang = 'en'
    if '--lang' in args:
        k = args.index('--lang')
        lang = args[k + 1]
        del args[k:k + 2]
    master = args[0] if args else os.path.join(ROOT, 'out/master.mkv')
    tag = '' if lang == 'en' else '_' + lang.upper()   # every language shares the soundtrack
    out = os.path.join(ROOT, 'deliverables')
    os.makedirs(out, exist_ok=True)
    full = os.path.join(ROOT, 'audio/soundtrack_premaster.wav')
    sfx = os.path.join(ROOT, 'audio/sfx_only_premaster.wav')

    i, tp = loudness(full)
    gain = TARGET_LUFS - i
    print(f'premaster: {i:.1f} LUFS, {tp:.1f} dBTP → gain {gain:+.2f} dB')
    for src, dst in ((full, 'audio/soundtrack_master.wav'), (sfx, 'audio/sfx_only_master.wav')):
        run(['-i', src, '-af', f'volume={gain:.2f}dB', '-c:a', 'pcm_s16le', os.path.join(ROOT, dst)])
    i2, tp2 = loudness(os.path.join(ROOT, 'audio/soundtrack_master.wav'))
    print(f'master:    {i2:.1f} LUFS, {tp2:.1f} dBTP')
    shutil.copyfile(os.path.join(ROOT, 'audio/soundtrack_master.wav'), os.path.join(out, 'TOSNow_Reel_soundtrack.wav'))

    vcodec = [
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level:v', '4.2',
        '-x264-params', 'aq-mode=3:aq-strength=0.9:deblock=-1,-1',
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
        '-r', '30', '-g', '60', '-movflags', '+faststart',
    ]
    acodec = ['-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2']
    jobs = [
        ('audio/soundtrack_master.wav', f'TOSNow_Reel_1080x1920{tag}.mp4'),
        ('audio/sfx_only_master.wav', f'TOSNow_Reel_1080x1920{tag}_SFX-only.mp4'),
    ]
    for audio, name in jobs:
        dst = os.path.join(out, name)
        run(['-i', master, '-i', os.path.join(ROOT, audio), '-map', '0:v:0', '-map', '1:a:0'] + vcodec + acodec
            + ['-shortest', '-metadata', f'title={TITLES.get(lang, TITLES["en"])}', dst])
        print('wrote', dst, f'{os.path.getsize(dst) / 1e6:.1f} MB')

    # Cover: the end card (all key content sits inside the 3:4 profile-grid crop).
    cover = os.path.join(out, f'TOSNow_Reel{tag}_cover.jpg')
    run(['-sseof', '-0.05', '-i', master, '-frames:v', '1', '-q:v', '2', cover])
    print('wrote', cover)


if __name__ == '__main__':
    main()
