import React, {
  createContext,
  useState
} from "../../web_modules/react.js";
const DraggingCtx = createContext(false);
export const Droppable = ({children, onFile}) => {
  const [dragging, setDragging] = useState(false);
  const drop = async (e) => {
    e.preventDefault();
    try {
      const file = e.dataTransfer.items[0];
      const handle = await file.getAsFileSystemHandle();
      onFile(handle);
    } catch (e2) {
      console.error("err", e2);
    }
  };
  const drag = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const dragEnd = (e) => {
    e.preventDefault();
    setDragging(false);
  };
  return /* @__PURE__ */ React.createElement("div", {
    className: "App",
    onDrop: drop,
    onDragOver: drag,
    onDragLeave: dragEnd
  }, /* @__PURE__ */ React.createElement(DraggingCtx.Provider, {
    value: dragging
  }, children));
};
