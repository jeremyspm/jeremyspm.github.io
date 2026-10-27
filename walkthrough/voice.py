"""Voice narration.json with Kokoro (af_heart, the HS2 podcast's voice), one WAV per line, plus timing.json.

    python walkthrough/voice.py            # voice what isn't cached yet
    python walkthrough/voice.py --say "x"  # voice one line to video/public/audio/say.wav (check a pronunciation)

A line is re-voiced only when its spoken text changes (the file name is a hash of it). SAY maps written words to how
Kokoro should say them; captions keep the written form.
"""
import hashlib, json, os, re, sys
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'video', 'public', 'audio')
MODEL_DIR = 'D:/hs2-audio/model'
VOICE, SPEED, LANG = 'af_heart', 1.0, 'en-us'
SAY = {r'\bBN2\b': 'B N two', r'\bHS2\b': 'H S two', r'\bINP\b': 'I N P'}

_k = None
def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(MODEL_DIR, 'kokoro-v1.0.onnx'), os.path.join(MODEL_DIR, 'voices-v1.0.bin'))
    return _k

def spoken(text):
    for pat, rep in SAY.items(): text = re.sub(pat, rep, text)
    return text

def voice(text, path):
    samples, rate = kokoro().create(spoken(text), voice=VOICE, speed=SPEED, lang=LANG)
    # trim the model's leading/trailing near-silence so the edit controls every gap
    a = np.abs(samples); on = np.where(a > 0.01)[0]
    if len(on): samples = samples[max(0, on[0] - int(0.03 * rate)): on[-1] + int(0.08 * rate)]
    sf.write(path, samples, rate)
    return len(samples) / rate

def main():
    os.makedirs(OUT, exist_ok=True)
    if sys.argv[1:2] == ['--say']:
        print(f"{voice(sys.argv[2], os.path.join(OUT, 'say.wav')):.2f}s"); return
    scenes = json.load(open(os.path.join(HERE, 'narration.json'), encoding='utf-8'))
    timing = []
    for s in scenes:
        lines = []
        for text in s['lines']:
            h = hashlib.sha1(f'{VOICE}|{SPEED}|{spoken(text)}'.encode()).hexdigest()[:12]
            name = f"{s['id']}-{h}.wav"; path = os.path.join(OUT, name)
            if os.path.exists(path):
                info = sf.info(path); dur = info.frames / info.samplerate
            else:
                dur = voice(text, path); print(f'voiced {name} {dur:.2f}s  {text[:50]}')
            lines.append({'text': text, 'file': f'audio/{name}', 'sec': round(dur, 3)})
        timing.append({'id': s['id'], 'lines': lines})
    json.dump(timing, open(os.path.join(HERE, 'video', 'src', 'timing.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    total = sum(l['sec'] for s in timing for l in s['lines'])
    print(f'{sum(len(s["lines"]) for s in timing)} lines, {total:.1f}s of speech')

if __name__ == '__main__':
    main()
