import React from 'react';
import { createRoot } from 'react-dom/client';
import DocView from '../app/doc-view';
import { DocumentProvider } from '../app/editor/doc-fields';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<DocumentProvider fields={{}} owner={false}><DocView /><footer style={{padding:'24px',textAlign:'center'}}>静态阅读版 · <a href="https://github.com/beiai-sama/lyric-grid-docs/edit/main/content/default-fields.json" target="_blank" rel="noreferrer">在 GitHub 编辑文档</a> · 保存源码后自动更新网站</footer></DocumentProvider>);
