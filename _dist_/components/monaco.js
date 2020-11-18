import {useRef, useState, useEffect} from "../../web_modules/react.js";
import {useMediaQuery} from "./hooks.js";
const baseUrl = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min";
const integrity = "sha512-dx6A3eMO/vvLembE8xNGc3RKUytoTIX3rNO5uMEhzhqnXYx1X5XYmjfZP7vxYv7x3gBhdj7Pgys8DUjdbDaLAA==";
const monacoPromised = (async () => {
  const win = window;
  if (!win.require) {
    const scr = document.createElement("script");
    scr.setAttribute("src", `${baseUrl}/vs/loader.min.js`);
    scr.setAttribute("integrity", integrity);
    scr.setAttribute("crossorigin", "anonymous");
    const load = new Promise((res) => scr.addEventListener("load", res));
    document.head.append(scr);
    await load;
  }
  if (!win.monaco) {
    win.require.config({paths: {vs: `${baseUrl}/vs`}});
    win.MonacoEnvironment = {getWorkerUrl: () => proxy};
    let proxy = URL.createObjectURL(new Blob([
      `
        self.MonacoEnvironment = { baseUrl: '${baseUrl}' };
        importScripts('${baseUrl}/vs/base/worker/workerMain.min.js');
        `
    ], {type: "text/javascript"}));
    await new Promise((res) => win.require(["vs/editor/editor.main"], res));
  }
  return win.monaco;
})();
export const useMonaco = () => {
  const ref = useRef(null);
  const [editor, setEditor] = useState();
  const [mon, setMon] = useState();
  const lightMode = useMediaQuery("(prefers-color-scheme: light)");
  useEffect(() => {
    if (mon) {
      mon.editor.setTheme(lightMode ? "vs-light" : "vs-dark");
    }
  }, [mon, lightMode]);
  useEffect(() => {
    monacoPromised.then((mon2) => {
      const ed = mon2.editor.create(ref.current, {
        value: "",
        wordWrap: "on"
      });
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
