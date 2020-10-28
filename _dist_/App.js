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
    setContent(str);
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
    document.title = fileHandle ? fileHandle.name : "recode";
  }, [fileHandle]);
  if (content) {
    return /* @__PURE__ */ React.createElement(Editor, {
      name: fileHandle?.name,
      content,
      onChange: write
    });
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: "App"
  }, /* @__PURE__ */ React.createElement("h1", null, "Recode"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", {
    href: "#",
    onClick: choose
  }, "Choose a file to edit and share")));
}
export default App;
