import React, { useState, useEffect } from 'react';
import { DropFile, PickFile } from './components/ChooseFile';

import { Editor } from './monaco';

interface AppProps {}

function App({}: AppProps) {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();
  const [content, setContent] = useState<string>();

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
    document.title = fileHandle ? fileHandle.name : 'ycode';
  }, [fileHandle]);

  if (!fileHandle) {
    return <PickFile onFile={setFileHandle} />;
  }

  return (
    <DropFile onFile={setFileHandle}>
      {content && fileHandle.name && (
        <Editor name={fileHandle.name} value={content} onChange={write} />
      )}
    </DropFile>
  );
}

export default App;
