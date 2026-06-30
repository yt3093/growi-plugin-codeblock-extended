import './styles/codeBlockExtended.css';

const ENHANCED_ATTR = 'data-gpcb-enhanced';
const NO_COPY_ATTR = 'data-no-copy';
const COPY_BTN_ATTR = 'data-gpcb-copy-btn';
const COPY_BTN_DIFF_ATTR = 'data-gpcb-copy-diff';
const COPY_CLASS_OK = 'gpcb-copy-ok';
const COPY_CLASS_OK_RAW = 'gpcb-copy-ok-raw';
const COPY_CLASS_FAIL = 'gpcb-copy-fail';
const COPY_FEEDBACK_MS = 2000;
const SVG_NS = 'http://www.w3.org/2000/svg';

const NO_FILENAME_ATTR = 'data-no-filename';
const FILENAME_ATTR = 'data-gpcb-filename';
const FILENAME_CLASS = 'gpcb-filename';
const GROWI_FILENAME_SELECTOR = 'cite.code-highlighted-title';

const NO_LANG_ATTR = 'data-no-lang';
const LANG_ICON_CLASS = 'gpcb-lang-icon';
const LANG_DISPLAY_MAP: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  py: 'Python',     python: 'Python',
  sh: 'Bash',       bash: 'Bash', shell: 'Bash',
  html: 'HTML', css: 'CSS', json: 'JSON',
  yml: 'YAML', yaml: 'YAML',
  md: 'Markdown', markdown: 'Markdown',
  diff: 'Diff', sql: 'SQL',
  go: 'Go',
  rs: 'Rust', rust: 'Rust',
  c: 'C', cpp: 'C++',
  java: 'Java',
  rb: 'Ruby', ruby: 'Ruby',
  php: 'PHP',
};
type SvgElDef = { tag: string; attrs: Record<string, string>; text?: string };
type LangIconDef = { vb: string; els: SvgElDef[] };

// devicon-based language icons (viewBox 0 0 128 128 unless noted)
const _JS: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M1.408 1.408h125.184v125.185H1.408z', fill: '#F0DB4F' } },
  { tag: 'path', attrs: { d: 'M116.347 96.736c-.917-5.711-4.641-10.508-15.672-14.981-3.832-1.761-8.104-3.022-9.377-5.926-.452-1.69-.512-2.642-.226-3.665.821-3.32 4.784-4.355 7.925-3.403 2.023.678 3.938 2.237 5.093 4.724 5.402-3.498 5.391-3.475 9.163-5.879-1.381-2.141-2.118-3.129-3.022-4.045-3.249-3.629-7.676-5.498-14.756-5.355l-3.688.477c-3.534.893-6.902 2.748-8.877 5.235-5.926 6.724-4.236 18.492 2.975 23.335 7.104 5.332 17.54 6.545 18.873 11.531 1.297 6.104-4.486 8.08-10.234 7.378-4.236-.881-6.592-3.034-9.139-6.949-4.688 2.713-4.688 2.713-9.508 5.485 1.143 2.499 2.344 3.63 4.26 5.795 9.068 9.198 31.76 8.746 35.83-5.176.165-.478 1.261-3.666.38-8.581zM69.462 58.943H57.753l-.048 30.272c0 6.438.333 12.34-.714 14.149-1.713 3.558-6.152 3.117-8.175 2.427-2.059-1.012-3.106-2.451-4.319-4.485-.333-.584-.583-1.036-.667-1.071l-9.52 5.83c1.583 3.249 3.915 6.069 6.902 7.901 4.462 2.678 10.459 3.499 16.731 2.059 4.082-1.189 7.604-3.652 9.448-7.401 2.666-4.915 2.094-10.864 2.07-17.444.06-10.735.001-21.468.001-32.237z', fill: '#323330' } },
]};
const _TS: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M22.67 47h99.67v73.67H22.67z', fill: '#fff' } },
  { tag: 'path', attrs: { d: 'M1.5 63.91v62.5h125v-125H1.5zm100.73-5a15.56 15.56 0 017.82 4.5 20.58 20.58 0 013 4c0 .16-5.4 3.81-8.69 5.85-.12.08-.6-.44-1.13-1.23a7.09 7.09 0 00-5.87-3.53c-3.79-.26-6.23 1.73-6.21 5a4.58 4.58 0 00.54 2.34c.83 1.73 2.38 2.76 7.24 4.86 8.95 3.85 12.78 6.39 15.16 10 2.66 4 3.25 10.46 1.45 15.24-2 5.2-6.9 8.73-13.83 9.9a38.32 38.32 0 01-9.52-.1 23 23 0 01-12.72-6.63c-1.15-1.27-3.39-4.58-3.25-4.82a9.34 9.34 0 011.15-.73L82 101l3.59-2.08.75 1.11a16.78 16.78 0 004.74 4.54c4 2.1 9.46 1.81 12.16-.62a5.43 5.43 0 00.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48 16.48 0 01-3.43-6.25 25 25 0 01-.22-8c1.33-6.23 6-10.58 12.82-11.87a31.66 31.66 0 019.49.26zm-29.34 5.24v5.12H56.66v46.23H45.15V69.26H28.88v-5a49.19 49.19 0 01.12-5.17C29.08 59 39 59 51 59h21.83z', fill: '#007acc' } },
]};
const _PY: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M63.391 1.988c-4.222.02-8.252.379-11.8 1.007-10.45 1.846-12.346 5.71-12.346 12.837v9.411h24.693v3.137H29.977c-7.176 0-13.46 4.313-15.426 12.521-2.268 9.405-2.368 15.275 0 25.096 1.755 7.311 5.947 12.519 13.124 12.519h8.491V67.234c0-8.151 7.051-15.34 15.426-15.34h24.665c6.866 0 12.346-5.654 12.346-12.548V15.833c0-6.693-5.646-11.72-12.346-12.837-4.244-.706-8.645-1.027-12.866-1.008zM50.037 9.557c2.55 0 4.634 2.117 4.634 4.721 0 2.593-2.083 4.69-4.634 4.69-2.56 0-4.633-2.097-4.633-4.69-.001-2.604 2.073-4.721 4.633-4.721z', fill: '#3776AB', transform: 'translate(0 10.26)' } },
  { tag: 'path', attrs: { d: 'M91.682 28.38v10.966c0 8.5-7.208 15.655-15.426 15.655H51.591c-6.756 0-12.346 5.783-12.346 12.549v23.515c0 6.691 5.818 10.628 12.346 12.547 7.816 2.297 15.312 2.713 24.665 0 6.216-1.801 12.346-5.423 12.346-12.547v-9.412H63.938v-3.138h37.012c7.176 0 9.852-5.005 12.348-12.519 2.578-7.735 2.467-15.174 0-25.096-1.774-7.145-5.161-12.521-12.348-12.521h-9.268zM77.809 87.927c2.561 0 4.634 2.097 4.634 4.692 0 2.602-2.074 4.719-4.634 4.719-2.55 0-4.633-2.117-4.633-4.719 0-2.595 2.083-4.692 4.633-4.692z', fill: '#FFD43B', transform: 'translate(0 10.26)' } },
]};
const _BASH: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M112.205 26.129 71.8 2.142A15.326 15.326 0 0 0 64.005 0c-2.688 0-5.386.717-7.796 2.152L15.795 26.14C10.976 28.999 8 34.289 8 40.018v47.975c0 5.729 2.967 11.019 7.796 13.878L56.2 125.858A15.193 15.193 0 0 0 63.995 128a15.32 15.32 0 0 0 7.796-2.142l40.414-23.987c4.819-2.86 7.796-8.16 7.796-13.878V40.007c0-5.718-2.967-11.019-7.796-13.878zm-31.29 74.907.063 3.448c0 .418-.267.889-.588 1.06l-2.046 1.178c-.321.16-.6-.032-.6-.45l-.032-3.394c-1.745.728-3.523.9-4.647.45-.214-.086-.31-.397-.225-.76l.739-3.117c.064-.246.193-.493.364-.643a.726.726 0 0 1 .193-.139c.117-.064.235-.075.332-.032 1.22.407 2.773.214 4.272-.535 1.907-.964 3.18-2.913 3.16-4.84-.022-1.757-.964-2.474-3.267-2.496-2.934.01-5.675-.567-5.718-4.894-.032-3.555 1.81-7.26 4.744-9.595l-.032-3.48c0-.428.257-.9.589-1.07l1.98-1.264c.322-.161.6.042.6.46l.033 3.48c1.456-.578 2.72-.738 3.865-.47.247.063.364.406.257.802l-.77 3.084a1.372 1.372 0 0 1-.354.622.825.825 0 0 1-.203.15c-.108.053-.204.064-.3.053-.525-.118-1.767-.385-3.727.6-2.056 1.038-2.773 2.827-2.763 4.155.022 1.585.825 2.066 3.63 2.11 3.738.063 5.344 1.691 5.387 5.45.053 3.684-1.917 7.657-4.937 10.077zm28.206-64.787L70.89 59.86c-4.765 2.784-8.278 5.911-8.288 11.662v47.107c0 3.437 1.392 5.665 3.523 6.318a12.81 12.81 0 0 1-2.12.204c-2.239 0-4.445-.61-6.383-1.757L17.219 99.408c-3.951-2.345-6.403-6.725-6.403-11.426V40.007c0-4.7 2.452-9.08 6.403-11.426L57.634 4.594a12.555 12.555 0 0 1 6.382-1.756c2.238 0 4.444.61 6.382 1.756l40.415 23.987c3.33 1.981 5.579 5.397 6.21 9.242-1.36-2.86-4.38-3.63-7.902-1.574z', fill: '#293138' } },
  { tag: 'path', attrs: { d: 'm101.614 92.619-10.066 6.018c-.268.16-.46.332-.46.653v2.635c0 .32.214.46.481.3l10.216-6.212c.268-.16.31-.45.31-.77v-2.324c0-.322-.213-.45-.481-.3z', fill: '#4fa847' } },
]};
const _HTML: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z', fill: '#E44D26' } },
  { tag: 'path', attrs: { d: 'M64 116.8l36.378-10.086 8.559-95.878H64z', fill: '#F16529' } },
  { tag: 'path', attrs: { d: 'M64 52.455H45.788L44.53 38.361H64V24.599H29.489l.33 3.692 3.382 37.927H64zm0 35.743l-.061.017-15.327-4.14-.979-10.975H33.816l1.928 21.609 28.193 7.826.063-.017z', fill: '#EBEBEB' } },
  { tag: 'path', attrs: { d: 'M63.952 52.455v13.763h16.947l-1.597 17.849-15.35 4.143v14.319l28.215-7.82.207-2.325 3.234-36.233.335-3.696h-3.708zm0-27.856v13.762h33.244l.276-3.092.628-6.978.329-3.692z', fill: '#fff' } },
]};
const _CSS: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M18.814 114.123L8.76 1.352h110.48l-10.064 112.754-45.243 12.543-45.119-12.526z', fill: '#1572B6' } },
  { tag: 'path', attrs: { d: 'M64.001 117.062l36.559-10.136 8.601-96.354h-45.16v106.49z', fill: '#33A9DC' } },
  { tag: 'path', attrs: { d: 'M64.001 51.429h18.302l1.264-14.163H64.001V23.435h34.682l-.332 3.711-3.4 38.114h-30.95V51.429z', fill: '#fff' } },
  { tag: 'path', attrs: { d: 'M64.083 87.349l-.061.018-15.403-4.159-.985-11.031H33.752l1.937 21.717 28.331 7.863.063-.018v-14.39z', fill: '#EBEBEB' } },
  { tag: 'path', attrs: { d: 'M81.127 64.675l-1.666 18.522-15.426 4.164v14.39l28.354-7.858.208-2.337 2.406-26.881H81.127z', fill: '#fff' } },
  { tag: 'path', attrs: { d: 'M64.048 23.435v13.831H30.64l-.277-3.108-.63-7.012-.331-3.711h34.646zm-.047 27.996v13.831H48.792l-.277-3.108-.631-7.012-.33-3.711h16.447z', fill: '#EBEBEB' } },
]};
const _C: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M125 50c-4-32-24-50-62-50C29 0 3 24 3 64c0 39 24 64 64 64 32 0 55-19 58-50H87c-2 11-8 20-20 20-21 0-24-16-24-33 0-23 8-35 22-35 13 0 20 7 22 20z', fill: '#a9bacd' } },
]};
const _CPP: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M118.766 95.82c.89-1.543 1.441-3.28 1.441-4.843V36.78c0-1.558-.55-3.297-1.441-4.84l-55.32 31.94Zm0 0', fill: '#00599c' } },
  { tag: 'path', attrs: { d: 'm68.36 126.586 46.933-27.094c1.352-.781 2.582-2.129 3.473-3.672l-55.32-31.94L8.12 95.82c.89 1.543 2.121 2.89 3.473 3.672l46.933 27.094c2.703 1.562 7.13 1.562 9.832 0Zm0 0', fill: '#004482' } },
  { tag: 'path', attrs: { d: 'M118.766 31.941c-.891-1.546-2.121-2.894-3.473-3.671L68.359 1.172c-2.703-1.563-7.129-1.563-9.832 0L11.594 28.27C8.89 29.828 6.68 33.66 6.68 36.78v54.196c0 1.562.55 3.3 1.441 4.843L63.445 63.88Zm0 0', fill: '#659ad2' } },
  { tag: 'path', attrs: { d: 'M63.445 26.035c-20.867 0-37.843 16.977-37.843 37.844s16.976 37.844 37.843 37.844c13.465 0 26.024-7.247 32.77-18.91L79.84 73.335c-3.38 5.84-9.66 9.465-16.395 9.465-10.433 0-18.922-8.488-18.922-18.922 0-10.434 8.49-18.922 18.922-18.922 6.73 0 13.017 3.629 16.39 9.465l16.38-9.477c-6.75-11.664-19.305-18.91-32.77-18.91zM92.88 57.57v4.207h-4.207v4.203h4.207v4.207h4.203V65.98h4.203v-4.203h-4.203V57.57H92.88zm15.766 0v4.207h-4.204v4.203h4.204v4.207h4.207V65.98h4.203v-4.203h-4.203V57.57h-4.207z', fill: '#fff' } },
]};
const _MD: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M11.95 24.348c-5.836 0-10.618 4.867-10.618 10.681v57.942c0 5.814 4.782 10.681 10.617 10.681h104.102c5.835 0 10.617-4.867 10.617-10.681V35.03c0-5.814-4.783-10.681-10.617-10.681H14.898l-.002-.002H11.95zm-.007 9.543h104.108c.625 0 1.076.423 1.076 1.14v57.94c0 .717-.453 1.14-1.076 1.14H11.949c-.623 0-1.076-.423-1.076-1.14V35.029c0-.715.451-1.135 1.07-1.138z', fill: '#fff' } },
  { tag: 'path', attrs: { d: 'M20.721 84.1V43.9H32.42l11.697 14.78L55.81 43.9h11.696v40.2H55.81V61.044l-11.694 14.78-11.698-14.78V84.1H20.722zm73.104 0L76.28 64.591h11.697V43.9h11.698v20.69h11.698zm0 0', fill: '#fff' } },
]};
const _PHP: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M64 95.167c33.965 0 61.5-13.955 61.5-31.167 0-17.214-27.535-31.167-61.5-31.167S2.5 46.786 2.5 64c0 17.212 27.535 31.167 61.5 31.167Z', fill: '#777bb3' } },
  { tag: 'text', attrs: { x: '64', y: '72', 'text-anchor': 'middle', 'font-size': '28', fill: '#fff', 'font-weight': '700', 'font-family': 'monospace, ui-monospace' }, text: 'php' },
]};
const _RUBY: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'm35.971 111.33 81.958 11.188c-9.374-15.606-18.507-30.813-27.713-46.144Zm89.71-86.383L93.513 73.339c-.462.696-1.061 1.248-.41 2.321 8.016 13.237 15.969 26.513 23.942 39.777 1.258 2.095 2.53 4.182 4.157 6.192l4.834-96.58zM16.252 66.22c.375.355 1.311.562 1.747.347 7.689-3.779 15.427-7.474 22.948-11.564 2.453-1.333 4.339-3.723 6.452-5.661 6.997-6.417 13.983-12.847 20.966-19.278.427-.395.933-.777 1.188-1.275 2.508-4.902 4.973-9.829 7.525-14.898-3.043-1.144-5.928-2.263-8.849-3.281-.396-.138-1.02.136-1.449.375-6.761 3.777-13.649 7.353-20.195 11.472-3.275 2.061-5.943 5.098-8.843 7.743-4.674 4.266-9.342 8.542-13.948 12.882a24.011 24.011 0 0 0-3.288 3.854c-3.15 4.587-6.206 9.24-9.402 14.025 1.786 1.847 3.41 3.613 5.148 5.259zm28.102-6.271-11.556 48.823 54.3-34.987zm76.631-34.846-46.15 7.71 15.662 38.096zM44.996 56.644l41.892 13.6c-5.25-12.79-10.32-25.133-15.495-37.737ZM16.831 75.643 2.169 110.691l27.925-.825Zm13.593 26.096.346-.076c3.353-13.941 6.754-27.786 10.177-42.272L18.544 71.035c3.819 9.926 7.891 20.397 11.88 30.704zm84.927-78.897c-4.459-1.181-8.918-2.366-13.379-3.539-6.412-1.686-12.829-3.351-19.237-5.052-.801-.213-1.38-.352-1.851.613-2.265 4.64-4.6 9.245-6.901 13.868-.071.143-.056.328-.111.687l41.47-6.285zM89.482 12.288l36.343 10.054-6.005-17.11-30.285 6.715ZM33.505 114.007c-4.501-.519-9.122-.042-13.687.037-3.75.063-7.5.206-11.25.323-.386.012-.771.09-1.156.506 31.003 2.866 62.005 5.732 93.007 8.6l.063-.414-29.815-4.07c-12.384-1.691-24.747-3.551-37.162-4.982ZM2.782 99.994c3.995-9.27 7.973-18.546 11.984-27.809.401-.929.37-1.56-.415-2.308-1.678-1.597-3.237-3.318-5.071-5.226-2.479 12.24-4.897 24.177-7.317 36.113l.271.127c.185-.297.411-.578.548-.897zm78.74-90.153c6.737-1.738 13.572-3.097 20.367-4.613.44-.099.87-.244 1.303-.368l-.067-.332-29.194 3.928c2.741 1.197 4.853 2.091 7.591 1.385z', fill: '#d91404' } },
]};
const _JAVA: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M47.617 98.12c-19.192 5.362 11.677 16.439 36.115 5.969-4.003-1.556-6.874-3.351-6.874-3.351-10.897 2.06-15.952 2.222-25.844 1.092-8.164-.935-3.397-3.71-3.397-3.71zm33.189-10.46c-14.444 2.779-22.787 2.69-33.354 1.6-8.171-.845-2.822-4.805-2.822-4.805-21.137 7.016 11.767 14.977 41.309 6.336-3.14-1.106-5.133-3.131-5.133-3.131zm11.319-60.575c.001 0-42.731 10.669-22.323 34.187 6.024 6.935-1.58 13.17-1.58 13.17s15.289-7.891 8.269-17.777c-6.559-9.215-11.587-13.793 15.634-29.58zm9.998 81.144s3.529 2.91-3.888 5.159c-14.102 4.272-58.706 5.56-71.095.171-4.45-1.938 3.899-4.625 6.526-5.192 2.739-.593 4.303-.485 4.303-.485-4.952-3.487-32.013 6.85-13.742 9.815 49.821 8.076 90.817-3.637 77.896-9.468zM85 77.896c2.395-1.634 5.703-3.053 5.703-3.053s-9.424 1.685-18.813 2.474c-11.494.964-23.823 1.154-30.012.326-14.652-1.959 8.033-7.348 8.033-7.348s-8.812-.596-19.644 4.644C17.455 81.134 61.958 83.958 85 77.896zm5.609 15.145c-.108.29-.468.616-.468.616 31.273-8.221 19.775-28.979 4.822-23.725-1.312.464-2 1.543-2 1.543s.829-.334 2.678-.72c7.559-1.575 18.389 10.119-5.032 22.286zM64.181 70.069c-4.614-10.429-20.26-19.553.007-35.559C89.459 14.563 76.492 1.587 76.492 1.587c5.23 20.608-18.451 26.833-26.999 39.667-5.821 8.745 2.857 18.142 14.688 28.815zm27.274 51.748c-19.187 3.612-42.854 3.191-56.887.874 0 0 2.874 2.38 17.646 3.331 22.476 1.437 57-.8 57.816-11.436.001 0-1.57 4.032-18.575 7.231z', fill: '#EA2D2E' } },
]};
const _RUST: LangIconDef = { vb: '0 0 128 128', els: [
  { tag: 'path', attrs: { d: 'M62.96.242c-.232.135-1.203 1.528-2.16 3.097-2.4 3.94-2.426 3.942-5.65.55-2.098-2.208-2.605-2.612-3.28-2.607-.44.002-.995.152-1.235.332-.24.18-.916 1.612-1.504 3.183-1.346 3.6-1.41 3.715-2.156 3.86-.46.086-1.343-.407-3.463-1.929-1.565-1.125-3.1-2.045-3.411-2.045-1.291 0-1.655.706-2.27 4.4-.78 4.697-.754 4.681-4.988 2.758-1.71-.776-3.33-1.41-3.603-1.41-.274 0-.792.293-1.15.652-.652.652-.653.655-.475 4.246l.178 3.595-.68.364c-.602.322-1.017.283-3.684-.348-3.48-.822-4.216-.8-4.92.15l-.516.693.692 2.964c.38 1.63.745 3.2.814 3.487.067.287-.05.746-.26 1.02-.348.448-.717.49-3.94.44-5.452-.086-5.761.382-3.51 5.3.718 1.56 1.305 2.98 1.305 3.15 0 .898-.717 1.224-3.794 1.727-1.722.28-3.218.51-3.326.51-.107 0-.43.235-.717.522-.937.936-.671 1.816 1.453 4.814 2.646 3.735 2.642 3.75-1.73 5.421-4.971 1.902-5.072 2.37-1.287 5.96 3.525 3.344 3.53 3.295-.461 5.804C.208 62.8.162 62.846.085 63.876c-.093 1.253-.071 1.275 3.538 3.48 3.57 2.18 3.57 2.246.067 5.56C-.078 76.48.038 77 5.013 78.877c4.347 1.64 4.353 1.66 1.702 5.394-1.502 2.117-1.981 3-1.981 3.653 0 1.223.637 1.535 4.44 2.174 3.206.54 3.92.857 3.92 1.741 0 .182-.588 1.612-1.307 3.177-2.236 4.87-1.981 5.275 3.31 5.275 4.93 0 4.799-.15 3.737 4.294-.8 3.35-.813 3.992-.088 4.715.554.556 1.6.494 4.87-.289 2.499-.596 2.937-.637 3.516-.328l.66.354-.177 3.594c-.178 3.593-.177 3.595.475 4.248.358.36.884.652 1.165.652.282 0 1.903-.63 3.604-1.404 4.22-1.916 4.194-1.932 4.973 2.75.617 3.711.977 4.4 2.294 4.4.327 0 1.83-.88 3.34-1.958 2.654-1.893 3.342-2.19 4.049-1.74.182.115.89 1.67 1.572 3.455 1.003 2.625 1.37 3.31 1.929 3.576 1.062.51 1.72.1 4.218-2.62 3.016-3.286 3.14-3.27 5.602.72 2.72 4.406 3.424 4.396 6.212-.089 2.402-3.864 2.374-3.862 5.621-.47 2.157 2.25 2.616 2.61 3.343 2.61.464 0 1.019-.175 1.23-.388.214-.213.92-1.786 1.568-3.496.649-1.71 1.321-3.2 1.495-3.31.687-.436 1.398-.13 4.048 1.752 1.56 1.108 3.028 1.96 3.377 1.96 1.296 0 1.764-.92 2.302-4.535.46-3.082.554-3.378 1.16-3.685.596-.302.954-.2 3.75 1.07 1.701.77 3.323 1.402 3.604 1.402.282 0 .816-.302 1.184-.672l.672-.67-.184-3.448c-.177-3.29-.16-3.468.364-3.943.54-.488.596-.486 3.615.204 3.656.835 4.338.857 5.025.17.671-.67.664-.818-.254-4.69-1.03-4.346-1.168-4.19 3.78-4.19 3.374 0 3.75-.049 4.18-.523.718-.793.547-1.702-.896-4.779-.729-1.55-1.32-2.96-1.315-3.135.024-.914.743-1.227 4.065-1.767 2.033-.329 3.553-.71 3.829-.96.923-.833.584-1.918-1.523-4.873-2.642-3.703-2.63-3.738 1.599-5.297 5.064-1.866 5.209-2.488 1.419-6.09-3.51-3.335-3.512-3.317.333-5.677 4.648-2.853 4.655-3.496.082-6.335-3.933-2.44-3.93-2.406-.405-5.753 3.78-3.593 3.678-4.063-1.295-5.965-4.388-1.679-4.402-1.72-1.735-5.38 1.588-2.18 1.982-2.903 1.982-3.65 0-1.306-.586-1.598-4.436-2.22-3.216-.52-3.924-.835-3.924-1.75 0-.174.588-1.574 1.307-3.113 1.406-3.013 1.604-4.22.808-4.94-.428-.387-1-.443-4.067-.392-3.208.054-3.618.008-4.063-.439-.486-.488-.48-.557.278-3.725.931-3.88.935-3.975.17-4.694-.777-.73-1.262-.718-4.826.121-2.597.612-3.027.653-3.617.337l-.67-.36.185-3.582.186-3.58-.67-.67c-.369-.37-.891-.67-1.163-.67-.27 0-1.884.64-3.583 1.421-2.838 1.306-3.143 1.393-3.757 1.072-.612-.32-.714-.637-1.237-3.829-.603-3.693-.977-4.412-2.288-4.412-.311 0-1.853.925-3.426 2.055-2.584 1.856-2.93 2.032-3.574 1.807-.533-.186-.843-.59-1.221-1.599-.28-.742-.817-2.172-1.194-3.177-.762-2.028-1.187-2.482-2.328-2.482-.637 0-1.213.458-3.28 2.604-3.25 3.375-3.261 3.374-5.65-.545C66.073 1.78 65.075.382 64.81.24c-.597-.32-1.3-.32-1.85.002m2.96 11.798c2.83 2.014 1.326 6.75-2.144 6.75-3.368 0-5.064-4.057-2.66-6.36 1.358-1.3 3.304-1.459 4.805-.39m-3.558 12.507c1.855.705 2.616.282 6.852-3.8l3.182-3.07 1.347.18c4.225.56 12.627 4.25 17.455 7.666 4.436 3.14 10.332 9.534 12.845 13.93l.537.942-2.38 5.364c-1.31 2.95-2.382 5.673-2.382 6.053 0 .878.576 2.267 1.13 2.726.234.195 2.457 1.265 4.939 2.378l4.51 2.025.178 1.148c.23 1.495.26 5.167.052 6.21l-.163.816h-2.575c-2.987 0-2.756-.267-2.918 3.396-.118 2.656-.76 4.124-2.22 5.075-2.377 1.551-6.304 1.27-7.97-.57-.255-.284-.752-1.705-1.105-3.16-1.03-4.254-2.413-6.64-5.193-8.965-.878-.733-1.595-1.418-1.595-1.522 0-.102.965-.915 2.145-1.803 4.298-3.24 6.77-7.012 7.04-10.747.519-7.126-5.158-13.767-13.602-15.92-2.002-.51-2.857-.526-27.624-.526-14.057 0-25.56-.092-25.56-.204 0-.263 3.125-3.295 4.965-4.816 5.054-4.178 11.618-7.465 18.417-9.22l2.35-.61 3.34 3.387c1.839 1.863 3.64 3.5 4.003 3.637M20.3 46.34c1.539 1.008 2.17 3.54 1.26 5.062-1.405 2.356-4.966 2.455-6.373.178-2.046-3.309 1.895-7.349 5.113-5.24m90.672.13c4.026 2.454.906 8.493-3.404 6.586-2.877-1.273-2.97-5.206-.155-6.64 1.174-.6 2.523-.579 3.56.053M32.163 61.5v15.02h-13.28l-.526-2.285c-1.036-4.5-1.472-9.156-1.211-12.969l.182-2.679 4.565-2.047c2.864-1.283 4.706-2.262 4.943-2.625 1.038-1.584.94-2.715-.518-5.933l-.68-1.502h6.523V61.5M70.39 47.132c2.843.74 4.345 2.245 4.349 4.355.002 1.55-.765 2.52-2.67 3.38-1.348.61-1.562.625-10.063.708l-8.686.084v-8.92h7.782c6.078 0 8.112.086 9.288.393m-2.934 21.554c1.41.392 3.076 1.616 3.93 2.888.898 1.337 1.423 3.076 2.667 8.836 1.05 4.87 1.727 6.46 3.62 8.532 2.345 2.566 1.8 2.466 13.514 2.466 5.61 0 10.198.09 10.198.2 0 .197-3.863 4.764-4.03 4.764-.048 0-2.066-.422-4.484-.939-6.829-1.458-7.075-1.287-8.642 6.032l-1.008 4.702-.91.448c-1.518.75-6.453 2.292-9.01 2.82-4.228.87-8.828 1.162-12.871.821-6.893-.585-16.02-3.259-16.377-4.8-.075-.327-.535-2.443-1.018-4.704-.485-2.26-1.074-4.404-1.31-4.764-1.13-1.724-2.318-1.83-7.547-.674-1.98.44-3.708.796-3.84.796-.248 0-3.923-4.249-3.923-4.535 0-.09 8.728-.194 19.396-.23l19.395-.066.07-6.89c.05-4.865-.018-6.997-.23-7.25-.234-.284-1.485-.358-6.011-.358H53.32v-8.36l6.597.001c3.626.002 7.02.12 7.539.264M37.57 100.02c3.084 1.88 1.605 6.804-2.043 6.8-3.74 0-5.127-4.88-1.94-6.826 1.055-.643 2.908-.63 3.983.026m56.48.206c1.512 1.108 2.015 3.413 1.079 4.95-2.46 4.034-8.612.827-6.557-3.419 1.01-2.085 3.695-2.837 5.478-1.53', fill: '#CE4A00' } },
]};
// Custom icons for Go / JSON / YAML / SQL / Diff (no suitable devicon)
const _GO: LangIconDef = { vb: '0 0 60 60', els: [
  { tag: 'rect', attrs: { width: '60', height: '60', rx: '6', fill: '#00ACD7' } },
  { tag: 'text', attrs: { x: '30', y: '43', 'text-anchor': 'middle', 'font-size': '32', fill: '#fff', 'font-weight': '700', 'font-family': 'monospace, ui-monospace' }, text: 'Go' },
]};
const _JSON: LangIconDef = { vb: '0 0 60 60', els: [
  { tag: 'rect', attrs: { width: '60', height: '60', rx: '6', fill: '#5a9e47' } },
  { tag: 'text', attrs: { x: '30', y: '43', 'text-anchor': 'middle', 'font-size': '30', fill: '#fff', 'font-weight': '700', 'font-family': 'monospace, ui-monospace' }, text: '{}' },
]};
const _YAML: LangIconDef = { vb: '0 0 60 60', els: [
  { tag: 'rect', attrs: { width: '60', height: '60', rx: '6', fill: '#cb171e' } },
  { tag: 'text', attrs: { x: '30', y: '43', 'text-anchor': 'middle', 'font-size': '22', fill: '#fff', 'font-weight': '700', 'font-family': 'monospace, ui-monospace' }, text: 'YML' },
]};
const _SQL: LangIconDef = { vb: '0 0 60 60', els: [
  { tag: 'rect', attrs: { width: '60', height: '60', rx: '6', fill: '#e38c00' } },
  { tag: 'text', attrs: { x: '30', y: '43', 'text-anchor': 'middle', 'font-size': '22', fill: '#fff', 'font-weight': '700', 'font-family': 'monospace, ui-monospace' }, text: 'SQL' },
]};
const _DIFF: LangIconDef = { vb: '0 0 60 60', els: [
  { tag: 'rect', attrs: { width: '60', height: '60', rx: '6', fill: '#484848' } },
  { tag: 'text', attrs: { x: '18', y: '43', 'text-anchor': 'middle', 'font-size': '32', fill: '#3fb950', 'font-weight': '700', 'font-family': 'monospace, ui-monospace' }, text: '+' },
  { tag: 'text', attrs: { x: '44', y: '43', 'text-anchor': 'middle', 'font-size': '32', fill: '#f85149', 'font-weight': '700', 'font-family': 'monospace, ui-monospace' }, text: '-' },
]};
const LANG_ICON_MAP: Record<string, LangIconDef> = {
  js: _JS, javascript: _JS,
  ts: _TS, typescript: _TS,
  py: _PY, python: _PY,
  sh: _BASH, bash: _BASH, shell: _BASH,
  html: _HTML,
  css: _CSS,
  json: _JSON,
  yml: _YAML, yaml: _YAML,
  md: _MD, markdown: _MD,
  diff: _DIFF,
  sql: _SQL,
  go: _GO,
  rs: _RUST, rust: _RUST,
  c: _C,
  cpp: _CPP,
  java: _JAVA,
  rb: _RUBY, ruby: _RUBY,
  php: _PHP,
};

const NO_LINENUM_ATTR = 'data-no-linenum';
const LINENUMS_CLASS = 'gpcb-linenums';
const LINENUM_HL_CLASS = 'gpcb-linenum-hl';
const CODE_WRAP_CLASS = 'gpcb-code-wrap';
const HL_OVERLAY_CLASS = 'gpcb-hl-overlay';
const HL_LINE_CLASS = 'gpcb-hl-line';
const HL_LINE_HL_CLASS = 'gpcb-hl-line-hl';
const SPEC_RE = /\{([^}]+)\}/;

const NO_DIFF_ATTR = 'data-no-diff';
const DIFF_GUTTER_CLASS = 'gpcb-diff-gutter';
const DIFF_GUTTER_ADD_CLASS = 'gpcb-diff-add';
const DIFF_GUTTER_RM_CLASS = 'gpcb-diff-rm';
const DIFF_GUTTER_HH_CLASS = 'gpcb-diff-hh';
const DIFF_LINE_ADD_CLASS = 'gpcb-diff-line-add';
const DIFF_LINE_RM_CLASS = 'gpcb-diff-line-rm';
const DIFF_LINE_HH_CLASS = 'gpcb-diff-line-hh';
const DIFF_LINENUM_ADD_CLASS = 'gpcb-diff-linenum-add';
const DIFF_LINENUM_RM_CLASS = 'gpcb-diff-linenum-rm';
const DIFF_LINENUM_HH_CLASS = 'gpcb-diff-linenum-hh';

// GROWI のナビバー要素を検索するセレクタ候補（上から順に試す）
const NAVBAR_SELECTORS = [
  '#grw-contextual-sub-nav',
  '[data-testid="grw-contextual-sub-nav"]',
  '.grw-app-header',
  '.grw-navigation-header',
  'nav.navbar.fixed-top',
  'nav.navbar.sticky-top',
];

type CopyBtnState = 'copy' | 'ok' | 'ok-raw' | 'fail';
type DiffLineType = 'added' | 'removed' | 'hunk' | 'context';

interface LinenumConfig {
  start: number;
  highlights: Set<number>;
}

interface BlockRefs {
  toolbar: HTMLDivElement;
  filenameLabel: HTMLSpanElement | null;
  lineNums: HTMLElement | null;
  diffGutter: HTMLElement | null;
  codeWrap: HTMLDivElement | null;
  hlOverlay: HTMLDivElement | null;
  hlScrollHandler: (() => void) | null;
  copyBtn: HTMLButtonElement | null;
  copyHandler: ((e: MouseEvent) => void) | null;
  copyTimerId?: number;
}

const blockRefs = new WeakMap<HTMLPreElement, BlockRefs>();

function findNavbarEl(): HTMLElement | null {
  for (const selector of NAVBAR_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.offsetHeight > 0) return el;
  }
  return null;
}

function isHiddenContext(): boolean {
  const path = location.pathname;
  if (path === '/admin' || path.startsWith('/admin/')) return true;
  if (
    location.hash === '#edit' ||
    path.endsWith('/edit') ||
    document.body.classList.contains('editing') ||
    document.body.classList.contains('grw-editor-mode') ||
    document.body.classList.contains('modal-open')
  ) return true;
  return false;
}

function isInEditorDOM(pre: HTMLPreElement): boolean {
  return !!pre.closest('.CodeMirror, .cm-editor, [contenteditable="true"]');
}

// --- SVG helpers ---

function createSvgEl(tag: string, attrs: Record<string, string>): Element {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function buildSvg(children: Array<{ tag: string; attrs: Record<string, string> }>): SVGSVGElement {
  const svg = createSvgEl('svg', {
    width: '15', height: '15', viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  }) as SVGSVGElement;
  for (const { tag, attrs } of children) svg.appendChild(createSvgEl(tag, attrs));
  return svg;
}

function makeCopyIcon(): SVGSVGElement {
  return buildSvg([
    { tag: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
    { tag: 'path', attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } },
  ]);
}

function appendCheckBadge(svg: SVGSVGElement): void {
  svg.appendChild(createSvgEl('circle', {
    cx: '18', cy: '18', r: '5.5',
    stroke: 'currentColor', 'stroke-width': '1.5',
    class: 'gpcb-copy-badge-bg',
  }));
  svg.appendChild(createSvgEl('path', {
    d: 'M15.5 18.2l1.8 1.8 3.2-3.5',
    stroke: 'currentColor', 'stroke-width': '1.8',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    fill: 'none',
  }));
}

function makeCopyOkIcon(): SVGSVGElement {
  const svg = buildSvg([
    { tag: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
    { tag: 'path', attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } },
  ]);
  appendCheckBadge(svg);
  return svg;
}

function appendPlusMinusBadge(svg: SVGSVGElement): void {
  svg.appendChild(createSvgEl('circle', {
    cx: '18', cy: '18', r: '5.5',
    stroke: 'currentColor', 'stroke-width': '1.5',
    class: 'gpcb-copy-badge-bg',
  }));
  // ± 記号: 上部に + (水平 + 垂直)、下部に − (水平)
  svg.appendChild(createSvgEl('path', {
    d: 'M16 16 H20 M18 13.5 V18.5 M16 20.5 H20',
    stroke: 'currentColor', 'stroke-width': '1.8',
    'stroke-linecap': 'round',
    fill: 'none',
  }));
}

function makeCopyOkRawIcon(): SVGSVGElement {
  const svg = buildSvg([
    { tag: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
    { tag: 'path', attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } },
  ]);
  appendPlusMinusBadge(svg);
  return svg;
}

function makeFailIcon(): SVGSVGElement {
  return buildSvg([
    { tag: 'path', attrs: { d: 'M18 6 6 18' } },
    { tag: 'path', attrs: { d: 'm6 6 12 12' } },
  ]);
}

function makeLangIcon(lang: string): SVGSVGElement | null {
  const def = LANG_ICON_MAP[lang];
  if (!def) return null;
  const svg = createSvgEl('svg', {
    width: '16', height: '16', viewBox: def.vb,
    'aria-hidden': 'true', class: LANG_ICON_CLASS,
  }) as SVGSVGElement;
  for (const el of def.els) {
    const elem = createSvgEl(el.tag, el.attrs);
    if (el.text !== undefined) elem.textContent = el.text;
    svg.appendChild(elem);
  }
  return svg;
}

const COPY_BTN_STATE_MAP: Record<CopyBtnState, { icon: () => SVGSVGElement; label: string; className: string | null }> = {
  'copy': {
    icon: makeCopyIcon,
    label: 'Copy to Clipboard',
    className: null,
  },
  'ok': {
    icon: makeCopyOkIcon,
    label: 'Copied!',
    className: COPY_CLASS_OK,
  },
  'ok-raw': {
    icon: makeCopyOkRawIcon,
    label: 'Copied RAW Diff!',
    className: COPY_CLASS_OK_RAW,
  },
  'fail': {
    icon: makeFailIcon,
    label: 'Failed to Copy',
    className: COPY_CLASS_FAIL,
  },
};

function setCopyBtnState(btn: HTMLButtonElement, state: CopyBtnState): void {
  while (btn.firstChild) btn.removeChild(btn.firstChild);
  btn.classList.remove(COPY_CLASS_OK, COPY_CLASS_OK_RAW, COPY_CLASS_FAIL);
  const cfg = COPY_BTN_STATE_MAP[state];
  if (cfg.className) btn.classList.add(cfg.className);
  btn.setAttribute('aria-label', cfg.label);
  btn.setAttribute('data-gpcb-tooltip', cfg.label);
  if (state === 'copy' && btn.hasAttribute(COPY_BTN_DIFF_ATTR)) {
    const diffLabel = 'Copy to Clipboard (Shift+Click: Copy RAW Diff)';
    btn.setAttribute('aria-label', diffLabel);
    btn.setAttribute('data-gpcb-tooltip', diffLabel);
  }
  btn.appendChild(cfg.icon());
}

function flashCopyState(btn: HTMLButtonElement, state: 'ok' | 'ok-raw' | 'fail', pre: HTMLPreElement): void {
  const refs = blockRefs.get(pre);
  if (refs?.copyTimerId !== undefined) window.clearTimeout(refs.copyTimerId);
  setCopyBtnState(btn, state);
  const id = window.setTimeout(() => {
    setCopyBtnState(btn, 'copy');
    if (refs) refs.copyTimerId = undefined;
  }, COPY_FEEDBACK_MS);
  if (refs) refs.copyTimerId = id;
}

function handleCopyClick(e: MouseEvent, code: HTMLElement, btn: HTMLButtonElement, pre: HTMLPreElement): void {
  const rawText = code.textContent ?? '';
  const isRaw = e.shiftKey && isDiffTarget(pre, code);
  const text = isRaw ? rawText : (isDiffTarget(pre, code) ? extractNewCode(rawText) : rawText);
  navigator.clipboard.writeText(text).then(
    () => flashCopyState(btn, isRaw ? 'ok-raw' : 'ok', pre),
    (err) => {
      console.warn('[gpcb] clipboard write failed:', err);
      flashCopyState(btn, 'fail', pre);
    },
  );
}

// --- linenum spec parser ---

function parseLinenumSpec(inner: string): LinenumConfig {
  const config: LinenumConfig = { start: 1, highlights: new Set() };
  // ルックアヘッドで「次の key= が来るまで」を value として貪欲マッチ。
  // これにより hl=3,5-7 の内部カンマを誤分割しない。
  const re = /(\w+)\s*=\s*([^=]*?)(?=,\s*\w+\s*=|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    const key = m[1].trim();
    const value = m[2].trim();
    if (key === 'start') {
      const n = parseInt(value, 10);
      if (!isNaN(n) && n >= 1) config.start = n;
    } else if (key === 'hl') {
      for (const part of value.split(',')) {
        const t = part.trim();
        const range = t.match(/^(\d+)-(\d+)$/);
        if (range) {
          const from = parseInt(range[1], 10);
          const to = parseInt(range[2], 10);
          if (!isNaN(from) && !isNaN(to) && from <= to) {
            for (let i = from; i <= to; i++) config.highlights.add(i);
          }
        } else if (/^\d+$/.test(t)) {
          config.highlights.add(parseInt(t, 10));
        }
      }
    }
  }
  return config;
}

function findLinenumSpec(pre: HTMLPreElement, code: HTMLElement): string | null {
  // <code> の className 内を先に確認（filename なしの場合）
  for (const cls of code.classList) {
    if (cls.startsWith('language-')) {
      const match = cls.match(SPEC_RE);
      if (match) return match[1];
    }
  }
  // <cite> テキスト内を確認（filename ありの場合、GROWI が cite に filename+spec を入れる）
  const cite = pre.querySelector<HTMLElement>(GROWI_FILENAME_SELECTOR);
  if (cite) {
    const match = cite.textContent?.match(SPEC_RE);
    if (match) return match[1];
  }
  return null;
}

// --- diff helpers ---

function isDiffBlock(code: HTMLElement): boolean {
  return code.classList.contains('language-diff');
}

// {diff} 修飾子（例: ```python{diff}）を検出する
function hasDiffModifier(pre: HTMLPreElement, code: HTMLElement): boolean {
  const spec = findLinenumSpec(pre, code);
  if (!spec) return false;
  return spec.split(',').some(part => part.trim().toLowerCase() === 'diff');
}

function isDiffTarget(pre: HTMLPreElement, code: HTMLElement): boolean {
  return isDiffBlock(code) || hasDiffModifier(pre, code);
}

function classifyDiffLine(line: string): DiffLineType {
  if (line.startsWith('@@')) return 'hunk';
  // +++ / --- はファイルヘッダー行。コード行ではないため hunk と同様に扱い行番号を振らない
  if (line.startsWith('+++') || line.startsWith('---')) return 'hunk';
  if (line.startsWith('+')) return 'added';
  if (line.startsWith('-')) return 'removed';
  return 'context';
}

function extractNewCode(text: string): string {
  const stripped = text.endsWith('\n') ? text.slice(0, -1) : text;
  return stripped
    .split('\n')
    .flatMap(line => {
      const type = classifyDiffLine(line);
      if (type === 'hunk' || type === 'removed') return [];
      if (type === 'added') return [line.slice(1)];
      return [line.startsWith(' ') ? line.slice(1) : line];
    })
    .join('\n');
}

function setupDiffView(pre: HTMLPreElement, code: HTMLElement): void {
  if (pre.hasAttribute(NO_DIFF_ATTR)) return;

  const inner = Array.from(pre.children).find(
    (el): el is HTMLDivElement =>
      el.tagName === 'DIV' && !el.classList.contains('gpcb-toolbar'),
  );
  if (!inner) return;
  if (!inner.contains(code)) return;

  const text = code.textContent ?? '';
  const stripped = text.endsWith('\n') ? text.slice(0, -1) : text;
  if (stripped === '') return;
  const lines = stripped.split('\n');

  // {start=N} を解析して新ファイル側の開始行番号を決定
  const showLineNums = !pre.hasAttribute(NO_LINENUM_ATTR);
  let afterLineNum = 1;
  if (showLineNums) {
    const specStr = findLinenumSpec(pre, code);
    if (specStr) afterLineNum = parseLinenumSpec(specStr).start;
  }

  const linenumsAside = showLineNums ? document.createElement('aside') : null;
  if (linenumsAside) {
    linenumsAside.className = LINENUMS_CLASS;
    linenumsAside.setAttribute('aria-hidden', 'true');
  }

  const diffGutter = document.createElement('aside');
  diffGutter.className = DIFF_GUTTER_CLASS;
  diffGutter.setAttribute('aria-hidden', 'true');

  const hlOverlay = document.createElement('div');
  hlOverlay.className = `${HL_OVERLAY_CLASS} gpcb-diff-overlay`;
  hlOverlay.setAttribute('aria-hidden', 'true');

  for (const line of lines) {
    const type = classifyDiffLine(line);

    // 行番号列: context / added のみカウントアップ、removed / hunk は空白
    if (linenumsAside) {
      const numSpan = document.createElement('span');
      numSpan.textContent = (type === 'context' || type === 'added') ? String(afterLineNum) : ' ';
      if (type === 'added') numSpan.classList.add(DIFF_LINENUM_ADD_CLASS);
      else if (type === 'removed') numSpan.classList.add(DIFF_LINENUM_RM_CLASS);
      else if (type === 'hunk') numSpan.classList.add(DIFF_LINENUM_HH_CLASS);
      linenumsAside.appendChild(numSpan);
    }
    if (type === 'context' || type === 'added') afterLineNum++;

    // diff ガター列
    const span = document.createElement('span');
    if (type === 'added') {
      span.textContent = '+';
      span.classList.add(DIFF_GUTTER_ADD_CLASS);
    } else if (type === 'removed') {
      span.textContent = '\u2212'; // minus sign
      span.classList.add(DIFF_GUTTER_RM_CLASS);
    } else if (type === 'hunk') {
      span.textContent = '@';
      span.classList.add(DIFF_GUTTER_HH_CLASS);
    } else {
      span.textContent = ' ';
    }
    diffGutter.appendChild(span);

    // 背景オーバーレイ行
    const row = document.createElement('div');
    row.className = HL_LINE_CLASS;
    if (type === 'added') row.classList.add(DIFF_LINE_ADD_CLASS);
    else if (type === 'removed') row.classList.add(DIFF_LINE_RM_CLASS);
    else if (type === 'hunk') row.classList.add(DIFF_LINE_HH_CLASS);
    hlOverlay.appendChild(row);
  }

  const codeWrap = document.createElement('div');
  codeWrap.className = CODE_WRAP_CLASS;
  code.parentNode!.insertBefore(codeWrap, code);
  codeWrap.appendChild(code);
  codeWrap.prepend(hlOverlay);

  // DOM 順: [linenum] [diff-gutter] [code-wrap]
  // prepend は先頭挿入なので逆順で呼ぶ
  inner.prepend(diffGutter);
  if (linenumsAside) inner.prepend(linenumsAside);

  const refs = blockRefs.get(pre);
  if (refs) {
    refs.lineNums = linenumsAside;
    refs.diffGutter = diffGutter;
    refs.codeWrap = codeWrap;
    refs.hlOverlay = hlOverlay;
    const onScroll = () => {
      hlOverlay.style.transform = `translateX(${codeWrap.scrollLeft}px)`;
    };
    codeWrap.addEventListener('scroll', onScroll, { passive: true });
    refs.hlScrollHandler = onScroll;
  }
}

// --- setup / enhance / cleanup ---

function extractLanguage(code: HTMLElement): string | null {
  for (const cls of code.classList) {
    if (cls.startsWith('language-')) {
      const lang = cls.slice('language-'.length).replace(/\{[^}]*\}/, '').trim().toLowerCase();
      if (lang) return lang;
    }
  }
  return null;
}

function setupFilenameLabel(pre: HTMLPreElement, code: HTMLElement): void {
  if (pre.hasAttribute(NO_FILENAME_ATTR)) return;

  const cite = pre.querySelector<HTMLElement>(GROWI_FILENAME_SELECTOR);
  const filename = cite?.textContent?.trim().replace(/\s*\{[^}]*\}\s*$/, '').trim() || null;
  const lang = pre.hasAttribute(NO_LANG_ATTR) ? null : extractLanguage(code);

  if (!filename && !lang) return;

  const label = document.createElement('span');
  label.className = FILENAME_CLASS;
  if (filename) label.setAttribute(FILENAME_ATTR, filename);

  if (lang) {
    const icon = makeLangIcon(lang);
    if (icon) label.appendChild(icon);
  }

  label.appendChild(document.createTextNode(filename ?? (LANG_DISPLAY_MAP[lang!] ?? lang!)));
  pre.prepend(label);

  const refs = blockRefs.get(pre);
  if (refs) refs.filenameLabel = label;
}

function setupLineNumbers(pre: HTMLPreElement, code: HTMLElement): void {
  if (pre.hasAttribute(NO_LINENUM_ATTR)) return;

  const inner = Array.from(pre.children).find(
    (el): el is HTMLDivElement =>
      el.tagName === 'DIV' && !el.classList.contains('gpcb-toolbar'),
  );
  if (!inner) return;
  if (!inner.contains(code)) return;

  const text = code.textContent ?? '';
  const stripped = text.endsWith('\n') ? text.slice(0, -1) : text;
  if (stripped === '') return;
  const lineCount = stripped.split('\n').length;

  const specStr = findLinenumSpec(pre, code);
  const config: LinenumConfig = specStr
    ? parseLinenumSpec(specStr)
    : { start: 1, highlights: new Set() };

  const aside = document.createElement('aside');
  aside.className = LINENUMS_CLASS;
  aside.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < lineCount; i++) {
    const displayNum = config.start + i;
    const span = document.createElement('span');
    span.textContent = String(displayNum);
    if (config.highlights.has(displayNum)) span.classList.add(LINENUM_HL_CLASS);
    aside.appendChild(span);
  }

  // <code> を横スクロールコンテナで包む（aside を scroll の外に出して左固定を実現）
  const codeWrap = document.createElement('div');
  codeWrap.className = CODE_WRAP_CLASS;
  code.parentNode!.insertBefore(codeWrap, code);
  codeWrap.appendChild(code);

  // ハイライト行があればオーバーレイを挿入（flex 等分割で line-height 計測不要）
  let hlOverlay: HTMLDivElement | null = null;
  if (config.highlights.size > 0) {
    hlOverlay = document.createElement('div');
    hlOverlay.className = HL_OVERLAY_CLASS;
    hlOverlay.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < lineCount; i++) {
      const displayNum = config.start + i;
      const row = document.createElement('div');
      row.className = HL_LINE_CLASS;
      if (config.highlights.has(displayNum)) row.classList.add(HL_LINE_HL_CLASS);
      hlOverlay.appendChild(row);
    }
    codeWrap.prepend(hlOverlay);
  }

  inner.prepend(aside);

  const refs = blockRefs.get(pre);
  if (refs) {
    refs.lineNums = aside;
    refs.codeWrap = codeWrap;
    refs.hlOverlay = hlOverlay;
    if (hlOverlay) {
      const onScroll = () => {
        hlOverlay!.style.transform = `translateX(${codeWrap.scrollLeft}px)`;
      };
      codeWrap.addEventListener('scroll', onScroll, { passive: true });
      refs.hlScrollHandler = onScroll;
    }
  }
}

function setupCopyButton(toolbar: HTMLDivElement, code: HTMLElement, pre: HTMLPreElement): void {
  if (pre.hasAttribute(NO_COPY_ATTR)) return;
  if (typeof navigator.clipboard?.writeText !== 'function') return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute(COPY_BTN_ATTR, '1');
  if (isDiffTarget(pre, code)) btn.setAttribute(COPY_BTN_DIFF_ATTR, '1');
  setCopyBtnState(btn, 'copy');

  const copyHandler = (e: MouseEvent) => {
    e.preventDefault();
    handleCopyClick(e, code, btn, pre);
  };
  btn.addEventListener('click', copyHandler);
  toolbar.appendChild(btn);

  const refs = blockRefs.get(pre);
  if (refs) {
    refs.copyBtn = btn;
    refs.copyHandler = copyHandler;
  }
}

function isEligible(pre: HTMLPreElement): boolean {
  if (pre.hasAttribute(ENHANCED_ATTR)) return false;
  if (!pre.querySelector('code')) return false;
  if (isInEditorDOM(pre)) return false;
  return true;
}

function enhanceCodeBlock(pre: HTMLPreElement): void {
  const code = pre.querySelector<HTMLElement>('code');
  if (!code) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'gpcb-toolbar';

  blockRefs.set(pre, { toolbar, filenameLabel: null, lineNums: null, diffGutter: null, codeWrap: null, hlOverlay: null, hlScrollHandler: null, copyBtn: null, copyHandler: null });

  setupCopyButton(toolbar, code, pre);

  pre.classList.add('gpcb-enhanced');
  pre.prepend(toolbar);
  setupFilenameLabel(pre, code);
  if (isDiffTarget(pre, code)) {
    setupDiffView(pre, code);
  } else {
    setupLineNumbers(pre, code);
  }
  pre.setAttribute(ENHANCED_ATTR, '1');
}

function cleanupBlock(pre: HTMLPreElement): void {
  const refs = blockRefs.get(pre);
  if (refs) {
    if (refs.copyTimerId !== undefined) window.clearTimeout(refs.copyTimerId);
    if (refs.copyBtn && refs.copyHandler) {
      refs.copyBtn.removeEventListener('click', refs.copyHandler);
    }
    if (refs.hlScrollHandler && refs.codeWrap) {
      refs.codeWrap.removeEventListener('scroll', refs.hlScrollHandler);
    }
    if (refs.codeWrap?.isConnected) {
      while (refs.codeWrap.firstChild) {
        refs.codeWrap.parentNode!.insertBefore(refs.codeWrap.firstChild, refs.codeWrap);
      }
      refs.codeWrap.remove();
    }
    refs.lineNums?.remove();
    refs.diffGutter?.remove();
    refs.filenameLabel?.remove();
    refs.toolbar.remove();
    blockRefs.delete(pre);
  }
  pre.classList.remove('gpcb-enhanced');
  pre.removeAttribute(ENHANCED_ATTR);
}

function scanAndEnhance(): void {
  if (isHiddenContext()) return;
  document.querySelectorAll<HTMLPreElement>('pre').forEach(pre => {
    if (isEligible(pre)) enhanceCodeBlock(pre);
  });
}

export function createCodeBlockExtended(): { mount(): void; unmount(): void } {
  let observer: MutationObserver | null = null;
  let observerRafId: number | null = null;
  let scanRafId: number | null = null;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  function scheduleScan(): void {
    if (scanRafId !== null) return;
    scanRafId = requestAnimationFrame(() => {
      scanRafId = null;
      scanAndEnhance();
    });
  }

  function onNavigation(): void {
    requestAnimationFrame(() => {
      scheduleScan();
    });
  }

  function mount(): void {
    history.pushState = function (...args) {
      originalPushState(...args);
      window.dispatchEvent(new Event('growi-pcb-navigate'));
    };
    history.replaceState = function (...args) {
      originalReplaceState(...args);
      window.dispatchEvent(new Event('growi-pcb-navigate'));
    };

    window.addEventListener('popstate', onNavigation);
    window.addEventListener('hashchange', onNavigation);
    window.addEventListener('growi-pcb-navigate', onNavigation);

    observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of Array.from(m.addedNodes)) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node as Element;
            // プラグイン自身が追加した toolbar / filename label / linenums / diff-gutter は無視して無限ループを防ぐ
            if (
              el.classList?.contains('gpcb-toolbar') ||
              el.classList?.contains(FILENAME_CLASS) ||
              el.classList?.contains(LINENUMS_CLASS) ||
              el.classList?.contains(DIFF_GUTTER_CLASS) ||
              el.classList?.contains(CODE_WRAP_CLASS) ||
              el.classList?.contains(HL_OVERLAY_CLASS)
            ) continue;

            // GROWI が enhance 済み <pre> に後から <cite class="code-highlighted-title"> を追加するケース
            // （enhance 時点で cite がなく setupFilenameLabel が空振りした場合の救済）
            if (m.target.nodeType === Node.ELEMENT_NODE && el.matches?.(GROWI_FILENAME_SELECTOR)) {
              const parentPre = (m.target as Element).closest<HTMLPreElement>(`pre[${ENHANCED_ATTR}]`);
              if (parentPre) {
                const refs = blockRefs.get(parentPre);
                if (refs && !refs.filenameLabel) {
                  const code = parentPre.querySelector<HTMLElement>('code');
                  if (code) setupFilenameLabel(parentPre, code);
                }
              }
              continue;
            }

            // Prism が enhance 済み <pre> に後から内側 div を挿入 or 差し替えするケース
            // （enhance 時点で Prism div が未挿入の場合、および Prism がハイライト適用で div を差し替えた場合の救済）
            if (
              m.target.nodeType === Node.ELEMENT_NODE &&
              (m.target as Element).matches?.(`pre[${ENHANCED_ATTR}]`) &&
              el.tagName === 'DIV'
            ) {
              const parentPre = m.target as HTMLPreElement;
              const refs = blockRefs.get(parentPre);
              // lineNums（通常）または diffGutter（diff）のどちらかが切り離されていれば再セットアップ
              const activeGutter = refs?.lineNums ?? refs?.diffGutter;
              if (refs && (!activeGutter || !activeGutter.isConnected)) {
                if (refs.hlScrollHandler && refs.codeWrap) {
                  refs.codeWrap.removeEventListener('scroll', refs.hlScrollHandler);
                }
                refs.lineNums = null;
                refs.diffGutter = null;
                refs.codeWrap = null;
                refs.hlOverlay = null;
                refs.hlScrollHandler = null;
                const code = parentPre.querySelector<HTMLElement>('code');
                if (code) {
                  if (isDiffTarget(parentPre, code)) setupDiffView(parentPre, code);
                  else setupLineNumbers(parentPre, code);
                }
              }
              continue;
            }

            if (
              (el.tagName === 'PRE' && !el.hasAttribute(ENHANCED_ATTR)) ||
              el.querySelector(`pre:not([${ENHANCED_ATTR}])`)
            ) {
              shouldScan = true;
              break;
            }
          }
        } else if (m.type === 'attributes') {
          if (isHiddenContext()) {
            document.querySelectorAll<HTMLPreElement>(`pre[${ENHANCED_ATTR}]`).forEach(cleanupBlock);
          } else {
            shouldScan = true;
          }
        }
        if (shouldScan) break;
      }

      if (!shouldScan) return;
      if (observerRafId !== null) return;
      observerRafId = requestAnimationFrame(() => {
        observerRafId = null;
        scheduleScan();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    scheduleScan();
  }

  function unmount(): void {
    window.removeEventListener('popstate', onNavigation);
    window.removeEventListener('hashchange', onNavigation);
    window.removeEventListener('growi-pcb-navigate', onNavigation);

    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;

    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scanRafId !== null) {
      cancelAnimationFrame(scanRafId);
      scanRafId = null;
    }
    if (observerRafId !== null) {
      cancelAnimationFrame(observerRafId);
      observerRafId = null;
    }

    document.querySelectorAll<HTMLPreElement>(`pre[${ENHANCED_ATTR}]`).forEach(cleanupBlock);
  }

  return { mount, unmount };
}
