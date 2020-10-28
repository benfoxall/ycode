import React, {
  useState,
  useEffect,
  ChangeEventHandler,
  useRef,
  RefObject,
} from 'react';
import './App.css';

import type * as monaco from 'monaco-editor';

/** last step in a series of hacks */
const useMonaco = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    (window as any).monacoPromise.then((mon: any) => {
      const x = mon.editor.create(ref.current, {
        value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join(
          '\n',
        ),
        // language: 'javascript',
      });

      setEditor(x);
    });
  }, []);

  return [ref, editor] as [
    RefObject<HTMLDivElement>,
    monaco.editor.IStandaloneCodeEditor?,
  ];
};

interface AppProps {}

function App({}: AppProps) {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();
  const [content, setContent] = useState<string>();
  const [changed, setChanged] = useState(false);
  const changeContent: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setContent(e.target.value);
    setChanged(true);
  };

  const choose = async () => {
    const files = await window.showOpenFilePicker();

    setFileHandle(files[0]);
  };

  const save = async () => {
    if (fileHandle && content) {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      setChanged(false);
    }
  };

  const [div, editor] = useMonaco();

  useEffect(() => {
    if (editor && content) {
      editor.setValue(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (fileHandle) {
      fileHandle
        .getFile()
        .then((file) => file.text())
        .then(setContent);
    }
  }, [fileHandle]);

  return (
    <div className="App">
      <h1>Recode</h1>

      <h3>{fileHandle?.name}</h3>

      <p>
        <a href="#" onClick={choose}>
          Choose a file to edit
        </a>
      </p>

      {content !== undefined && (
        <>
          <textarea value={content} onChange={changeContent}></textarea>

          {changed && <button onClick={save}>save</button>}
        </>
      )}

      <div style={{ height: '50vh' }} ref={div}></div>

      {/* <Editor height="30vh" language="javascript" /> */}
    </div>
  );
}

export default App;
