import React, {
  useState,
  useEffect
} from "../../web_modules/react.js";
import style from "./monaco.module.css.proxy.js";
import {MonacoBinding, _SET_MONACO} from "../ext/y-monaco.js";
import yconfig2 from "../yconfig.js";
import {useMonaco} from "./monaco.js";
export const Editor = ({onChange}) => {
  const [ref, editor, mon] = useMonaco();
  const [changed, setChanged] = useState(false);
  const [name, setName] = useState();
  useEffect(() => {
    const name2 = yconfig2.doc.getText("monaco:name");
    let val = name2;
    const callback = (f) => {
      if (f.adds.length) {
        const current = name2.toJSON();
        if (current !== val) {
          setName(current);
          val = current;
        }
      }
    };
    name2.observe(callback);
    return () => {
      name2.unobserve(callback);
    };
  }, []);
  useEffect(() => {
    if (editor && mon && name) {
      const model = mon.editor.createModel("_", void 0, mon.Uri.file(name));
      model.onDidChangeContent(() => {
        setChanged(true);
      });
      const type = yconfig2.doc.getText("monaco:content");
      _SET_MONACO(mon);
      new MonacoBinding(type, model, new Set([editor]), yconfig2.provider.awareness);
      editor.setModel(model);
      return () => {
        model.dispose();
      };
    }
  }, [editor, name]);
  const down = (e) => {
    if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.key == "s") {
      e.preventDefault();
      const v = editor?.getValue();
      if (v) {
        onChange(v);
        setChanged(false);
      }
    }
  };
  const [copied, setCopied] = useState(false);
  const clip = async (e) => {
    e.preventDefault();
    const {href} = e.currentTarget;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch (e2) {
      window.open(href);
    }
  };
  useEffect(() => {
    if (copied) {
      const time = setTimeout(setCopied, 2e3, false);
      return () => {
        clearTimeout(time);
      };
    }
  }, [copied]);
  return /* @__PURE__ */ React.createElement("div", {
    className: style.container,
    onKeyDown: down
  }, yconfig2.initiator && /* @__PURE__ */ React.createElement("header", {
    className: style.header
  }, /* @__PURE__ */ React.createElement("span", null, name, " ", changed && "*"), /* @__PURE__ */ React.createElement("a", {
    href: "?" + yconfig2.room,
    target: "_blank",
    onClick: clip
  }, copied ? "link copied!" : "share \u2197\uFE0E")), /* @__PURE__ */ React.createElement("div", {
    className: style.main,
    ref
  }));
};
export default Editor;
