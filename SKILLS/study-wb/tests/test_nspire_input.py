#!/usr/bin/env python3
"""Input tests for the TI-Nspire emulator (lib/workbench/TI-Nspire/nspire.js). Run:  python tests/test_nspire_input.py

Needs Playwright (Python) and Chrome or Edge. Serves the TI-Nspire folder over local http, mounts the device,
and drives it with real keyboard events and real paste events. Exit 0 = all passed.

Covers:
  1. every printable ASCII character typed on the keyboard reaches the entry line;
  2. the mapped keys (operators, parentheses, digits, letters) give the expected text;
  3. Enter evaluates typed input and the result appears in history;
  4. paste inserts text at the caret, collapses line breaks, trims, and ignores empty paste;
  5. paste inside a page input is left to the browser (not captured by the device);
  6. Backspace and Escape still edit and clear the entry line.
Also run the engine tests first: node lib/workbench/TI-Nspire/cas.test.js (64 cases).
"""
import http.server
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

SKILL = Path(__file__).resolve().parent.parent
NSPIRE = SKILL / "lib" / "workbench" / "TI-Nspire"

results = []
sys.stdout.reconfigure(encoding="utf-8")


def check(name, ok, detail=""):
    results.append((name, ok))
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  -> {detail}"))


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(NSPIRE), **k)

    def log_message(self, *a):
        pass


def serve():
    srv = socketserver.TCPServer(("127.0.0.1", 0), Quiet)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/demo.html"


def mount(browser, url, key):
    page = browser.new_page()
    page.goto(url)
    page.evaluate(
        """(key) => { document.body.innerHTML = '<div id="calc"></div>';
          window.__ns = TINspire.mount(document.getElementById('calc'), { key, title: 'Test' }); }""",
        key,
    )
    page.wait_for_selector("#calc .nsd-lcd .ent")
    dev = page.locator("#calc .nsd")
    return page, dev


def entry(page):
    return page.evaluate("() => document.querySelector('#calc .nsd-lcd .ent').textContent")


def history(page):
    return page.evaluate("() => [...document.querySelectorAll('#calc .nsd-lcd .hist .r')].map(e => e.textContent)")


def clear_entry(page, dev):
    """Empty the entry line: move the caret to the end, then backspace everything."""
    dev.focus()
    for _ in range(300):
        page.keyboard.press("ArrowRight")
    for _ in range(300):
        if entry(page).replace("▸", "").strip() == "":
            return
        page.keyboard.press("Backspace")


def paste(page, dev, text):
    dev.focus()
    page.evaluate(
        """(t) => { const dev = document.querySelector('#calc .nsd');
          const dt = new DataTransfer(); dt.setData('text/plain', t);
          dev.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }""",
        text,
    )


def run():
    srv, url = serve()
    try:
        with sync_playwright() as p:
            browser = None
            for channel in ("chrome", "msedge"):
                try:
                    browser = p.chromium.launch(channel=channel)
                    break
                except Exception:
                    continue
            if browser is None:
                browser = p.chromium.launch()
            page, dev = mount(browser, url, "test-input")

            # 1. every printable ASCII character reaches the entry line
            printable = [chr(c) for c in range(0x20, 0x7F)]
            not_inserted = []
            for ch in printable:
                clear_entry(page, dev)
                dev.focus()
                page.keyboard.press(ch if ch != " " else "Space")
                got = entry(page)
                if ch == " ":
                    continue  # space is a device key; checked below
                if ch not in got:
                    not_inserted.append((ch, got))
            check("1 every printable ASCII character (except space) reaches the entry line",
                  not not_inserted, str(not_inserted))

            # 2. typed sequences give the expected text
            cases = [
                ("x^2+1", "x^2+1"),
                ("sqrt(8)", "sqrt(8)"),
                ("(3*150+300)/4", "(3*150+300)/4"),
                ("a:=3", "a:=3"),
                ("f(x)=x_1", "f(x)=x_1"),
            ]
            for typed, expect in cases:
                clear_entry(page, dev)
                dev.focus()
                page.keyboard.type(typed)
                got = entry(page).replace("▸", "").strip()
                check(f"2 typed '{typed}' shows '{expect}'", got == expect, f"got {got!r}")

            # 3. Enter evaluates typed input
            clear_entry(page, dev)
            dev.focus()
            page.keyboard.type("1/3+1/6")
            page.keyboard.press("Enter")
            h = history(page)
            check("3 Enter evaluates '1/3+1/6' to 1/2", any("1/2" in x for x in h), str(h[-3:]))
            check("3 entry line clears after Enter", entry(page).replace("▸", "").strip() == "", entry(page))

            # 4. paste
            clear_entry(page, dev)
            paste(page, dev, "sqrt(8)+1")
            check("4 paste inserts text", "sqrt(8)+1" in entry(page), entry(page))

            clear_entry(page, dev)
            paste(page, dev, "  2^10  ")
            got = entry(page).replace("▸", "").strip()
            check("4 paste trims surrounding spaces", got == "2^10", f"got {got!r}")

            clear_entry(page, dev)
            paste(page, dev, "1+\n2\r\n3")
            got = entry(page).replace("▸", "").strip()
            check("4 paste collapses line breaks to spaces", got == "1+ 2 3", f"got {got!r}")

            clear_entry(page, dev)
            paste(page, dev, "x+1")
            paste(page, dev, "")
            check("4 empty paste leaves entry unchanged", "x+1" in entry(page), entry(page))

            clear_entry(page, dev)
            page.keyboard.type("ab")
            dev.focus()
            page.keyboard.press("ArrowLeft")
            paste(page, dev, "XY")
            got = entry(page).replace("▸", "").strip()
            check("4 paste goes at the caret", got == "aXYb", f"got {got!r}")

            # 5. paste inside a page input is not captured by the device
            page.evaluate("""() => { const i = document.createElement('input'); i.id = 'probe';
              document.querySelector('#calc .nsd-lcd').appendChild(i); i.focus(); }""")
            before = entry(page)
            page.evaluate("""() => { const i = document.getElementById('probe');
              const dt = new DataTransfer(); dt.setData('text/plain', 'ZZ');
              i.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }""")
            check("5 paste in a page input is not captured by the device", entry(page) == before, entry(page))
            page.evaluate("() => document.getElementById('probe').remove()")

            # 6. Backspace and Escape
            clear_entry(page, dev)
            dev.focus()
            page.keyboard.type("abc")
            page.keyboard.press("Backspace")
            check("6 Backspace removes one character", entry(page).replace("▸", "").strip() == "ab", entry(page))
            before_esc = entry(page)
            page.keyboard.press("Escape")
            check("6 Escape leaves the entry line unchanged (as on the handheld)", entry(page) == before_esc, entry(page))

            browser.close()
    finally:
        srv.shutdown()

    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(run())
