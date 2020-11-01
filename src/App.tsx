import React, { useState, useEffect } from 'react';
import { PickFile } from './components/PickFile';
import { Editor } from './monaco';
import yconfig from './yconfig';

interface AppProps {}

function App({}: AppProps) {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();
  const [content, setContent] = useState<string>();

  const write = async (str: string) => {
    if (fileHandle && content) {
      const writable = await fileHandle.createWritable();
      await writable.write(str);
      await writable.close();
    }
  };

  useEffect(() => {
    if (fileHandle) {
      fileHandle
        .getFile()
        .then((file) => file.text())
        .then((text) => {
          const tdoc = yconfig.doc.getText('monaco');

          // hack, clear out contents
          tdoc.insert(0, '--');
          tdoc.delete(0, 1000000);
          tdoc.insert(0, text);

          setContent(text);
        });
    }
  }, [fileHandle]);

  useEffect(() => {
    document.title = fileHandle ? fileHandle.name : 'ycode';
  }, [fileHandle]);

  if (yconfig.initiator === false) {
    return <Editor name="" onChange={() => console.log('nope')} />;
  }

  return (
    <PickFile onFile={setFileHandle} file={fileHandle}>
      {fileHandle && <Editor name={fileHandle.name} onChange={write} />}
    </PickFile>
  );
}

export default App;
