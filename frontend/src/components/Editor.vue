<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as monaco from "monaco-editor/editor/editor.api.js";
import "monaco-editor/languages/definitions/java/register.js";
import "monaco-editor/languages/definitions/javascript/register.js";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import { resolvedTheme } from '../theme';
const props = defineProps<{
    modelValue: string;
    language: string;
    line?: number;
    readOnly?: boolean;
  }>(),
  emit = defineEmits<{ "update:modelValue": [string] }>();
const el = ref<HTMLElement>();
let editor: monaco.editor.IStandaloneCodeEditor,
  observer: ResizeObserver,
  decoration: monaco.editor.IEditorDecorationsCollection,
  setting = false;
(self as any).MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};
onMounted(() => {
  monaco.editor.defineTheme("trace", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "64738c" },
      { token: "keyword", foreground: "c9a5f7" },
      { token: "number", foreground: "efb96f" },
      { token: "string", foreground: "81d4ae" },
    ],
    colors: {
      "editor.background": "#101722",
      "editor.foreground": "#cbd7e7",
      "editorLineNumber.foreground": "#45536b",
      "editorLineNumber.activeForeground": "#e6b86c",
      "editor.lineHighlightBackground": "#192331",
      "editor.selectionBackground": "#284452",
      "editorCursor.foreground": "#73e1d5",
      "editorGutter.background": "#101722",
      "scrollbarSlider.background": "#34415677",
    },
  });
  editor = monaco.editor.create(el.value!, {
    value: props.modelValue,
    language: props.language,
    theme: resolvedTheme.value === 'light' ? 'vs' : 'trace',
    fontFamily: "Cascadia Code, Consolas, monospace",
    fontSize: 13,
    lineHeight: 23,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: "off",
    padding: { top: 18, bottom: 20 },
    lineNumbersMinChars: 3,
    renderLineHighlight: "none",
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    tabSize: 2,
    automaticLayout: false,
    ariaLabel: "代码编辑器",
    accessibilitySupport: "auto",
    readOnly: props.readOnly || false,
  });
  editor.onDidChangeModelContent(() => {
    if (!setting) emit("update:modelValue", editor.getValue());
  });
  decoration = editor.createDecorationsCollection();
  observer = new ResizeObserver(() => editor.layout());
  observer.observe(el.value!);
  highlight();
});
function highlight() {
  if (!editor) return;
  decoration.set(
    props.line
      ? [
          {
            range: new monaco.Range(props.line, 1, props.line, 1),
            options: {
              isWholeLine: true,
              className: "trace-current-line",
              linesDecorationsClassName: "trace-line-marker",
            },
          },
        ]
      : [],
  );
  if (props.line)
    editor.revealLineInCenterIfOutsideViewport(
      props.line,
      monaco.editor.ScrollType.Immediate,
    );
}
watch(
  () => props.modelValue,
  (v) => {
    if (editor && v !== editor.getValue()) {
      setting = true;
      editor.setValue(v);
      setting = false;
    }
  },
);
watch(
  () => props.language,
  (v) => {
    if (editor) monaco.editor.setModelLanguage(editor.getModel()!, v);
  },
);
watch(() => props.line, highlight);
watch(()=>props.readOnly,v=>editor?.updateOptions({readOnly:!!v}));
watch(resolvedTheme, v => monaco.editor.setTheme(v === 'light' ? 'vs' : 'trace'));
onBeforeUnmount(() => {
  observer?.disconnect();
  const model = editor?.getModel();
  editor?.dispose();
  model?.dispose();
});
</script>
<template><div ref="el" class="code-editor"></div></template>
