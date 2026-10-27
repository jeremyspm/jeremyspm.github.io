"""Transcribe every voiced line back with faster-whisper and print the ones that don't match the script."""
import json, re, os
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.abspath(__file__))
m = WhisperModel('small.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z0-9 ]', '', s.lower().replace('-', ' ')).split()
bad = 0
for s in json.load(open(os.path.join(HERE, 'video', 'src', 'timing.json'), encoding='utf-8')):
    for l in s['lines']:
        x, sr = sf.read(os.path.join(HERE, 'video', 'public', l['file']), dtype='float32')
        x = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype('float32')  # whisper wants 16 kHz
        segs, _ = m.transcribe(x, language='en', beam_size=5)
        heard = ' '.join(x.text.strip() for x in segs)
        a, b = norm(l['text']), norm(heard)
        if a != b:
            bad += 1; print(f"SCRIPT: {l['text']}\nHEARD:  {heard}\n")
print(f'{bad} lines differ')
