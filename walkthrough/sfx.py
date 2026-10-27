"""Synthesise the two sound effects, so nothing is downloaded: python walkthrough/sfx.py

click.wav  a soft mouse click: a press and a quieter release 75 ms later
typing.wav 8 s of light key taps at an uneven pace, the odd heavier space bar
Both peak well under full scale; the edit sets their volume again under the voice.
"""
import os
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'video', 'public', 'sfx')
SR = 48000
rng = np.random.default_rng(7)

def tap(length, tau, body_hz, body_amp, gain):
    """A transient: high-passed noise with a fast decay, plus a short resonant 'body' tone."""
    t = np.arange(int(SR * length)) / SR
    noise = rng.standard_normal(len(t))
    noise = np.diff(noise, prepend=0) * 0.5            # crude high-pass: takes the rumble out
    env = np.exp(-t / tau)
    body = np.sin(2 * np.pi * body_hz * t) * np.exp(-t / (tau * 2.2)) * body_amp
    x = (noise * env + body) * gain
    x[: int(SR * 0.0008)] *= np.linspace(0, 1, int(SR * 0.0008))  # no hard edge at the start
    return x

def place(buf, x, at):
    i = int(at * SR); n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n]

def main():
    os.makedirs(OUT, exist_ok=True)
    click = np.zeros(int(SR * 0.16))
    place(click, tap(0.03, 0.0016, 2400, 0.5, 0.42), 0.0)
    place(click, tap(0.03, 0.0012, 3100, 0.35, 0.2), 0.075)
    sf.write(os.path.join(OUT, 'click.wav'), click, SR)

    typing = np.zeros(int(SR * 8.2)); t = 0.05
    while t < 8.0:
        if rng.random() < 0.12:   # space bar: lower, a little heavier
            place(typing, tap(0.05, 0.003, 900 + rng.uniform(-60, 60), 0.6, 0.22), t)
        else:
            place(typing, tap(0.035, 0.0018 + rng.uniform(0, 0.0007), 1800 + rng.uniform(-350, 450), 0.45, rng.uniform(0.13, 0.2)), t)
        t += rng.uniform(0.085, 0.17) + (0.25 if rng.random() < 0.06 else 0)  # the odd pause, like thinking
    sf.write(os.path.join(OUT, 'typing.wav'), typing, SR)
    for n, x in [('click', click), ('typing', typing)]:
        print(n, f'peak {20 * np.log10(np.abs(x).max()):.1f} dBFS, {len(x) / SR:.2f}s')

if __name__ == '__main__':
    main()
