
import React, {createContext, DragEventHandler, FunctionComponent, useState} from 'react'

const DraggingCtx = createContext(false)

interface Props {
    onFile: (handle: FileSystemFileHandle) => void;
}

export const Droppable: FunctionComponent<Props> = ({children, onFile}) => {

    const [dragging, setDragging] = useState(false);

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
        <DraggingCtx.Provider value={dragging}>
          {children}
        </DraggingCtx.Provider>
    </div>
    )
}