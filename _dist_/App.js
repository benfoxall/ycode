import React, {useState, useEffect} from "../web_modules/react.js";
import {PickFile as PickFile2} from "./components/PickFile.js";
import {Editor} from "./monaco.js";
import yconfig2 from "./yconfig.js";
function App({}) {
  const [fileHandle, setFileHandle] = useState();
  const write = async (str) => {
    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(str);
      await writable.close();
    }
  };
  useEffect(() => {
    if (fileHandle) {
      fileHandle.getFile().then((file) => file.text()).then((text) => {
        const tdoc = yconfig2.doc.getText("monaco:content");
        if (tdoc.toJSON())
          tdoc.delete(0, 1e6);
        tdoc.insert(0, text);
        const namedoc = yconfig2.doc.getText("monaco:name");
        if (namedoc.toJSON())
          namedoc.delete(0, 1e6);
        namedoc.insert(0, fileHandle.name);
      });
    }
  }, [fileHandle]);
  useEffect(() => {
    document.title = fileHandle ? fileHandle.name : "ycode";
  }, [fileHandle]);
  if (yconfig2.initiator) {
    return /* @__PURE__ */ React.createElement(PickFile2, {
      onFile: setFileHandle,
      file: fileHandle
    }, /* @__PURE__ */ React.createElement(Editor, {
      onChange: write
    }));
  } else {
    return /* @__PURE__ */ React.createElement(Editor, {
      onChange: () => console.log("nope")
    });
  }
}
export default App;
