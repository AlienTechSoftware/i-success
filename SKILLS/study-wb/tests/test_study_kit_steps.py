#!/usr/bin/env python3
"""Step-by-step controls and URL state in study-kit (lib/study-kit/study-kit.js). Run:  python tests/test_study_kit_steps.py

Builds assets/template_01 into a temporary folder, serves it, and drives it in headless Chrome/Edge with a stub
speech engine (so no audio is needed). Checks:
  1. Next step starts narration and the group's play button shows Pause, Stop is enabled;
  2. Pause shows Resume and stops speech; Resume shows Pause again;
  3. Stop shows Play, disables Stop, stops speech, and keeps the steps already shown;
  4. the URL records how many steps are shown (k=);
  5. reloading that URL restores the shown steps silently (no speech);
  6. Restart steps clears the step count from the URL;
  7. verify() runs every problem's steps without speaking;
  0. the built page loads study-kit.js with a version tag of its contents.
Exit 0 = all passed. Writes only inside a temporary folder.
"""
import http.server
import socketserver
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

SKILL = Path(__file__).resolve().parent.parent
EXAMPLE = SKILL / "assets" / "template_01" / "content.example.yaml"
SCRIPTS = SKILL / "scripts"
results = []
sys.stdout.reconfigure(encoding="utf-8")

STUB = """
(() => { let speaking=false, queue=[], timer=null, current=null;
  const synth = { get speaking(){return speaking}, get pending(){return queue.length>0}, paused:false,
    speak(u){ queue.push(u); pump(); },
    cancel(){ queue=[]; clearTimeout(timer); speaking=false; current=null; },
    resume(){}, pause(){}, getVoices(){ return [] }, addEventListener(){} };
  function pump(){ if(speaking||!queue.length) return; speaking=true; current=queue.shift();
    timer=setTimeout(()=>{ speaking=false; const u=current; current=null; u&&u.onend&&u.onend({}); }, 300); }
  Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
  window.SpeechSynthesisUtterance = function(t){ this.text=t; this.rate=1; this.voice=null; };
})();
"""


def check(name, ok, detail=""):
    results.append((name, ok))
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  -> {detail}"))


def build(folder):
    """Build the template with at least three steps on its first problem, so Next step has room to move."""
    import yaml
    data = yaml.safe_load(EXAMPLE.read_text(encoding="utf-8"))
    prob = data["groups"][0]["problems"][0]
    steps = list(prob.get("steps", []))
    while len(steps) < 3:
        steps.append({"say": f"Extra step {len(steps) + 1} (added by the test).", "fill": {}})
    prob["steps"] = steps
    content = folder / "content.yaml"
    content.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
    subprocess.run([sys.executable, str(SCRIPTS / "build_study_aid.py"), str(content), "--out", str(folder)],
                   check=True, capture_output=True)
    return folder / f"{data['build']['name']}.html"


def serve(folder):
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(s, *a, **k):
            super().__init__(*a, directory=str(folder), **k)

        def log_message(s, *a):
            pass
    srv = socketserver.TCPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


JS_VIEW = "() => document.querySelector('.source-view:not([hidden])') || document.querySelector('.source-view')"


def state(page):
    return page.evaluate("""() => { const v=(%s)(); const g=v.closest('.group');
      const pp=g.querySelector('.steps-audio [data-ctl=playpause]'), sx=g.querySelector('.steps-audio [data-ctl=stop]');
      return { title: pp.title, stopDisabled: sx.disabled, shown: v.querySelectorAll('.steps ol li:not(.done)').length,
               speaking: window.speechSynthesis.speaking, hash: location.hash }; }""" % JS_VIEW)


def run():
    tmp = tempfile.mkdtemp(prefix="sk-steps-")
    page_path = build(Path(tmp))
    import hashlib, re
    html_text = page_path.read_text(encoding="utf-8")
    kit_hash = hashlib.sha256((SKILL / "lib" / "study-kit" / "study-kit.js").read_bytes()).hexdigest()[:12]
    m = re.search(r'study-kit\.js\?v=([0-9a-f]+)', html_text)
    check("0 built page loads study-kit.js with a version tag of its contents (defeats stale browser cache)", bool(m) and m.group(1) == kit_hash, str(m and m.group(1)))
    srv, port = serve(Path(tmp))
    import yaml
    first = yaml.safe_load(EXAMPLE.read_text(encoding="utf-8"))["groups"][0]["id"]
    page_name = page_path.name
    base = f"http://127.0.0.1:{port}/{page_name}#g={first}&p=1"
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
            pg = browser.new_page()
            pg.add_init_script(STUB)
            pg.goto(base)
            pg.wait_for_timeout(600)
            pg.evaluate("() => { const v=(%s)(); v.querySelector('button.step').click(); }" % JS_VIEW)
            pg.wait_for_timeout(100)
            s1 = state(pg)
            check("1 Next step: play shows Pause, Stop enabled, speaking", s1["title"] == "Pause" and not s1["stopDisabled"] and s1["speaking"], str(s1))

            pg.evaluate("() => (%s)().querySelector('button.step').click()" % JS_VIEW)
            pg.wait_for_timeout(100)
            s1b = state(pg)
            check("1 Next step while a step is still being read: play shows Pause and speech continues", s1b["title"] == "Pause" and s1b["speaking"] and s1b["shown"] == 2, str(s1b))
            pg.evaluate("() => (%s)().closest('.group').querySelector('.steps-audio [data-ctl=playpause]').click()" % JS_VIEW)
            pg.wait_for_timeout(100)
            s2 = state(pg)
            check("2 Pause: play shows Resume and speech stops", s2["title"] == "Resume" and not s2["speaking"], str(s2))

            pg.evaluate("() => (%s)().closest('.group').querySelector('.steps-audio [data-ctl=playpause]').click()" % JS_VIEW)
            pg.wait_for_timeout(100)
            s3 = state(pg)
            check("2 Resume: play shows Pause again", s3["title"] == "Pause", str(s3))

            pg.evaluate("() => (%s)().closest('.group').querySelector('.steps-audio [data-ctl=stop]').click()" % JS_VIEW)
            pg.wait_for_timeout(100)
            s4 = state(pg)
            check("3 Stop: play shows Play, Stop disabled, speech stopped, steps kept",
                  s4["title"] == "Play" and s4["stopDisabled"] and not s4["speaking"] and s4["shown"] == 2, str(s4))

            pg.evaluate("() => (%s)().querySelector('button.step').click()" % JS_VIEW)
            pg.wait_for_timeout(100)
            s5 = state(pg)
            check("3 Next step after Stop: shows the next step and speaks again", s5["shown"] == 3 and s5["speaking"], str(s5))
            pg.wait_for_timeout(1200)

            check("4 URL records the steps shown (k=3)", "k=3" in state(pg)["hash"], state(pg)["hash"])

            pg.goto(f"http://127.0.0.1:{port}/{page_name}" + pg.evaluate("() => location.hash"))
            pg.wait_for_timeout(600)
            s6 = state(pg)
            check("5 reload restores the shown steps without speaking", s6["shown"] == 3 and not s6["speaking"], str(s6))

            pg.evaluate("() => (%s)().querySelector('[data-sk=restart]') && (%s)().querySelector('[data-sk=restart]').click()" % (JS_VIEW, JS_VIEW))
            pg.wait_for_timeout(100)
            hash_after = pg.evaluate("() => location.hash")
            check("6 Restart steps clears the step count from the URL", "k=" not in hash_after, hash_after)

            ok = pg.evaluate("() => StudyKit.verify().ok")
            spoke = pg.evaluate("() => window.speechSynthesis.speaking")
            check("7 verify() runs all steps without speaking", ok is True and not spoke, f"ok={ok} speaking={spoke}")
            browser.close()
    finally:
        srv.shutdown()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(run())
