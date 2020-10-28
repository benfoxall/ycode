/// MEGA HACKS

import { useRef, useState, RefObject, useEffect } from "react";
import type TMonaco from 'monaco-editor'

const baseUrl = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min"

const monacoPromised = (async () => {

  // don't show typescript how hacky I am
  const wat = window as any;

  if(!wat.require) {
    const scr = document.createElement('script');
    scr.setAttribute('src',`${baseUrl}/vs/loader.min.js`);
    const load = new Promise(res => scr.addEventListener("load", res))
    document.head.append(scr);

    await load;
    console.log("loaded require");
  }

  if(!wat.monaco) {

    wat.require.config({ paths: { 'vs': `${baseUrl}/vs` } })

    wat.MonacoEnvironment = { getWorkerUrl: () => proxy };
    let proxy = URL.createObjectURL(new Blob([`
        self.MonacoEnvironment = {
            baseUrl: '${baseUrl}'
        };
        importScripts('${baseUrl}/vs/base/worker/workerMain.min.js');
    `], { type: 'text/javascript' }));
    
    await new Promise(res => wat.require(["vs/editor/editor.main"], res));

    console.log("loaded monaco");
  }
  
  return wat.monaco;
})();



/** last step in a series of hacks */
export const useMonaco = (content: string) => {
  const ref = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<TMonaco.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    monacoPromised.then((mon) => {
      const ed = mon.editor.create(ref.current, {
        value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join(
          '\n',
        ),
        // language: 'javascript',
      });

      setEditor(ed);
    });
  }, []);

  useEffect(() => {
    if(editor) {
      const resize = () => {
        editor.layout()
      }
      window.addEventListener("resize", resize)

      return () => {
        window.removeEventListener("resize", resize)
      }
    }

  }, [editor])

  return [ref, editor] as [
    RefObject<HTMLDivElement>,
    TMonaco.editor.IStandaloneCodeEditor?,
  ];
};

