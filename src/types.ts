declare global {
  interface Window {
    pluginActivators?: Record<string, { activate(): void; deactivate(): void }>;
  }
}

export type SvgElDef = { tag: string; attrs: Record<string, string>; text?: string };
export type LangIconDef = { vb: string; bg?: string; els: SvgElDef[] };

export type CopyBtnState = 'copy' | 'ok' | 'ok-raw' | 'fail';
export type DiffLineType = 'added' | 'removed' | 'hunk' | 'context';

export interface ParsedSpec {
  start: number;
  highlights: Set<number>;
  lang?: string;
  diff: boolean;
  fold: boolean;
  foldLines: number;
}

export interface BlockRefs {
  toolbar: HTMLDivElement;
  filenameLabel: HTMLSpanElement | null;
  lineNums: HTMLElement | null;
  diffGutter: HTMLElement | null;
  codeWrap: HTMLDivElement | null;
  codeOuter: HTMLDivElement | null;
  overflowObserver: ResizeObserver | null;
  overflowScrollHandler: (() => void) | null;
  hlOverlay: HTMLDivElement | null;
  hlScrollHandler: (() => void) | null;
  copyBtn: HTMLButtonElement | null;
  copyHandler: ((e: MouseEvent) => void) | null;
  copyTimerId?: number;
  foldInner: HTMLDivElement | null;
  foldOverlay: HTMLDivElement | null;
  foldCollapseBtn: HTMLButtonElement | null;
  foldCollapseHandler: (() => void) | null;
}

export {};
