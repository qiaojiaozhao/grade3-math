#!/usr/bin/env python3
"""合成一段原创的八音盒背景乐，首尾无缝循环，输出 demos/assets/bgm.m4a。

只用标准库：和弦进行 C–Am–F–G，钢片琴分解和弦 + 柔和低音 + 一条简单旋律。
用法：python3 tools/make-bgm.py
"""
import math
import os
import struct
import subprocess
import tempfile
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'demos', 'assets', 'bgm.m4a')

SR = 44100
BPM = 92
BEAT = 60 / BPM
BARS = 16
TOTAL = int(SR * BEAT * 4 * BARS)

buf = [0.0] * TOTAL


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def bell(midi, start_beat, dur_beats, vol):
    """八音盒：基频 + 少量泛音，快起慢落。尾音超出结尾会绕回开头，保证循环无缝。"""
    f = hz(midi)
    start = int(start_beat * BEAT * SR)
    n = int(dur_beats * BEAT * SR)
    decay = 2.2 / (dur_beats * BEAT)
    for i in range(n):
        t = i / SR
        env = min(1.0, t / 0.004) * math.exp(-decay * t)
        s = (math.sin(2 * math.pi * f * t)
             + 0.25 * math.sin(2 * math.pi * 2 * f * t) * math.exp(-3 * t)
             + 0.08 * math.sin(2 * math.pi * 3.01 * f * t) * math.exp(-6 * t))
        buf[(start + i) % TOTAL] += vol * env * s


def bass(midi, start_beat, dur_beats, vol):
    f = hz(midi)
    start = int(start_beat * BEAT * SR)
    n = int(dur_beats * BEAT * SR)
    for i in range(n):
        t = i / SR
        env = min(1.0, t / 0.03) * min(1.0, (n - i) / (0.15 * SR))
        buf[(start + i) % TOTAL] += vol * env * math.sin(2 * math.pi * f * t)


# 和弦：根音（低八度）+ 三个和弦音
CHORDS = {
    'C':  (36, [60, 64, 67]),
    'Am': (33, [57, 60, 64]),
    'F':  (29, [57, 60, 65]),
    'G':  (31, [59, 62, 67]),
}
PROGRESSION = ['C', 'Am', 'F', 'G'] * 4

# 旋律：每小节一句，(拍位, 音高, 时值)；后八小节变奏一下
MELODY_A = [
    [(0, 76, 1.5), (1.5, 74, 0.5), (2, 72, 2)],
    [(0, 72, 1), (1, 76, 1), (2, 79, 2)],
    [(0, 77, 1.5), (1.5, 76, 0.5), (2, 72, 2)],
    [(0, 74, 1), (1, 71, 1), (2, 74, 2)],
]
MELODY_B = [
    [(0, 79, 1), (1, 76, 1), (2, 72, 1), (3, 76, 1)],
    [(0, 76, 1.5), (1.5, 72, 0.5), (2, 69, 2)],
    [(0, 72, 1), (1, 77, 1), (2, 81, 1.5), (3.5, 79, 0.5)],
    [(0, 79, 1), (1, 77, 1), (2, 74, 1), (3, 71, 1)],
]
MELODY = MELODY_A * 2 + MELODY_B + MELODY_A

ARP = [0, 1, 2, 1, 0, 1, 2, 1]

for bar, name in enumerate(PROGRESSION):
    root, tones = CHORDS[name]
    b0 = bar * 4
    bass(root, b0, 2, 0.20)
    bass(root + 7, b0 + 2, 2, 0.14)
    for k, idx in enumerate(ARP):
        bell(tones[idx], b0 + k * 0.5, 1.5, 0.09)
    for beat, pitch, dur in MELODY[bar]:
        bell(pitch, b0 + beat, max(dur, 1) * 1.6, 0.16)

peak = max(abs(x) for x in buf) or 1
scale = 0.8 / peak

with tempfile.TemporaryDirectory() as tmp:
    wav_path = os.path.join(tmp, 'bgm.wav')
    with wave.open(wav_path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(x * scale * 32767)) for x in buf))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav_path,
                    '-c:a', 'aac', '-b:a', '128k', OUT], check=True)

print(f'✓ {os.path.relpath(OUT, ROOT)}  {TOTAL / SR:.1f}s 循环')
