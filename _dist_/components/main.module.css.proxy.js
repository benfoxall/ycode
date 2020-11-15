
export let code = "._dist_components_main_module__container {\n  font-family: Arial, Helvetica, sans-serif;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  padding: 1em;\n  font-size: 2rem;\n  font-weight: 800;\n\n  min-height: min(calc(100vh - 2em), 15em);\n  max-width: 20em;\n  margin: auto;\n}\n\n._dist_components_main_module__container header > * {\n  margin: 0;\n}\n\n._dist_components_main_module__container header {\n  font-size: 4rem;\n}\n\n._dist_components_main_module__title {\n  color: var(--highlight);\n  font-size: 1rem;\n  margin-bottom: 0em;\n}\n\n._dist_components_main_module__container footer {\n  font-size: 1rem;\n  margin: 0;\n}\n._dist_components_main_module__container a {\n  color: inherit;\n}\n\n._dist_components_main_module__info {\n  color: #fc0;\n}\n";
let json = {"container":"_dist_components_main_module__container","title":"_dist_components_main_module__title","info":"_dist_components_main_module__info"};
export default json;

// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';

  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}