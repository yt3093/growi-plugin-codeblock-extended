import { createCodeBlockExtended } from './src/codeBlockExtended';

const codeBlockExtended = createCodeBlockExtended();

const activate = (): void => {
  codeBlockExtended.mount();
};

const deactivate = (): void => {
  codeBlockExtended.unmount();
};

window.pluginActivators = window.pluginActivators ?? {};
window.pluginActivators['growi-plugin-codeblock-extended'] = { activate, deactivate };
