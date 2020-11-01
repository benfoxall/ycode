import React, {useState, useEffect} from "../web_modules/react.js";
import {PickFile as PickFile2} from "./components/PickFile.js";
import {Editor} from "./monaco.js";
import yconfig2 from "./yconfig.js";
function App({}) {
  const [fileHandle, setFileHandle] = useState();
  const [content, setContent] = useState();
  const write = async (str) => {
    if (fileHandle && content) {
      const writable = await fileHandle.createWritable();
      await writable.write(str);
      await writable.close();
    }
  };
  useEffect(() => {
    if (fileHandle) {
      fileHandle.getFile().then((file) => file.text()).then((text) => {
        const tdoc = yconfig2.doc.getText("monaco");
        tdoc.insert(0, "--");
        tdoc.delete(0, 1e6);
        tdoc.insert(0, text);
        setContent(text);
      });
    }
  }, [fileHandle]);
  useEffect(() => {
    document.title = fileHandle ? fileHandle.name : "ycode";
  }, [fileHandle]);
  if (yconfig2.initiator === false) {
    return /* @__PURE__ */ React.createElement(Editor, {
      name: "unknown",
      onChange: () => console.log("nope")
    });
  }
  return /* @__PURE__ */ React.createElement(PickFile2, {
    onFile: setFileHandle,
    file: fileHandle
  }, fileHandle && /* @__PURE__ */ React.createElement(Editor, {
    name: fileHandle.name,
    onChange: write
  }));
}
export default App;
