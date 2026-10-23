import vueRuntime from "vue/dist/vue.global.prod.js?raw";
import { previewErrors } from "./previewErrors";
export function browserDocument(source: string) {
  const script = (vueRuntime + "\n" + source).replace(
    /<\/script/gi,
    "<\\/script",
  );
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src 'unsafe-inline' 'unsafe-eval';style-src 'unsafe-inline';connect-src 'none';img-src data:;base-uri 'none';form-action 'none'"><style>body{margin:0;padding:26px;background:#102333;color:#e5f2f4;font:16px/1.9 system-ui,sans-serif}button,input,select{font:inherit;padding:7px 12px;border:1px solid #568075;border-radius:6px;margin:6px;background:#193c4a;color:#d9f9ed}button{cursor:pointer}button:focus-visible,input:focus-visible{outline:2px solid #ffd082}h2{font-size:22px}li{padding:5px}pre{white-space:pre-wrap;color:#ffd082}.tile{padding:20px;border:1px solid #456777;border-radius:10px}small{color:#99bdc3}</style></head><body><div id="app"></div>${previewErrors}<script>${script}</script></body></html>`;
}
