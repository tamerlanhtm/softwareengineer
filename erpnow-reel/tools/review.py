"""Contact sheet from an encoded video: python3 tools/review.py video.mp4 out.png t1 t2 ...
Decodes the given timestamps with ffmpeg (as a viewer would see them) and tiles them."""
import os
import subprocess
import sys
import tempfile

video, out, times = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3:]]
ff = os.environ.get('FFMPEG', 'ffmpeg')
tmp = tempfile.mkdtemp()
files = []
for t in times:
    f = os.path.join(tmp, f't_{t:.3f}.png')
    subprocess.run([ff, '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', video, '-frames:v', '1', f], check=True)
    files.append(f)
here = os.path.dirname(os.path.abspath(__file__))
subprocess.run([sys.executable, os.path.join(here, 'sheet.py'), out, str(min(len(files), 8)), *files], check=True)
print(out)
