"""
Fortnite ルート台本マクロ (PC / Windows)  ※撮影用・クリエイティブ想定

  python route_macro.py route.txt            # 台本を再生 (F8で開始/停止, F9で終了)
  python route_macro.py --calibrate-turn     # 振り向き量の較正 (下記参照)

台本 (route.txt) の書き方: 1行1命令, # 以降はコメント
  walk 3.5          前進 3.5秒
  run 4             ダッシュ(Shift)で前進 4秒
  back 1            後退
  strafe l 0.8      左へ横移動 (l / r)
  turn 90           右へ90度振り向く (マイナスで左)
  look -10          視点を10度上へ (マイナスで上, プラスで下)
  jump              ジャンプ
  door              Eを1回押す (ドアを開ける)
  chest             E長押し (宝箱を開ける)
  break 2.5         ツルハシに持ち替えて壁を壊す 2.5秒
  wait 1            待機
  repeat 3 / end    repeat ~ end の間を3回繰り返す

準備: pip install pydirectinput pynput
"""
import argparse
import os
import sys
import threading
import time

# ======================= 設定 =======================
PX_PER_360 = 3600      # 360度回るのに必要なマウス移動量(px)。--calibrate-turn で較正
KEY_FORWARD, KEY_BACK, KEY_LEFT, KEY_RIGHT = "w", "s", "a", "d"
KEY_SPRINT = "shift"
KEY_JUMP = "space"
KEY_INTERACT = "e"
KEY_PICKAXE = "1"
CHEST_HOLD_S = 1.4
START_DELAY_S = 3      # F8を押してから動き出すまでの猶予 (撮影の「よーい」用)
# ====================================================

state = {"running": False}


def parse(text):
    """台本 → 命令リスト [(cmd, args)]。repeat は展開する"""
    stack = [[]]
    counts = []
    for no, raw in enumerate(text.splitlines(), 1):
        line = raw.split("#")[0].strip()
        if not line:
            continue
        parts = line.lower().split()
        cmd, args = parts[0], parts[1:]
        try:
            if cmd == "repeat":
                counts.append(int(args[0]))
                stack.append([])
            elif cmd == "end":
                body = stack.pop()
                stack[-1].extend(body * counts.pop())
            elif cmd in ("walk", "run", "back", "wait", "break", "turn", "look"):
                stack[-1].append((cmd, [float(args[0])]))
            elif cmd == "strafe":
                if args[0] not in ("l", "r"):
                    raise ValueError("strafe は l か r")
                stack[-1].append((cmd, [args[0], float(args[1])]))
            elif cmd in ("jump", "door", "chest"):
                stack[-1].append((cmd, []))
            else:
                raise ValueError(f"不明な命令 {cmd}")
        except (IndexError, ValueError) as e:
            raise SystemExit(f"台本 {no}行目: '{raw.strip()}' → {e}")
    if len(stack) != 1:
        raise SystemExit("台本: repeat と end の数が合っていません")
    return stack[0]


def nap(sec):
    end = time.time() + sec
    while time.time() < end:
        if not state["running"]:
            return False
        time.sleep(0.02)
    return True


def run_cmd(di, cmd, a):
    def hold(key, sec):
        di.keyDown(key)
        try:
            nap(sec)
        finally:
            di.keyUp(key)

    def move_px(dx, dy):
        steps = max(1, int(max(abs(dx), abs(dy)) // 40))
        for _ in range(steps):
            if not state["running"]:
                return
            di.moveRel(int(dx / steps), int(dy / steps), relative=True)
            time.sleep(0.01)

    if cmd == "walk":
        hold(KEY_FORWARD, a[0])
    elif cmd == "run":
        di.keyDown(KEY_SPRINT)
        try:
            hold(KEY_FORWARD, a[0])
        finally:
            di.keyUp(KEY_SPRINT)
    elif cmd == "back":
        hold(KEY_BACK, a[0])
    elif cmd == "strafe":
        hold(KEY_LEFT if a[0] == "l" else KEY_RIGHT, a[1])
    elif cmd == "turn":
        move_px(a[0] / 360 * PX_PER_360, 0)
        nap(0.15)
    elif cmd == "look":
        move_px(0, a[0] / 360 * PX_PER_360)
        nap(0.15)
    elif cmd == "jump":
        hold(KEY_JUMP, 0.1)
    elif cmd == "door":
        hold(KEY_INTERACT, 0.08)
        nap(0.5)
    elif cmd == "chest":
        hold(KEY_INTERACT, CHEST_HOLD_S)
        nap(0.4)
    elif cmd == "break":
        hold(KEY_PICKAXE, 0.08)
        nap(0.3)
        di.mouseDown(button="left")
        try:
            nap(a[0])
        finally:
            di.mouseUp(button="left")
    elif cmd == "wait":
        nap(a[0])


def release_all(di):
    for k in (KEY_FORWARD, KEY_BACK, KEY_LEFT, KEY_RIGHT, KEY_SPRINT,
              KEY_JUMP, KEY_INTERACT):
        di.keyUp(k)
    di.mouseUp(button="left")


def player(di, program):
    while True:
        if not state["running"]:
            time.sleep(0.05)
            continue
        print(f"{START_DELAY_S}秒後に開始...")
        if nap(START_DELAY_S):
            for i, (cmd, a) in enumerate(program, 1):
                if not state["running"]:
                    break
                print(f"[{i}/{len(program)}] {cmd} {' '.join(map(str, a))}")
                run_cmd(di, cmd, a)
            else:
                print("台本おわり")
        state["running"] = False
        release_all(di)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("route", nargs="?", help="台本ファイル")
    ap.add_argument("--calibrate-turn", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="台本の文法チェックだけ")
    args = ap.parse_args()

    if args.dry_run:
        prog = parse(open(args.route, encoding="utf-8").read())
        print(f"OK: {len(prog)} 命令")
        return

    import pydirectinput as di
    di.PAUSE = 0
    di.FAILSAFE = False
    from pynput import keyboard

    if args.calibrate_turn:
        print("5秒後に、ゲーム内で右へ360度回転します。ぴったり1周しなければ")
        print("PX_PER_360 を増減して再実行してください (回り足りない→増やす)")
        time.sleep(5)
        state["running"] = True
        run_cmd(di, "turn", [360.0])
        return

    if not args.route:
        sys.exit("台本ファイルを指定してください: python route_macro.py route.txt")
    program = parse(open(args.route, encoding="utf-8").read())

    def toggle():
        state["running"] = not state["running"]
        if not state["running"]:
            release_all(di)
            print("■ 停止")

    def quit_all():
        state["running"] = False
        release_all(di)
        os._exit(0)

    threading.Thread(target=player, args=(di, program), daemon=True).start()
    print(f"{len(program)} 命令を読み込みました。F8: 開始/停止  F9: 終了")
    with keyboard.GlobalHotKeys({"<f8>": toggle, "<f9>": quit_all}) as h:
        h.join()


if __name__ == "__main__":
    main()
