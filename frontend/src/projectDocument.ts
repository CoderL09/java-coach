import type { Project } from "./projects";
import { previewErrors } from "./previewErrors";
export function projectDocument(
  project: Project,
  core = project.core,
  state: unknown = null,
) {
  const adapters: Record<string, [string, string]> = {
    "pixel-board": [
      "({cells,history:history.slice(-8)})",
      "cells=s.cells;history=s.history||[];draw();",
    ],
    "life-grid": ["({cells})", "cells=s.cells;draw();"],
    "sorting-race": [
      "({values,i,end})",
      "values=s.values;i=s.i;end=s.end;draw();",
    ],
    "orbit-clock": [
      '({time,speed:document.querySelector("#speed").value})',
      'time=s.time;document.querySelector("#speed").value=s.speed;',
    ],
    "fractal-forest": [
      '({depth:document.querySelector("#depth").value,angle:document.querySelector("#angle").value})',
      'document.querySelector("#depth").value=s.depth;document.querySelector("#angle").value=s.angle;draw();',
    ],
    "physics-balls": [
      '({balls,gravity:document.querySelector("#gravity").value})',
      'balls=s.balls;document.querySelector("#gravity").value=s.gravity;',
    ],
    "particle-field": [
      "({particles,target,sign})",
      "particles.splice(0,particles.length,...s.particles);target=s.target;sign=s.sign;",
    ],
    "word-rain": [
      "({score,miss,words})",
      "score=s.score;miss=s.miss;words=s.words;draw();",
    ],
    "pet-garden": ["({state})", "state=s.state;draw();"],
    "step-sequencer": [
      '({pattern,step,tempo:document.querySelector("#tempo").value})',
      'pattern=s.pattern;step=s.step;document.querySelector("#tempo").value=s.tempo;draw();',
    ],
    "maze-runner": [
      "({walls:[...walls],path})",
      "walls=new Set(s.walls);path=s.path;draw();",
    ],
    "graph-routes": [
      '({weight:document.querySelector("#weight").value})',
      'document.querySelector("#weight").value=s.weight;draw();',
    ],
  };
  const adapter = adapters[project.id];
  const bridge = adapter
    ? `\n{const s=${JSON.stringify(state).replace(/</g, "\\u003c")};if(s){${adapter[1]}}}\nwindow.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='trace:save')return;parent.postMessage({type:'trace:state',nonce:e.data.nonce,state:${adapter[0]}},'*');});`
    : "";
  const script = (core + "\n" + project.engine + bridge).replace(
    /<\/script/gi,
    "<\\/script",
  );
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src data:; media-src 'none'; form-action 'none'; base-uri 'none'"><style>
 *{box-sizing:border-box}body{margin:0;background:#0c1927;color:#d8e9ef;font:14px/1.7 system-ui,sans-serif;padding:18px;display:flex;flex-direction:column;justify-content:center;min-height:100vh}button,input{font:inherit}button{border:1px solid #436174;border-radius:6px;background:#203748;color:#e0efff;padding:6px 13px;cursor:pointer}button:hover{border-color:#70e5bd}button:focus-visible,input:focus-visible{outline:2px solid #ffd082;outline-offset:2px}canvas{display:block;width:100%;max-height:65vh;object-fit:contain;aspect-ratio:640/440;touch-action:manipulation}.tools{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin:12px 0}.tools input{max-width:160px}input{background:#162c3c;color:#e6f2f6;border:1px solid #436174;border-radius:4px;padding:5px}.pixels,.maze{display:grid;gap:2px;max-width:400px;width:min(100%,70vh);margin:10px auto;aspect-ratio:1;grid-template-columns:repeat(16,1fr)}.maze{grid-template-columns:repeat(12,1fr)}.pixels button,.maze button{padding:0;border:0;border-radius:2px;min-width:0;min-height:0;font-size:10px}.bars{height:300px;display:flex;align-items:end;gap:8px;max-width:560px;width:100%;margin:20px auto}.bars div{flex:1;border-radius:6px 6px 0 0;color:#102532;text-align:center;padding-top:8px;max-height:100%}.word-sky{height:350px;position:relative;overflow:hidden;background:radial-gradient(ellipse at bottom,#193a52,#0c1927);border-bottom:2px solid #70e5bd}.word-sky span{position:absolute;font:20px monospace;color:#8eeacb}.pet{text-align:center;max-width:380px;margin:15px auto;width:100%}#face{font-size:90px;color:#70e5bd;line-height:1.8}.pet progress{display:block;width:100%;height:18px;accent-color:#70e5bd}.pet #meters>div{margin:12px 0;text-align:left}.notes{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;max-width:560px;width:100%;margin:15px auto}.notes button{aspect-ratio:1;padding:0;min-width:0}p{text-align:center;font-size:12px;color:#9cb4c6}
 </style></head><body>${project.body}${previewErrors}<script>${script}</script></body></html>`;
}
