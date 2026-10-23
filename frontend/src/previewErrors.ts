export const previewErrors = `<script>
function showPreviewError(message){const p=document.createElement('pre');p.setAttribute('role','alert');p.style.cssText='white-space:pre-wrap;color:#ffd082;padding:12px;border:1px solid #a98458';p.textContent=String(message);document.body.append(p);}
window.addEventListener('error',event=>showPreviewError(event.message));
window.addEventListener('unhandledrejection',event=>showPreviewError(event.reason?.message||event.reason));
</script>`;
