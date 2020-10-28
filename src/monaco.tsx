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
        // language: 'javascript',
      });

      setMon(mon.editor);

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
    typeof TMonaco.editor?,
  ];
};

import style from './monaco.module.css';

export const Editor: FC<{
  name?: string;
  content: string;
  onChange: (s: string) => void;
}> = ({ content, name, onChange }) => {
  const [ref, editor, mon] = useMonaco();

  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (editor) {
      editor.setValue(content);

      const disposable = editor.getModel()?.onDidChangeContent((e) => {
        setChanged(true);
      });

      if (disposable) {
        return () => {
          disposable.dispose();
        };
      }
    }
  }, [editor]);

  mon?.setTheme('vs-dark');

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
      <header className={style.header}>
        {name} {changed && '*'}
      </header>
      <div className={style.main} ref={ref} />
    </div>
  );
};
