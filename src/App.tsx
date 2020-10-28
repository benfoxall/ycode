import React, {
  useState,
  useEffect,
  ChangeEventHandler,
  useRef,
  RefObject,
} from 'react';
import './App.css';

import { useMonaco } from './monaco';

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

  const [div, editor] = useMonaco('yo');

  // useEffect(() => {
  //   if(editor) {

  //     const resize = () => {

  //     }

  //   }
  // }, [editor])

  // @ts-ignore
  window.ee = editor;

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
