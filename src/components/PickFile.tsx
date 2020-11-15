import React, {
  createContext,
  DragEventHandler,
  FC,
  useContext,
  useState,
} from 'react';

import styles from './main.module.css';

interface Props {
  file?: FileSystemFileHandle;
  onFile: (handle: FileSystemFileHandle) => void;
}

const IsDragging = createContext(false);

/** Select by picker or drop  */
export const PickFile: FC<Props> = ({ onFile, file, children }) => (
  <DropFile onFile={onFile} file={file}>
    {file ? children : <ChooseFile onFile={onFile} file={file} />}
  </DropFile>
);

const ChooseFile: FC<Props> = ({ onFile }) => {
  const dragging = useContext(IsDragging);

  const supported = 'showOpenFilePicker' in window;

  const choose = async () => {
    const files = await window.showOpenFilePicker();

    onFile(files[0]);
  };

  return (
    <main className={styles.container}>
      <header>
        <h1 className={styles.title}>yCode</h1>
        <p>Edit local files with remote people</p>
      </header>

      <p>
        {supported ? (
          <a href="#" onClick={choose}>
            {dragging ? 'Drop' : 'Select'} a file to get started
          </a>
        ) : (
          <span className={styles.info}>
            <a href="https://caniuse.com/native-filesystem-api">
              File System Access isn’t supported by this browser yet 😢
            </a>
          </span>
        )}
      </p>

      <footer>
        <p>
          <a href="https://github.com/benfoxall/ycode">benfoxall/ycode</a>
        </p>
      </footer>
    </main>
  );
};

const DropFile: FC<Props> = ({ onFile, children }) => {
  const [dragging, setDragging] = useState(false);

  const dragOver: DragEventHandler = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const dragLeave: DragEventHandler = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const drop: DragEventHandler = async (e) => {
    e.preventDefault();
    try {
      const file = e.dataTransfer.items[0];

      const handle = await file.getAsFileSystemHandle();

      onFile(handle as FileSystemFileHandle);
    } catch (e) {
      console.error('err', e);
    }
  };

  return (
    <div
      className="App"
      onDrop={drop}
      onDragOver={dragOver}
      onDragLeave={dragLeave}
    >
      <IsDragging.Provider value={dragging}>{children}</IsDragging.Provider>
    </div>
  );
};
