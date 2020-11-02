// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "body {\n  background: #1e1e1e;\n  color: white;\n\n  font-family: Menlo, Monaco, 'Courier New', monospace;\n  margin: 0;\n}\n\nh1 {\n  font-weight: 100;\n}\n\ncode {\n  font-family: Menlo, Monaco, 'Courier New', monospace;\n  font-weight: normal;\n  font-size: 12px;\n  font-feature-settings: 'liga' 0, 'calt' 0;\n  line-height: 18px;\n}\n\na {\n  color: aquamarine;\n}\n\n.App {\n  height: 80vh;\n  display: flex;\n  flex-direction: column;\n  padding: 2em;\n}\n\n.yRemoteSelection {\n  background-color: rgba(255, 0, 200, 0.418);\n}\n.yRemoteSelectionHead {\n  position: absolute;\n  border-left: aquamarine solid 2px;\n  border-top: aquamarine solid 2px;\n  border-bottom: aquamarine solid 2px;\n  height: 100%;\n  box-sizing: border-box;\n}\n.yRemoteSelectionHead::after {\n  position: absolute;\n  content: ' ';\n  border: 3px solid aquamarine;\n  border-radius: 4px;\n  left: -4px;\n  top: -5px;\n}\n";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';

  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}