import React, { useState, useEffect, lazy, Suspense } from 'react';
import { PickFile } from './components/PickFile';
import yconfig from './yconfig';
import Editor from './components/Editor';
interface AppProps {}

function App({}: AppProps) {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();

  const write = async (str: string) => {
    if (fileHandle) {
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
          const tdoc = yconfig.doc.getText('monaco:content');

          // hack?, clear out contents
          if (tdoc.toJSON()) tdoc.delete(0, 1000000);
          tdoc.insert(0, text);

          const namedoc = yconfig.doc.getText('monaco:name');

          // hack?, clear out contents
          if (namedoc.toJSON()) namedoc.delete(0, 1000000);
          namedoc.insert(0, fileHandle.name);
        });
    }
  }, [fileHandle]);

  useEffect(() => {
    document.title = fileHandle ? fileHandle.name : 'yCode';
  }, [fileHandle]);

  if (yconfig.initiator) {
    return (
      <PickFile onFile={setFileHandle} file={fileHandle}>
        <Editor onChange={write} />
      </PickFile>
    );
  } else {
    return <Editor onChange={() => console.warn('save ignored')} />;
  }
}

export default App;
