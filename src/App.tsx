import React, { useState, useEffect, DragEventHandler } from 'react';

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
    // setContent(str);

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

  const [dragging, setDragging] = useState(false);
  const drop: DragEventHandler = async (e) => {
    e.preventDefault();
    try {
      const file = e.dataTransfer.items[0];

      const handle = await file.getAsFileSystemHandle();

      setFileHandle(handle as FileSystemFileHandle);
    } catch (e) {
      console.error('err', e);
    }
  };

  const drag: DragEventHandler = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const dragEnd: DragEventHandler = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  return (
    <div className="App" onDrop={drop} onDragOver={drag} onDragLeave={dragEnd}>
      {content ? (
        <Editor name={fileHandle?.name} content={content} onChange={write} />
      ) : (
        <main>
          <h1>Ycode</h1>

          <p>
            <a href="#" onClick={choose}>
              {dragging ? 'Drop' : 'Choose'} a file to edit {/*and share*/}
            </a>
          </p>
        </main>
      )}
    </div>
  );
}

export default App;
