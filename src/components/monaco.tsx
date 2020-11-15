/// MEGA HACKS

import { useRef, useState, RefObject, useEffect } from 'react';
import type TMonaco from 'monaco-editor';

import { useMediaQuery } from './hooks.js';

// https://cdnjs.com/libraries/monaco-editor

const baseUrl =
  'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min';

const integrity =
  'sha512-dx6A3eMO/vvLembE8xNGc3RKUytoTIX3rNO5uMEhzhqnXYx1X5XYmjfZP7vxYv7x3gBhdj7Pgys8DUjdbDaLAA==';

const monacoPromised = (async () => {
  // don't show typescript how hacky I am
  const wat = window as any;

  if (!wat.require) {
    const scr = document.createElement('script');
    scr.setAttribute('src', `${baseUrl}/vs/loader.min.js`);
    scr.setAttribute('integrity', integrity);
    scr.setAttribute('crossorigin', 'anonymous');

    const load = new Promise((res) => scr.addEventListener('load', res));
    document.head.append(scr);

    await load;
    console.log('loaded require');
  }

  if (!wat.monaco) {
    wat.require.config({ paths: { vs: `${baseUrl}/vs` } });

    wat.MonacoEnvironment = { getWorkerUrl: () => proxy };
    let proxy = URL.createObjectURL(
      new Blob(
        [
          `
        self.MonacoEnvironment = {
            baseUrl: '${baseUrl}'
        };
        importScripts('${baseUrl}/vs/base/worker/workerMain.min.js');
    `,
        ],
        { type: 'text/javascript' },
      ),
    );

    await new Promise((res) => wat.require(['vs/editor/editor.main'], res));

    console.log('loaded monaco');
  }

  return wat.monaco;
})();

/** last step in a series of hacks */
export const useMonaco = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<TMonaco.editor.IStandaloneCodeEditor>();
  const [mon, setMon] = useState<typeof TMonaco.editor>();

  const lightMode = useMediaQuery('(prefers-color-scheme: light)');
  useEffect(() => {
    if (mon) {
      (mon as any).editor.setTheme(lightMode ? 'vs-light' : 'vs-dark');
    }
  }, [mon, lightMode]);

  useEffect(() => {
    monacoPromised.then((mon) => {
      const ed = mon.editor.create(ref.current, {
        value: '',
        wordWrap: 'on',
      });

      setMon(mon);
      setEditor(ed);
    });
  }, []);

  useEffect(() => {
    if (editor) {
      const resize = () => {
        editor.layout();
      };
      window.addEventListener('resize', resize);

      return () => {
        window.removeEventListener('resize', resize);
      };
    }
  }, [editor]);

  return [ref, editor, mon] as [
    RefObject<HTMLDivElement>,
    TMonaco.editor.IStandaloneCodeEditor?,
    typeof TMonaco?,
  ];
};
