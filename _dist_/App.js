import React, {useState, useEffect} from "../web_modules/react.js";
import {Editor} from "./monaco.js";
function App({}) {
  const [fileHandle, setFileHandle] = useState();
  const [content, setContent] = useState();
  const choose = async () => {
    const files = await window.showOpenFilePicker();
    setFileHandle(files[0]);
  };
  const write = async (str) => {
    if (fileHandle && content) {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    }
  };
  useEffect(() => {
    if (fileHandle) {
      fileHandle.getFile().then((file) => file.text()).then(setContent);
    }
  }, [fileHandle]);
  useEffect(() => {
    document.title = fileHandle ? fileHandle.name : "ycode";
  }, [fileHandle]);
  const [dragging, setDragging] = useState(false);
  const drop = async (e) => {
    e.preventDefault();
    try {
      const file = e.dataTransfer.items[0];
      const handle = await file.getAsFileSystemHandle();
      setFileHandle(handle);
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
  }, content ? /* @__PURE__ */ React.createElement(Editor, {
    name: fileHandle?.name,
    content,
    onChange: write
  }) : /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement("h1", null, "Ycode"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", {
    href: "#",
    onClick: choose
  }, dragging ? "Drop" : "Choose", " a file to edit "))));
}
export default App;
