import React, {
  useRef,
  useState,
  useEffect
} from "../web_modules/react.js";
import {MonacoBinding, _SET_MONACO} from "./ext/y-monaco.js";
import yconfig2 from "./yconfig.js";
const baseUrl = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min";
const monacoPromised = (async () => {
  const wat = window;
  if (!wat.require) {
    const scr = document.createElement("script");
    scr.setAttribute("src", `${baseUrl}/vs/loader.min.js`);
    const load = new Promise((res) => scr.addEventListener("load", res));
    document.head.append(scr);
    await load;
    console.log("loaded require");
  }
  if (!wat.monaco) {
    wat.require.config({paths: {vs: `${baseUrl}/vs`}});
    wat.MonacoEnvironment = {getWorkerUrl: () => proxy};
    let proxy = URL.createObjectURL(new Blob([
      `
        self.MonacoEnvironment = {
            baseUrl: '${baseUrl}'
        };
        importScripts('${baseUrl}/vs/base/worker/workerMain.min.js');
    `
    ], {type: "text/javascript"}));
    await new Promise((res) => wat.require(["vs/editor/editor.main"], res));
    console.log("loaded monaco");
    _SET_MONACO(wat.monaco);
  }
  return wat.monaco;
})();
export const useMonaco = () => {
  const ref = useRef(null);
  const [editor, setEditor] = useState();
  const [mon, setMon] = useState();
  useEffect(() => {
    monacoPromised.then((mon2) => {
      const ed = mon2.editor.create(ref.current, {
        value: "",
        wordWrap: "on"
      });
      mon2.editor.setTheme("vs-dark");
      setMon(mon2);
      setEditor(ed);
    });
  }, []);
  useEffect(() => {
    if (editor) {
      const resize = () => {
        editor.layout();
      };
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
      };
    }
  }, [editor]);
  return [ref, editor, mon];
};
import style from "./monaco.module.css.proxy.js";
export const Editor = ({name, onChange}) => {
  const [ref, editor, mon] = useMonaco();
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (editor && mon && name) {
      const model = mon.editor.createModel("-", void 0, mon.Uri.file(name));
      editor.setModel(model);
      model.onDidChangeContent((e) => {
        setChanged(true);
      });
      const type = yconfig2.doc.getText("monaco");
      new MonacoBinding(type, model, new Set([editor]), yconfig2.provider.awareness);
      return () => {
        model.dispose();
      };
    }
  }, [editor]);
  const down = (e) => {
    if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.key == "s") {
      e.preventDefault();
      const v = editor?.getValue();
      if (v) {
        onChange(v);
        setChanged(false);
      }
    }
  };
  return /* @__PURE__ */ React.createElement("div", {
    className: style.container,
    onKeyDown: down
  }, yconfig2.initiator && /* @__PURE__ */ React.createElement("header", {
    className: style.header
  }, /* @__PURE__ */ React.createElement("span", null, name, " ", changed && "*"), /* @__PURE__ */ React.createElement("a", {
    href: "?" + yconfig2.room,
    target: "_blank",
    className: style.share
  }, "\u2197\uFE0E")), /* @__PURE__ */ React.createElement("div", {
    className: style.main,
    ref
  }));
};
