import React, {useState, useEffect} from "../web_modules/react.js";
import {DropFile, PickFile} from "./components/ChooseFile.js";
import {Editor} from "./monaco.js";
function App({}) {
  const [fileHandle, setFileHandle] = useState();
  const [content, setContent] = useState();
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
  if (!fileHandle) {
    return /* @__PURE__ */ React.createElement(PickFile, {
      onFile: setFileHandle
    });
  }
  return /* @__PURE__ */ React.createElement(DropFile, {
    onFile: setFileHandle
  }, content && fileHandle.name && /* @__PURE__ */ React.createElement(Editor, {
    name: fileHandle.name,
    value: content,
    onChange: write
  }));
}
export default App;
