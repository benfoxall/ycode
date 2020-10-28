import React, { useState, useEffect } from 'react';

import { Editor } from './monaco';

interface AppProps {}

function App({}: AppProps) {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();
  const [content, setContent] = useState<string>();

  const choose = async () => {
    const files = await window.showOpenFilePicker();

    setFileHandle(files[0]);
  };

  const write = async (str: string) => {
    setContent(str);

    if (fileHandle && content) {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    }
  };

  useEffect(() => {
    if (fileHandle) {
      fileHandle
        .getFile()
        .then((file) => file.text())
        .then(setContent);
    }
  }, [fileHandle]);

  useEffect(() => {
    document.title = fileHandle ? fileHandle.name : 'recode';
  }, [fileHandle]);

  if (content) {
    return (
      <Editor name={fileHandle?.name} content={content} onChange={write} />
    );
  }

  return (
    <div className="App">
      <h1>Recode</h1>

      <p>
        <a href="#" onClick={choose}>
          Choose a file to edit and share
        </a>
      </p>
    </div>
  );
}

export default App;
