import glob, subprocess, http.server, threading, functools, os
from PIL import Image
import gen  # noqa: generates html
from playwright.sync_api import sync_playwright
h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=".")
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8765),h); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=next(iter(__import__("glob").glob("/opt/pw-browsers/chromium*/chrome-linux*/chrome")),None)); pg=b.new_page(viewport={"width":1220,"height":1240})
    for f in sorted(glob.glob("0[3-5]_*.html")):
        pg.goto(f"http://127.0.0.1:8765/{f}"); pg.wait_for_timeout(300)
        out=f"out/{f[:-5]}.png"; pg.screenshot(path=out)
        Image.open(out).crop((0,112,1220,1128)).save(f"out/{f[:-5]}_list.png"); print(out)
    b.close()
srv.shutdown()
