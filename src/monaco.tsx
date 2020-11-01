/// MEGA HACKS

import React, {
  useRef,
  useState,
  RefObject,
  useEffect,
  FC,
  KeyboardEventHandler,
} from 'react';
import type TMonaco from 'monaco-editor';

import type * as Y from 'yjs';

// @ts-expect-error
import { MonacoBinding, _SET_MONACO } from './ext/y-monaco.js';

import yconfig from './yconfig';

const baseUrl =
  'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min';

const monacoPromised = (async () => {
  // don't show typescript how hacky I am
  const wat = window as any;

  if (!wat.require) {
    const scr = document.createElement('script');
    scr.setAttribute('src', `${baseUrl}/vs/loader.min.js`);
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

    _SET_MONACO(wat.monaco);
  }

  return wat.monaco;
})();

/** last step in a series of hacks */
export const useMonaco = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<TMonaco.editor.IStandaloneCodeEditor>();
  const [mon, setMon] = useState<typeof TMonaco.editor>();

  useEffect(() => {
    monacoPromised.then((mon) => {
      const ed = mon.editor.create(ref.current, {
        value: '',
        wordWrap: 'on',
      });

      mon.editor.setTheme('vs-dark');

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

import style from './monaco.module.css';

export const Editor: FC<{
  // name?: string;
  onChange: (s: string) => void;
}> = ({ onChange }) => {
  const [ref, editor, mon] = useMonaco();

  const [changed, setChanged] = useState(false);

  const [name, setName] = useState<string>();

  useEffect(() => {
    const name = yconfig.doc.getText('monaco:name');

    let val = name;

    const callback = (f: Y.YTextEvent) => {
      if (f.adds.length) {
        const current = name.toJSON();
        if (current !== val) {
          setName(current);
          val = current;
        }
      }
    };
    name.observe(callback);

    return () => {
      name.unobserve(callback);
    };
  }, []);

  useEffect(() => {
    if (editor && mon && name) {
      console.log('NEW MODEL', name);

      const model = mon.editor.createModel('_', undefined, mon.Uri.file(name));

      model.onDidChangeContent((e) => {
        setChanged(true);
      });

      const type = yconfig.doc.getText('monaco:content');

      new MonacoBinding(
        type,
        model,
        new Set([editor]),
        yconfig.provider.awareness,
      );

      editor.setModel(model);

      return () => {
        model.dispose();
      };
    }
  }, [editor, name]);

  const down: KeyboardEventHandler = (e) => {
    if (
      (window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey) &&
      e.key == 's'
    ) {
      e.preventDefault();

      const v = editor?.getValue();
      if (v) {
        onChange(v);
        setChanged(false);
      }
    }
  };

  return (
    <div className={style.container} onKeyDown={down}>
      {yconfig.initiator && (
        <header className={style.header}>
          <span>
            {name} {changed && '*'}
          </span>

          <a href={'?' + yconfig.room} target="_blank" className={style.share}>
            ↗︎
          </a>
        </header>
      )}
      <div className={style.main} ref={ref} />
    </div>
  );
};
