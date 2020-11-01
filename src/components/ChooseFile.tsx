import React, {
  createContext,
  DragEventHandler,
  FC,
  useContext,
  useState,
} from 'react';

interface Props {
  onFile: (handle: FileSystemFileHandle) => void;
}

const IsDragging = createContext(false);

/** Select by picker or drop  */
export const PickFile: FC<Props> = ({ onFile }) => {
  const choose = async () => {
    const files = await window.showOpenFilePicker();

    onFile(files[0]);
  };

  return (
    <DropFile onFile={onFile}>
      <IsDragging.Consumer>
        {(dragging) => (
          <main>
            <h1>Ycode</h1>

            <p>
              <a href="#" onClick={choose}>
                {dragging ? 'Drop' : 'Choose'} a file to edit {/*and share*/}
              </a>
            </p>
          </main>
        )}
      </IsDragging.Consumer>
    </DropFile>
  );
};

export const DropFile: FC<Props> = ({ onFile, children }) => {
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
