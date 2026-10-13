import os, html
# 各サイトの確定情報だけ入れる。ジャンル/ポイントは寺田さんの実績の事実に合わせて編集
SITES=[
 dict(file="03_stand", no="03", name="STAND", genre="ジム", points=["制作事例","スマホ対応","1ページ30,000円〜"]),
 dict(file="04_hinata", no="04", name="喫茶ひなた", genre="喫茶店", points=["制作事例","スマホ対応","1ページ30,000円〜"]),
 dict(file="05_shiba", no="05", name="STUDIO SHIBA", genre="(ジャンルを入力)", points=["制作事例","スマホ対応","1ページ30,000円〜"]),
]
for s in SITES:
    shot=f"shots/{s['file']}.png"
    inner=(f'<img src="../{shot}">' if os.path.exists(shot) else '<div class="ph">ここにスクリーンショット</div>')
    pills="".join(f'<span class="pill">{html.escape(p)}</span>' for p in s["points"])
    open(f"{s['file']}.html","w",encoding="utf-8").write(f'''<!doctype html><html lang="ja"><meta charset="utf-8">
<link rel="stylesheet" href="style.css"><body>
<div class="safe"><span class="tag">制作事例 {s['genre']}</span><div class="num">{s['no']}</div>
<h1><em>{html.escape(s['name'])}</em><span style="font-size:52px;color:#fff">のホームページ</span></h1>
<div class="sub">月額0円のホームページ制作</div></div>
<div class="frame" style="top:{112+230}px"><div class="bar"><i></i><i></i><i></i></div>{inner}</div>
<div class="pills" style="top:{112+230+560+30}px">{pills}</div>
<div class="foot"><span>Masaru Web</span><span>寺田勝</span></div></body></html>''')
