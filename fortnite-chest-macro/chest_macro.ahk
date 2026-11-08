#Requires AutoHotkey v2.0
#SingleInstance Force
; ============================================================
;  Fortnite 宝箱を開け続けるマクロ (PC / AutoHotkey v2)
;
;  F8  : 開始 / 停止 (トグル)
;  F9  : 緊急終了 (スクリプトごと終了。押しっぱなしのキーも解除)
;
;  動き: 「Eを長押し(宝箱を開ける)」→ 少し待つ → 繰り返し
;        オプションで、宝箱の間を少し歩く動作も入れられます。
; ============================================================

; ---------------- 設定 (ここだけ調整すればOK) ----------------
HoldMs     := 1300     ; Eを押し続ける時間(ms)。宝箱が開く時間より少し長く
GapMs      := 500      ; 1回開けてから次の動作までの待ち時間(ms)
JitterMs   := 120      ; 時間にランダムなゆらぎを足す(ms)。人が操作しているように見える
WalkEnabled := false   ; true にすると、開けた後に少し前進する
WalkMs     := 700      ; 前進する時間(ms)
; キー設定 (スキャンコード指定: ゲームに確実に入力が届くように)
InteractKey := "sc012" ; E  (フォートナイトのデフォルトの「操作/開ける」)
WalkKey     := "sc011" ; W  (前進)
; --------------------------------------------------------------

running := false
count := 0

SetKeyDelay(30, 30)

F8:: {
    global running, count
    running := !running
    if running {
        count := 0
        Notice("宝箱マクロ ON  (F8で停止 / F9で終了)")
        SetTimer(Loop_, -50)
    } else {
        ReleaseAll()
        Notice("宝箱マクロ OFF  (開けた回数: " count ")")
    }
}

F9:: {
    ReleaseAll()
    Notice("終了します")
    Sleep(500)
    ExitApp()
}

Loop_() {
    global running, count
    if !running
        return

    ; 宝箱を開ける: E を長押し
    Send("{" InteractKey " down}")
    Wait(HoldMs)
    Send("{" InteractKey " up}")
    count += 1
    if !running
        return

    ; 任意: 少し前進して次の宝箱へ
    if WalkEnabled {
        Send("{" WalkKey " down}")
        Wait(WalkMs)
        Send("{" WalkKey " up}")
        if !running
            return
    }

    Wait(GapMs)
    SetTimer(Loop_, -10)
}

; ゆらぎ付きの待機。停止(F8)に素早く反応するため細かく刻む
Wait(ms) {
    global running, JitterMs
    total := ms + Random(0, JitterMs)
    waited := 0
    while (waited < total && running) {
        Sleep(20)
        waited += 20
    }
}

ReleaseAll() {
    global InteractKey, WalkKey
    Send("{" InteractKey " up}")
    Send("{" WalkKey " up}")
}

Notice(text) {
    ToolTip(text, 20, 20)
    SetTimer(() => ToolTip(), -2500)
}
