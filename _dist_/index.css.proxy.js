// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ":root {\n  --background: #1e1e1e;\n  --foreground: #fff;\n  --highlight: aquamarine;\n}\n\n@media (prefers-color-scheme: light) {\n  :root {\n    --background: #fff;\n    --foreground: #1e1e1e;\n    --highlight: #08f;\n  }\n}\n\nbody {\n  background: var(--background);\n  color: var(--foreground);\n  font-family: Menlo, Monaco, 'Courier New', monospace;\n  margin: 0;\n}\n\na {\n  color: var(--highlight);\n  text-decoration: none;\n}\n\na:hover {\n  text-decoration: underline;\n}\n\n.yRemoteSelection {\n  background-color: rgba(255, 0, 200, 0.418);\n}\n.yRemoteSelectionHead {\n  position: absolute;\n  border-left: aquamarine solid 2px;\n  border-top: aquamarine solid 2px;\n  border-bottom: aquamarine solid 2px;\n  height: 100%;\n  box-sizing: border-box;\n}\n.yRemoteSelectionHead::after {\n  position: absolute;\n  content: ' ';\n  border: 3px solid aquamarine;\n  border-radius: 4px;\n  left: -4px;\n  top: -5px;\n}\n";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';

  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}