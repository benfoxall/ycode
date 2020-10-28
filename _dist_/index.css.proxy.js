// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "body {\n  background: #1e1e1e;\n  color: white;\n  margin: 4em;\n\n  font-family: Menlo, Monaco, 'Courier New', monospace;\n}\n\ncode {\n  font-family: Menlo, Monaco, 'Courier New', monospace;\n  font-weight: normal;\n  font-size: 12px;\n  font-feature-settings: 'liga' 0, 'calt' 0;\n  line-height: 18px;\n}\n\na {\n  color: aquamarine;\n}\n";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';

  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}