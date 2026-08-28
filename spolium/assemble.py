import assemble_body
import assemble_worklet
import assemble_engine_1
import assemble_engine_2
import assemble_engine_3

def get_head_css():
    return '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Spolium: mathematical granular synthesizer</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23191d24'/><path d='M6 22 L12 10 L18 18 L26 8' stroke='%23d4af37' stroke-width='2.5' fill='none' stroke-linecap='round'/><circle cx='12' cy='10' r='2' fill='%235fc9b3'/><circle cx='18' cy='18' r='2' fill='%23e0707f'/><circle cx='26' cy='8' r='2' fill='%23d4af37'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=VT323&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<style>
:root {
  --bg: #14171d; --bg-subtle: #1a1e27; --panel: #202632; --panel-edge: #2e3646; --panel-hi: #3b4559;
  --ink: #e6ecf4; --dim: #8b99ae; --faint: #5a687d; --gold: #d4af37; --gold-dim: #947b27; --gold-hi: #f3cf5b;
  --cyan: #4ecdc4; --magenta: #e06c75; --green: #6fd6a8; --lcd: #0d1117; --lcd-text: #96d8b6;
  --font-disp: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'Space Mono', ui-monospace, monospace;
  --font-lcd: 'VT323', monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--ink); font-family: var(--font-mono); font-size: 12.5px; line-height: 1.5; min-height: 100vh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
header { background: linear-gradient(180deg, #1c222c, #141820); border-bottom: 2px solid var(--panel-edge); padding: 12px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.brand { font-family: var(--font-disp); font-weight: 700; font-size: 22px; letter-spacing: 0.05em; color: var(--gold); text-shadow: 0 0 12px rgba(212, 175, 55, 0.25); display: flex; align-items: baseline; gap: 8px; }
.brand .sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--dim); }
.firmware { font-family: var(--font-lcd); font-size: 16px; background: var(--lcd); color: var(--lcd-text); padding: 2px 8px; border: 1px solid var(--panel-edge); border-radius: 3px; text-transform: uppercase; }
.grow { flex: 1; }
.btn { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; background: linear-gradient(180deg, #2b3342, #1d232e); color: var(--ink); border: 1px solid var(--panel-edge); border-radius: 4px; padding: 7px 13px; cursor: pointer; transition: all 0.12s ease; }
.btn:hover { border-color: var(--gold); color: var(--gold-hi); background: #252d3a; }
.btn.on { background: linear-gradient(180deg, #947b27, #625117); border-color: var(--gold); color: #fff; box-shadow: 0 0 10px rgba(212, 175, 55, 0.35); }
#midiStat { font-family: var(--font-lcd); font-size: 16px; background: var(--lcd); color: var(--dim); border: 1px solid var(--panel-edge); padding: 2px 8px; border-radius: 3px; }
#midiStat.active { color: var(--cyan); border-color: var(--cyan); }
.wrap { display: grid; grid-template-columns: 420px minmax(0, 1fr); flex: 1; min-height: 0; }
@media (max-width: 980px) { .wrap { grid-template-columns: 1fr; } }
.side { background: var(--bg-subtle); border-right: 2px solid var(--panel-edge); padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.main { padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.card { background: var(--panel); border: 1px solid var(--panel-edge); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2); }
.card-title { font-family: var(--font-disp); font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); display: flex; align-items: center; gap: 6px; }
.card-title::before { content: '//'; color: var(--faint); }
.dropzone { border: 2px dashed var(--panel-edge); border-radius: 6px; padding: 12px; text-align: center; cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease; background: #171b22; }
.dropzone:hover, .dropzone.dragover { border-color: var(--gold); background: rgba(212, 175, 55, 0.05); }
.dropzone p { color: var(--dim); font-size: 11px; }
.wave-wrap { position: relative; height: 90px; background: var(--lcd); border: 1px solid var(--panel-edge); border-radius: 4px; overflow: hidden; }
.wave-canvas { width: 100%; height: 100%; display: block; }
.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 3px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dim); }
input[type=number], input[type=text], select, textarea { font-family: var(--font-mono); font-size: 12px; background: #14171e; color: var(--ink); border: 1px solid var(--panel-edge); border-radius: 4px; padding: 6px 8px; }
input[type=number] { width: 80px; }
select { cursor: pointer; }
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--gold); }
textarea#grammar { width: 100%; min-height: 140px; resize: vertical; line-height: 1.5; font-size: 12px; padding: 10px; background: #14171e; border: 1px solid var(--panel-edge); border-radius: 4px; tab-size: 2; }
.err { font-size: 11px; min-height: 16px; color: var(--magenta); }
.err.ok { color: var(--green); }
.slider-grid { display: grid; grid-template-columns: 75px 1fr 50px; gap: 10px; align-items: center; }
.slider-label { font-size: 10px; text-transform: uppercase; color: var(--dim); }
input[type=range] { width: 100%; height: 18px; appearance: none; background: transparent; cursor: pointer; accent-color: var(--gold); }
input[type=range]::-webkit-slider-runnable-track { height: 6px; background: #14171e; border: 1px solid var(--panel-edge); border-radius: 3px; }
input[type=range]::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; margin-top: -4px; background: var(--gold); border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
output { font-family: var(--font-lcd); font-size: 16px; text-align: right; color: var(--gold-hi); }
.table-wrap { max-height: 150px; overflow-y: auto; border: 1px solid var(--panel-edge); border-radius: 4px; }
table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; }
th { background: #181d26; color: var(--gold); padding: 5px 8px; position: sticky; top: 0; border-bottom: 1px solid var(--panel-edge); }
td { padding: 4px 8px; border-bottom: 1px solid #232a36; color: var(--dim); }
tr:hover { background: #252d3a; cursor: pointer; }
tr.solo { background: #323d4e; color: var(--gold-hi); }
tr.solo td { color: var(--gold-hi); font-weight: bold; }
.plot-canvas { width: 100%; height: 120px; background: var(--lcd); border: 1px solid var(--panel-edge); border-radius: 4px; display: block; }
.presets { display: flex; flex-wrap: wrap; gap: 5px; }
.chip { font-family: var(--font-mono); font-size: 10.5px; background: #171b23; color: var(--dim); border: 1px solid var(--panel-edge); border-radius: 3px; padding: 3px 8px; cursor: pointer; transition: all 0.12s ease; }
.chip:hover { border-color: var(--gold); color: var(--gold-hi); }
.surface-card { display: flex; flex-direction: column; gap: 10px; }
.surface-view { min-height: 140px; position: relative; user-select: none; touch-action: none; }
#piano { height: 130px; position: relative; overflow-x: auto; white-space: nowrap; }
.wk { position: absolute; top: 0; bottom: 0; background: linear-gradient(180deg, #d8dee8, #a4b0c2); border: 1px solid #14171d; border-radius: 0 0 4px 4px; cursor: pointer; box-shadow: inset 0 -4px 8px rgba(0,0,0,0.25); }
.wk.active { background: linear-gradient(180deg, var(--gold), #7a631a); box-shadow: inset 0 0 8px rgba(0,0,0,0.5); }
.bk { position: absolute; top: 0; height: 62%; background: linear-gradient(180deg, #2b3340, #14181f); border: 1px solid #0c0e12; border-radius: 0 0 3px 3px; z-index: 2; cursor: pointer; }
.bk.active { background: linear-gradient(180deg, var(--gold-hi), var(--gold-dim)); }
.klabel { position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; font: 11px var(--font-lcd); color: #3b4559; pointer-events: none; }
#hexgrid { display: none; height: 140px; position: relative; overflow: hidden; background: var(--lcd); border: 1px solid var(--panel-edge); border-radius: 4px; }
.hex { position: absolute; width: 44px; height: 48px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background: #252d3a; border: 1px solid var(--panel-edge); display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--dim); cursor: pointer; transition: transform 0.05s ease; }
.hex.active { background: var(--gold); color: #111; font-weight: bold; transform: scale(0.94); }
#ribbon { display: none; height: 120px; background: linear-gradient(90deg, #1c232d, #252f3d, #1c232d); border: 1px solid var(--panel-edge); border-radius: 4px; position: relative; cursor: crosshair; }
.ribbon-touch { position: absolute; top: 0; bottom: 0; width: 4px; background: var(--gold); box-shadow: 0 0 10px var(--gold-hi); transform: translateX(-50%); pointer-events: none; display: none; }
.qwerty-help { font-size: 11px; color: var(--dim); line-height: 1.6; }
.qwerty-help kbd { background: #181d26; border: 1px solid var(--panel-edge); border-radius: 3px; padding: 1px 5px; color: var(--gold-hi); }
</style>
</head>
'''

def main():
    head_css = get_head_css()
    body = assemble_body.get_body()
    worklet_code = assemble_worklet.get_worklet_code()
    engine_code = assemble_engine_1.get_part_1() + "\n" + assemble_engine_2.get_part_2() + "\n" + assemble_engine_3.get_part_3()

    index_html = head_css + body + '\n<script>\nconst WORKLET_SRC = `' + worklet_code + '`;\n\n' + engine_code + '\n</script>\n</body>\n</html>\n'

    with open('F:/xyh/anexacta/spolium/index.html', 'w', encoding='utf-8') as f:
        f.write(index_html)
    print('Generated index.html successfully, total chars:', len(index_html))

if __name__ == '__main__':
    main()
