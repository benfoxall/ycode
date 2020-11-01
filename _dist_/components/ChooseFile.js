import React, {
  createContext,
  useState
} from "../../web_modules/react.js";
const IsDragging = createContext(false);
export const PickFile = ({onFile}) => {
  const choose = async () => {
    const files = await window.showOpenFilePicker();
    onFile(files[0]);
  };
  return /* @__PURE__ */ React.createElement(DropFile, {
    onFile
  }, /* @__PURE__ */ React.createElement(IsDragging.Consumer, null, (dragging) => /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement("h1", null, "Ycode"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", {
    href: "#",
    onClick: choose
  }, dragging ? "Drop" : "Choose", " a file to edit ")))));
};
export const DropFile = ({onFile, children}) => {
  const [dragging, setDragging] = useState(false);
  const dragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const dragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };
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
  return /* @__PURE__ */ React.createElement("div", {
    className: "App",
    onDrop: drop,
    onDragOver: dragOver,
    onDragLeave: dragLeave
  }, /* @__PURE__ */ React.createElement(IsDragging.Provider, {
    value: dragging
  }, children));
};
