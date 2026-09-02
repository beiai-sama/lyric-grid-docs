'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DocField, DocExtra, OwnerEntry, DocumentContext, useDocumentSections } from './editor/doc-fields';

const sectionDefaults = [
  { id: 'start', n: '01', title: '开始使用', eyebrow: 'START HERE', summary: '三分钟认识词格与推荐工作流', keywords: '开始 新手 教程 工作流 原词 中文' },
  { id: 'model', n: '02', title: '理解词格', eyebrow: 'CORE MODEL', summary: '普通音、长音、吸收与连读的区别', keywords: '格数 发音 音节 长音 吸收 连读 n q cl' },
  { id: 'phoneme', n: '03', title: '发音格操作', eyebrow: 'PHONEME EDITING', summary: '选中、吸收、连接、拆分与撤销', keywords: '点击 选择 合并 拆开 恢复 ctrl z' },
  { id: 'chinese', n: '04', title: '中文逐格编辑', eyebrow: 'CHINESE CELLS', summary: '逐格落字、延音、拼音与韵脚', keywords: '中文 拼音 韵脚 延音 破折号 粘贴' },
  { id: 'timeline', n: '05', title: '听感与时间轴', eyebrow: 'LISTENING', summary: '音频、LRC、SRT 与跟随滚动', keywords: '音频 mp3 lrc srt 播放 循环 滚动' },
  { id: 'blind', n: '06', title: '盲听打点', eyebrow: 'BLIND TAP', summary: '边听边用空格记录实际音位', keywords: '盲听 空格 la 对比 罗马音 英标' },
  { id: 'import', n: '07', title: '导入与导出', eyebrow: 'FILE SUPPORT', summary: '歌词、SVP、MIDI、VSQX、VPR', keywords: '导入 导出 json svp midi vsqx vpr 文件 轨道' },
  { id: 'lab', n: '08', title: '实验室', eyebrow: 'LAB', summary: '试验功能与即将开放的工具', keywords: '实验室 韵脚地图 自检 敬请期待' },
  { id: 'ai', n: '09', title: 'AI 参谋', eyebrow: 'AI ADVISOR', summary: '只做翻译与创作建议，不代写歌词', keywords: 'glm api 翻译 建议 隐喻 音乐背景 禁止生成' },
  { id: 'appearance', n: '10', title: '外观与隐私', eyebrow: 'PERSONAL SPACE', summary: '主题、液态玻璃、背景和本地保存', keywords: '外观 主题 配色 背景 液态玻璃 隐私 本地' },
  { id: 'shortcuts', n: '11', title: '快捷键', eyebrow: 'SHORTCUTS', summary: '把常用动作放进肌肉记忆', keywords: '键盘 快捷键 撤销 方向键 空格 回退' },
  { id: 'faq', n: '12', title: '常见问题', eyebrow: 'FAQ', summary: '格数、文件和播放问题排查', keywords: '问题 格数 不准 无法 播放 文件' },
];

const cellKinds = [
  { kind: '普通发音', token: 'ta', note: '通常建议占一个中文格', tone: 'plain' },
  { kind: '长音', token: 'kyū', note: '默认一字，可以拖长', tone: 'long' },
  { kind: '吸收', token: 'n', note: '不单独占字，仍保留发音信息', tone: 'absorb' },
  { kind: '连读', token: 'na + i', note: '两个实际音共同对应一个中文格', tone: 'join' },
];

const imports = [
  ['日文／英文歌词', '粘贴文本', '生成可编辑发音格；日文会显示罗马音，英文按单词与读音拆分。'],
  ['LRC／SRT', '时间字幕', '把歌词行挂到播放时间上，用于跟随滚动与听感校对。'],
  ['歌曲音频', 'MP3 · WAV · OGG', '在浏览器本地播放、循环句段；音频不会跟随工程导出。'],
  ['Synthesizer V', 'SVP · 测试中', '读取轨道、音符、歌词与时值；可在导入时重新分句。'],
  ['MIDI', 'MID · MIDI', '选择旋律轨并试听 MIDI；无歌词的音符仍可作为节奏格。'],
  ['VOCALOID', 'VSQX · VPR', '适配常见歌声轨与歌词；多轨工程会先让你选目标轨。'],
  ['词格工程', 'JSON', '完整保存格子、中文、时间标记与设置，之后可继续编辑。'],
];

function SectionHeading({ item }: { item: (typeof sectionDefaults)[number]; children: React.ReactNode }) {
  return <div className="section-heading"><span>{item.eyebrow}</span><DocField fieldId={`${item.id}-title`} as="h2" /><DocField fieldId={`${item.id}-intro`} as="p" /></div>;
}

function CopyLine({ children, fieldId }: { children: string; fieldId:string }) {
  const {fields}=useContext(DocumentContext);
  const [copied, setCopied] = useState(false);
  async function copy() {
    const plain=new DOMParser().parseFromString(fields[fieldId]??children,'text/html').body.textContent??'';
    await navigator.clipboard?.writeText(plain);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return <div className="copy-line"><DocField fieldId={fieldId} as="code" /><button onClick={copy}>{copied ? '已复制' : '复制'}</button></div>;
}

export default function DocView() {
  const sections=useDocumentSections(sectionDefaults);
  const [active, setActive] = useState('start');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((item) => `${item.title} ${item.summary} ${item.keywords}`.toLowerCase().includes(q));
  }, [query, sections]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-18% 0px -64% 0px', threshold: [0, .15, .4] });
    sectionDefaults.forEach(({ id }) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => searchRef.current?.focus(), 60);
    document.body.style.overflow = searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [searchOpen]);

  function goTo(id: string) {
    setSearchOpen(false); setQuery('');
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 20);
  }

  return (
    <main className="docs-shell">
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <header className="docs-topbar">
        <a className="docs-brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><b>词格</b><em>DOCS</em></a>
        <button className="search-trigger" onClick={() => setSearchOpen(true)}><span>搜索使用文档</span><kbd>Ctrl K</kbd></button>
        <div className="top-actions"><OwnerEntry /><span className="version-pill">GUIDE 1.0</span><a href="https://lyric-grid-cn.beiai.chatgpt.site/" target="_blank" rel="noreferrer">打开词格 <span>↗</span></a></div>
      </header>

      <aside className="docs-sidebar">
        <div className="sidebar-label">使用手册</div>
        <nav>{sections.map((item) => <a className={active === item.id ? 'active' : ''} href={`#${item.id}`} key={item.id}><span>{item.n}</span>{item.title}</a>)}</nav>
        <div className="sidebar-card"><span>LOCAL FIRST</span><b>你的工程留在设备上</b><p>歌词、音频与工程文件默认只在当前浏览器中处理。</p></div>
      </aside>

      <article className="docs-content" id="top">
        <div className="breadcrumb"><span>词格文档</span><i>/</i><b>{sections.find((item) => item.id === active)?.title}</b></div>

        <section className="docs-hero" id="start">
          <div className="hero-copy"><span className="hero-kicker">THE OFFICIAL FIELD GUIDE</span><DocField fieldId="start-h1-1" as="h1" /><DocField fieldId="start-p-1" as="p" /><div className="hero-actions"><a href="#model">从核心概念开始</a><a className="secondary" href="https://lyric-grid-cn.beiai.chatgpt.site/" target="_blank" rel="noreferrer">进入编辑器 ↗</a></div><div className="hero-meta"><span><DocField fieldId="start-b-1" as="b" /> 个章节</span><span><DocField fieldId="start-b-2" as="b" /> 分钟上手</span><span><DocField fieldId="start-b-3" as="b" /> 不上传音频</span></div></div>
          <div className="hero-demo" aria-label="发音格示例"><div className="demo-head"><span>LIVE CONCEPT</span><DocField fieldId="start-b-4" as="b" /></div><div className="sound-row"><span>na</span><button tabIndex={-1}>⌁<small>连</small></button><span>i</span><i>→</i><strong>一格</strong></div><div className="demo-output"><span>你</span><DocField fieldId="start-b-5" as="b" /></div><DocField fieldId="start-p-2" as="p" /></div>
        <DocExtra section="start" /></section>

        <section className="doc-section" id="model">
          <div className="section-number">02</div><SectionHeading item={sections[1]}>整个软件只有一个核心关系：实际唱法决定基础格数，中文填词在这个基础上延长、吸收、连接或拆分。</SectionHeading>
          <div className="workflow"><article><span>01</span><DocField fieldId="model-b-1" as="b" /><DocField fieldId="model-p-1" as="p" /></article><i>→</i><article><span>02</span><DocField fieldId="model-b-2" as="b" /><DocField fieldId="model-p-2" as="p" /></article><i>→</i><article><span>03</span><DocField fieldId="model-b-3" as="b" /><DocField fieldId="model-p-3" as="p" /></article></div>
          <div className="kind-grid">{cellKinds.map((cell) => <article className={`kind-card ${cell.tone}`} key={cell.kind}><span>{cell.kind}</span><strong>{cell.token}</strong><DocField fieldId={`kind-${cell.token}`} as="p" /></article>)}</div>
          <div className="callout important"><span>记住这一句</span><DocField fieldId="model-p-4" as="p" /></div>
        <DocExtra section="model" /></section>

        <section className="doc-section" id="phoneme">
          <div className="section-number">03</div><SectionHeading item={sections[2]}>新版交互把“选择”和“修改”分开：点发音格只会选中，任何会改变格数的操作都要再按一次明确按钮。</SectionHeading>
          <div className="three-column"><article><span className="mini-index">A</span><DocField fieldId="phoneme-h3-1" as="h3" /><DocField fieldId="phoneme-p-1" as="p" /><div className="mini-grid"><DocField fieldId="phoneme-b-1" as="b" /><b className="absorbed">n<small>吸收</small></b><DocField fieldId="phoneme-b-2" as="b" /></div></article><article><span className="mini-index">B</span><DocField fieldId="phoneme-h3-2" as="h3" /><DocField fieldId="phoneme-p-2" as="p" /><div className="mini-grid"><DocField fieldId="phoneme-b-3" as="b" /><i>⌁</i><DocField fieldId="phoneme-b-4" as="b" /><em>一格</em></div></article><article><span className="mini-index">C</span><DocField fieldId="phoneme-h3-3" as="h3" /><DocField fieldId="phoneme-p-3" as="p" /><div className="key-row"><kbd>Ctrl</kbd><span>+</span><kbd>Z</kbd><em>撤销</em></div></article></div>
          <div className="example-panel"><div><span>例 01 · 连读</span><DocField fieldId="phoneme-h3-4" as="h3" /><CopyLine fieldId="phoneme-example-1">a n ta ra ni o ku ru ho ko ro bi no u ta</CopyLine><DocField fieldId="phoneme-p-4" as="p" /></div><div><span>例 02 · 元音滑连</span><DocField fieldId="phoneme-h3-5" as="h3" /><CopyLine fieldId="phoneme-example-2">ra ga e na i sa n da i yo kkyu u ka mi no ma ni ma ni</CopyLine><DocField fieldId="phoneme-p-5" as="p" /></div></div>
        <DocExtra section="phoneme" /></section>

        <section className="doc-section" id="chinese">
          <div className="section-number">04</div><SectionHeading item={sections[3]}>一个格通常填一个中文字。延音用“—”表达，它只延长前一个字，不会多算一个发音。</SectionHeading>
          <div className="lyric-board"><div className="lyric-board-head"><span>中文填词示例</span><DocField fieldId="chinese-b-1" as="b" /></div><div className="lyric-cells">{['你|nǐ','的|de','触|chù','摸|mō','让|ràng','我|wǒ','—|延音','心|xīn','脏|zàng','暂|zàn','—|延音','停|tíng','—|延音'].map((item, index) => { const [han, py] = item.split('|'); return <div className={han === '—' ? 'sustain' : ''} key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><b>{han}</b><small>{py}</small></div>; })}</div><DocField fieldId="chinese-p-1" as="p" /></div>
          <div className="feature-split"><article><span>01</span><div><DocField fieldId="chinese-h3-1" as="h3" /><DocField fieldId="chinese-p-2" as="p" /></div></article><article><span>02</span><div><DocField fieldId="chinese-h3-2" as="h3" /><DocField fieldId="chinese-p-3" as="p" /></div></article><article><span>03</span><div><DocField fieldId="chinese-h3-3" as="h3" /><DocField fieldId="chinese-p-4" as="p" /></div></article></div>
        <DocExtra section="chinese" /></section>

        <section className="doc-section" id="timeline">
          <div className="section-number">05</div><SectionHeading item={sections[4]}>把音频和时间字幕放在一起，播放到哪一句，歌词列表与整组词格就跟到哪一句。</SectionHeading>
          <div className="player-demo"><div className="wave">{Array.from({ length: 46 }, (_, i) => <i key={i} style={{ height: `${18 + ((i * 17) % 42)}px` }} />)}</div><div className="playline"><button>▶</button><span>01:09.66</span><div><i /></div><DocField fieldId="timeline-b-1" as="b" /></div><div className="karaoke-lines"><DocField fieldId="timeline-p-1" as="p" /><DocField fieldId="timeline-p-2" as="p" className="playing" /><DocField fieldId="timeline-p-3" as="p" /></div></div>
          <div className="step-list"><article><span>1</span><div><DocField fieldId="timeline-b-2" as="b" /><DocField fieldId="timeline-p-4" as="p" /></div></article><article><span>2</span><div><DocField fieldId="timeline-b-3" as="b" /><DocField fieldId="timeline-p-5" as="p" /></div></article><article><span>3</span><div><DocField fieldId="timeline-b-4" as="b" /><DocField fieldId="timeline-p-6" as="p" /></div></article></div>
          <div className="callout"><span>为什么只导入音频不会滚动？</span><DocField fieldId="timeline-p-7" as="p" /></div>
        <DocExtra section="timeline" /></section>

        <section className="doc-section" id="blind">
          <div className="section-number">06</div><SectionHeading item={sections[5]}>不先相信自动分词，直接用耳朵记录每个落点。这个模式必须同时有歌曲音频和真正的 .lrc 文件。</SectionHeading>
          <div className="blind-stage"><div className="blind-top"><span>BLIND TAP SESSION</span><DocField fieldId="blind-b-1" as="b" /><em>REC 00:18.42</em></div><div className="tap-track"><i /><span>la</span><span>la</span><span>la</span><span>la</span><span className="now">la</span><b /></div><div className="blind-actions"><div><kbd>Space</kbd><span>记录 la</span></div><div><kbd>Backspace</kbd><span>删除最后一个</span></div><div><kbd>Esc</kbd><span>退出打点</span></div></div></div>
          <ol className="numbered-guide"><li><span>01</span><div><DocField fieldId="blind-h3-1" as="h3" /><DocField fieldId="blind-p-1" as="p" /></div></li><li><span>02</span><div><DocField fieldId="blind-h3-2" as="h3" /><DocField fieldId="blind-p-2" as="p" /></div></li><li><span>03</span><div><DocField fieldId="blind-h3-3" as="h3" /><DocField fieldId="blind-p-3" as="p" /></div></li><li><span>04</span><div><DocField fieldId="blind-h3-4" as="h3" /><DocField fieldId="blind-p-4" as="p" /></div></li></ol>
        <DocExtra section="blind" /></section>

        <section className="doc-section" id="import">
          <div className="section-number">07</div><SectionHeading item={sections[6]}>顶部只保留一个“导入”入口。打开后再选择来源，避免按钮越来越多。</SectionHeading>
          <div className="import-table"><div className="table-head"><span>来源</span><span>格式</span><span>词格会做什么</span></div>{imports.map((row, rowIndex) => <div className="table-row" key={row[0]}><DocField fieldId={`import-${rowIndex}-0`} as="b" /><DocField fieldId={`import-${rowIndex}-1`} as="code" /><DocField fieldId={`import-${rowIndex}-2`} as="p" /></div>)}</div>
          <div className="two-callouts"><div className="callout safe"><span>原文件安全</span><DocField fieldId="import-p-1" as="p" /></div><div className="callout warn"><span>分句不是一次定死</span><DocField fieldId="import-p-2" as="p" /></div></div>
        <DocExtra section="import" /></section>

        <section className="doc-section" id="lab">
          <div className="section-number">08</div><SectionHeading item={sections[7]}>实验室容纳仍在验证中的辅助工具。能稳定帮助填词的先开放，其余工具保持锁定。</SectionHeading>
          <div className="lab-grid"><article className="lab-live"><span>LIVE</span><DocField fieldId="lab-b-1" as="b" /><DocField fieldId="lab-p-1" as="p" /><em>立即使用 →</em></article><article className="lab-live"><span>LIVE</span><DocField fieldId="lab-b-2" as="b" /><DocField fieldId="lab-p-2" as="p" /><em>立即使用 →</em></article><article className="lab-live"><span>LIVE</span><DocField fieldId="lab-b-3" as="b" /><DocField fieldId="lab-p-3" as="p" /><em>立即使用 →</em></article><article className="lab-live"><span>LIVE</span><DocField fieldId="lab-b-4" as="b" /><DocField fieldId="lab-p-4" as="p" /><em>立即使用 →</em></article></div>
          <div className="coming-shop"><div className="shop-sign"><span>COMING SOON</span><DocField fieldId="lab-b-5" as="b" /><DocField fieldId="lab-p-5" as="p" /></div><div className="shutter">{Array.from({ length: 24 }, (_, i) => <i key={i} />)}<span>词格实验商店</span><DocField fieldId="lab-b-6" as="b" /></div></div>
        <DocExtra section="lab" /></section>

        <section className="doc-section" id="ai">
          <div className="section-number">09</div><SectionHeading item={sections[8]}>AI 是查资料和打开思路的参谋，不是替你写中文填词的人。模型由用户自行配置，当前按 GLM 4.7 兼容方式连接。</SectionHeading>
          <div className="ai-policy"><div className="ai-warning"><span>创作红线</span><DocField fieldId="ai-h3-1" as="h3" /><DocField fieldId="ai-p-1" as="p" /><div className="warning-tape"><span>AI 只是工具 · 不是偷懒的捷径 · 保留人的判断 · AI 只是工具 ·</span></div></div><div className="policy-cols"><article><span>可以问</span><ul><DocField fieldId="ai-li-1" as="li" /><DocField fieldId="ai-li-2" as="li" /><DocField fieldId="ai-li-3" as="li" /><DocField fieldId="ai-li-4" as="li" /></ul></article><article className="no"><span>不可以</span><ul><DocField fieldId="ai-li-5" as="li" /><DocField fieldId="ai-li-6" as="li" /><DocField fieldId="ai-li-7" as="li" /><DocField fieldId="ai-li-8" as="li" /></ul></article></div></div>
          <div className="setup-strip"><span>01</span><div><DocField fieldId="ai-b-1" as="b" /><DocField fieldId="ai-p-2" as="p" /></div><span>02</span><div><DocField fieldId="ai-b-2" as="b" /><DocField fieldId="ai-p-3" as="p" /></div><span>03</span><div><DocField fieldId="ai-b-3" as="b" /><DocField fieldId="ai-p-4" as="p" /></div></div>
        <DocExtra section="ai" /></section>

        <section className="doc-section" id="appearance">
          <div className="section-number">10</div><SectionHeading item={sections[9]}>让工具适应你的眼睛，而不是让背景图压过正在编辑的歌词。</SectionHeading>
          <div className="appearance-showcase"><div className="theme-preview"><div className="preview-window"><i /><i /><i /><span>液态玻璃</span></div><div className="preview-card"><span>cho</span><span>he</span><span className="ghost">n</span><span>shi</span></div><div className="preview-cell"><DocField fieldId="appearance-b-1" as="b" /><small>xīn · in 韵</small></div></div><div className="appearance-copy"><article><DocField fieldId="appearance-b-2" as="b" /><DocField fieldId="appearance-p-1" as="p" /></article><article><DocField fieldId="appearance-b-3" as="b" /><DocField fieldId="appearance-p-2" as="p" /></article><article><DocField fieldId="appearance-b-4" as="b" /><DocField fieldId="appearance-p-3" as="p" /></article></div></div>
          <div className="privacy-grid"><article><span>只在本机</span><DocField fieldId="appearance-b-5" as="b" /><DocField fieldId="appearance-p-4" as="p" /></article><article><span>不会上传</span><DocField fieldId="appearance-b-6" as="b" /><DocField fieldId="appearance-p-5" as="p" /></article><article><span>你来决定</span><DocField fieldId="appearance-b-7" as="b" /><DocField fieldId="appearance-p-6" as="p" /></article></div>
        <DocExtra section="appearance" /></section>

        <section className="doc-section" id="shortcuts">
          <div className="section-number">11</div><SectionHeading item={sections[10]}>高频动作尽量不离开键盘。盲听打点中的空格只在该模式播放时生效。</SectionHeading>
          <div className="shortcut-table"><div><span>撤销上一步</span><DocField fieldId="shortcuts-p-1" as="p" /><kbd>Ctrl</kbd><i>+</i><kbd>Z</kbd></div><div><span>移动到相邻格</span><DocField fieldId="shortcuts-p-2" as="p" /><kbd>←</kbd><i>/</i><kbd>→</kbd></div><div><span>盲听记录一个音</span><DocField fieldId="shortcuts-p-3" as="p" /><kbd>Space</kbd></div><div><span>删除最后一个打点</span><DocField fieldId="shortcuts-p-4" as="p" /><kbd>Backspace</kbd></div><div><span>搜索本文档</span><DocField fieldId="shortcuts-p-5" as="p" /><kbd>Ctrl</kbd><i>+</i><kbd>K</kbd></div><div><span>关闭弹窗</span><DocField fieldId="shortcuts-p-6" as="p" /><kbd>Esc</kbd></div></div>
        <DocExtra section="shortcuts" /></section>

        <section className="doc-section faq-section" id="faq">
          <div className="section-number">12</div><SectionHeading item={sections[11]}>先看最常碰到的情况。仍然解决不了时，导出工程备份再反馈，最容易复现。</SectionHeading>
          <div className="faq-list"><details open><summary><DocField fieldId="faq-question-1" as="span" /><span>＋</span></summary><DocField fieldId="faq-p-1" as="p" /></details><details><summary><DocField fieldId="faq-question-2" as="span" /><span>＋</span></summary><DocField fieldId="faq-p-2" as="p" /></details><details><summary><DocField fieldId="faq-question-3" as="span" /><span>＋</span></summary><DocField fieldId="faq-p-3" as="p" /></details><details><summary><DocField fieldId="faq-question-4" as="span" /><span>＋</span></summary><DocField fieldId="faq-p-4" as="p" /></details><details><summary><DocField fieldId="faq-question-5" as="span" /><span>＋</span></summary><DocField fieldId="faq-p-5" as="p" /></details><details><summary><DocField fieldId="faq-question-6" as="span" /><span>＋</span></summary><DocField fieldId="faq-p-6" as="p" /></details></div>
          <div className="closing-card"><span>READY WHEN YOU ARE</span><DocField fieldId="faq-h2-1" as="h2" /><DocField fieldId="faq-p-7" as="p" /><a href="https://lyric-grid-cn.beiai.chatgpt.site/" target="_blank" rel="noreferrer">打开词格编辑器 ↗</a></div>
        <DocExtra section="faq" /></section>

        <footer><div><span className="brand-mark"><i /><i /><i /></span><b>词格使用手册</b></div><p>策划与制作：北艾sama</p><span>最后更新 · 2026.08.27</span></footer>
      </article>

      <aside className="page-rail"><span>本页目录</span>{sections.map((item) => <a className={active === item.id ? 'active' : ''} href={`#${item.id}`} key={item.id}>{item.title}</a>)}<div className="rail-rule" /><p><b>预计阅读</b><span>15 分钟</span></p><p><b>文档版本</b><span>Guide 1.0</span></p></aside>

      {searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="搜索使用文档" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><div className="search-modal"><div className="search-box"><span>⌕</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索：吸收、LRC、MIDI、韵脚……" /><kbd>ESC</kbd></div><div className="search-results"><div className="result-label">{query ? `找到 ${results.length} 个章节` : '快速前往'}</div>{results.map((item) => <button key={item.id} onClick={() => goTo(item.id)}><span>{item.n}</span><div><b>{item.title}</b><p>{item.summary}</p></div><em>↗</em></button>)}{results.length === 0 && <div className="no-result"><b>没有找到这一项</b><p>试试搜索“吸收”“LRC”“MIDI”或“韵脚”。</p></div>}</div><div className="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 浏览</span><span><kbd>Enter</kbd> 打开</span><span>词格文档搜索</span></div></div></div>}
    </main>
  );
}
