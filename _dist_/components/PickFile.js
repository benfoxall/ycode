import React, {
  createContext,
  useContext,
  useState
} from "../../web_modules/react.js";
import styles from "./main.module.css.proxy.js";
const IsDragging = createContext(false);
export const PickFile = ({onFile, file, children}) => /* @__PURE__ */ React.createElement(DropFile, {
  onFile,
  file
}, file ? children : /* @__PURE__ */ React.createElement(ChooseFile, {
  onFile,
  file
}));
const ChooseFile = ({onFile}) => {
  const dragging = useContext(IsDragging);
  const supported = "showOpenFilePicker" in window;
  const choose = async () => {
    const files = await window.showOpenFilePicker();
    onFile(files[0]);
  };
  return /* @__PURE__ */ React.createElement("main", {
    className: styles.container
  }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("h1", {
    className: styles.title
  }, "yCode"), /* @__PURE__ */ React.createElement("p", null, "Edit local files with remote people")), /* @__PURE__ */ React.createElement("p", null, supported ? /* @__PURE__ */ React.createElement("a", {
    href: "#",
    onClick: choose
  }, dragging ? "Drop" : "Select", " a file to get started") : /* @__PURE__ */ React.createElement("span", {
    className: styles.info
  }, /* @__PURE__ */ React.createElement("a", {
    href: "https://caniuse.com/native-filesystem-api"
  }, "File System Access isn\u2019t supported by this browser yet \u{1F622}"))), /* @__PURE__ */ React.createElement("footer", null, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", {
    href: "https://github.com/benfoxall/ycode"
  }, "benfoxall/ycode"))));
};
const DropFile = ({onFile, children}) => {
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
