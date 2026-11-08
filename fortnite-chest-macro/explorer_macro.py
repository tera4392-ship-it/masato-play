"""
Fortnite 探索マクロ (PC / Windows / Python 3.9+)  ※撮影用・クリエイティブ想定

  F8 : 開始 / 停止      F9 : 終了

動き
  1. 歩き回る (前進 + ランダムに視点を振る + 時々ステップ)
  2. 歩きながら時々 E を押して、ドアを開ける
  3. ゲーム音(PCの出力音)を監視。宝箱の音のような「急な音」を検知したら
     - 左右の音量差から音のする方向へ振り向く
     - その方向へ歩く
     - ツルハシに持ち替えて壁を壊す
     - E 長押しで宝箱を開ける
     - その後、探索に戻る

準備:  pip install pydirectinput pynput numpy soundcard
音の調整: python explorer_macro.py --calibrate   (音量の数値を見ながら閾値を決める)
"""
import argparse
import random
import sys
import threading
import time

import numpy as np

# ======================= 設定 (ここを調整) =======================
KEY_FORWARD = "w"
KEY_INTERACT = "e"        # ドア / 宝箱
KEY_PICKAXE = "1"         # ツルハシのスロット (標準は 1)
STRAFE_KEYS = ("a", "d")

# --- 探索 ---
WALK_MIN_S, WALK_MAX_S = 1.2, 2.8     # 1回の前進時間
LOOK_PX_MIN, LOOK_PX_MAX = 80, 420    # ランダムに振り向く量(ピクセル。感度で変わる)
DOOR_TAP_CHANCE = 0.6                 # 前進ごとにドアを開けようとする確率
STRAFE_CHANCE = 0.25

# --- 音の検知 ---
SOUND_RATIO = 3.0        # 普段の音量(背景)の何倍で「急な音」とみなすか
SOUND_MIN_LEVEL = 0.02   # これ未満の音は無視 (--calibrate で確認)
SOUND_COOLDOWN_S = 12    # 一度反応したら次に反応するまでの時間
TURN_PX_AT_FULL_PAN = 450  # 音が完全に片側のとき、振り向くピクセル量

# --- 音に反応したときの動作 ---
APPROACH_S = 2.0         # 音の方向へ歩く時間
BREAK_WALL_S = 2.5       # 壁を壊す(ツルハシで左クリック長押し)時間
CHEST_HOLD_S = 1.4       # 宝箱を開けるE長押し時間
POST_BREAK_WALK_S = 1.2  # 壁を壊した後、中へ進む時間
# ================================================================

try:
    import pydirectinput as di
    di.PAUSE = 0
    di.FAILSAFE = False
except Exception:  # calibrate だけならゲーム入力ライブラリは不要
    di = None

state = {"running": False, "alive": True}
sound_event = threading.Event()
sound_info = {"pan": 0.0}


# ---------------------------- 入力ヘルパー ----------------------------
def nap(sec):
    """停止(F8)に素早く反応できる待機。停止中なら False を返す"""
    end = time.time() + sec
    while time.time() < end:
        if not state["running"]:
            return False
        time.sleep(0.02)
    return True


def hold(key, sec):
    di.keyDown(key)
    try:
        return nap(sec)
    finally:
        di.keyUp(key)


def tap(key):
    di.keyDown(key)
    time.sleep(0.06)
    di.keyUp(key)


def look(dx, dy=0):
    # 一度に大きく動かすと入力が飛ぶので分割する
    steps = max(1, int(abs(dx) // 40))
    for _ in range(steps):
        di.moveRel(int(dx / steps), int(dy / steps), relative=True)
        time.sleep(0.01)


def release_all():
    if di is None:
        return
    for k in (KEY_FORWARD, KEY_INTERACT, *STRAFE_KEYS):
        di.keyUp(k)
    di.mouseUp(button="left")


# ---------------------------- 音の検知 ----------------------------
def pan_of(left_rms, right_rms):
    """-1(左) .. +1(右)"""
    total = left_rms + right_rms
    return 0.0 if total <= 1e-9 else float((right_rms - left_rms) / total)


def audio_loop(calibrate=False):
    import soundcard as sc

    speaker = sc.default_speaker()
    mic = sc.get_microphone(id=str(speaker.name), include_loopback=True)
    baseline = None
    last_trigger = 0.0
    with mic.recorder(samplerate=44100, channels=2) as rec:
        while state["alive"]:
            data = rec.record(numframes=4410)  # 0.1秒
            left = float(np.sqrt(np.mean(data[:, 0] ** 2)))
            right = float(np.sqrt(np.mean(data[:, 1] ** 2)))
            level = (left + right) / 2
            baseline = level if baseline is None else baseline * 0.97 + level * 0.03

            if calibrate:
                bar = "#" * int(min(level, 0.5) * 100)
                print(f"level={level:.3f} base={baseline:.3f} pan={pan_of(left, right):+.2f} {bar}")
                continue

            now = time.time()
            if (state["running"] and level > SOUND_MIN_LEVEL
                    and level > baseline * SOUND_RATIO
                    and now - last_trigger > SOUND_COOLDOWN_S):
                last_trigger = now
                sound_info["pan"] = pan_of(left, right)
                sound_event.set()


# ---------------------------- 行動 ----------------------------
def explore_step():
    """歩き回る1ステップ"""
    look(random.choice((-1, 1)) * random.randint(LOOK_PX_MIN, LOOK_PX_MAX))
    di.keyDown(KEY_FORWARD)
    try:
        total = random.uniform(WALK_MIN_S, WALK_MAX_S)
        t0 = time.time()
        while time.time() - t0 < total:
            if not state["running"] or sound_event.is_set():
                return
            if random.random() < STRAFE_CHANCE * 0.03:  # 約1ステップに1回
                hold(random.choice(STRAFE_KEYS), 0.25)
            time.sleep(0.03)
    finally:
        di.keyUp(KEY_FORWARD)
    if random.random() < DOOR_TAP_CHANCE:
        tap(KEY_INTERACT)  # ドアを開ける
        nap(0.4)


def react_to_sound():
    """宝箱の音 → 振り向く → 近づく → 壁を壊す → 宝箱を開ける"""
    pan = sound_info["pan"]
    sound_event.clear()
    look(pan * TURN_PX_AT_FULL_PAN)
    if not nap(0.2):
        return
    hold(KEY_FORWARD, APPROACH_S)
    if not state["running"]:
        return
    # 壁を壊す
    tap(KEY_PICKAXE)
    nap(0.3)
    di.mouseDown(button="left")
    try:
        nap(BREAK_WALL_S)
    finally:
        di.mouseUp(button="left")
    if not state["running"]:
        return
    hold(KEY_FORWARD, POST_BREAK_WALK_S)
    # 宝箱を開ける
    hold(KEY_INTERACT, CHEST_HOLD_S)
    nap(0.5)


def main_loop():
    while state["alive"]:
        if not state["running"]:
            time.sleep(0.05)
            continue
        try:
            if sound_event.is_set():
                react_to_sound()
            else:
                explore_step()
        finally:
            if not state["running"]:
                release_all()


# ---------------------------- 起動 ----------------------------
def toggle():
    state["running"] = not state["running"]
    sound_event.clear()
    print("▶ 開始" if state["running"] else "■ 停止")
    if not state["running"]:
        release_all()


def quit_all():
    state["running"] = False
    state["alive"] = False
    release_all()
    print("終了")
    import os
    os._exit(0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--calibrate", action="store_true", help="音量を表示するだけ")
    args = ap.parse_args()

    if args.calibrate:
        print("ゲームを動かして宝箱の音を鳴らし、そのときの level を確認 (Ctrl+Cで終了)")
        try:
            audio_loop(calibrate=True)
        except KeyboardInterrupt:
            pass
        return

    if di is None:
        sys.exit("pydirectinput が必要です: pip install pydirectinput")
    from pynput import keyboard

    threading.Thread(target=audio_loop, daemon=True).start()
    threading.Thread(target=main_loop, daemon=True).start()
    print("F8: 開始/停止   F9: 終了   (ゲーム画面を前面にして F8)")
    with keyboard.GlobalHotKeys({"<f8>": toggle, "<f9>": quit_all}) as h:
        h.join()


if __name__ == "__main__":
    main()
