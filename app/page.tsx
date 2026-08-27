'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const sections = [
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

function SectionHeading({ item, children }: { item: (typeof sections)[number]; children: React.ReactNode }) {
  return <div className="section-heading"><span>{item.eyebrow}</span><h2>{item.title}</h2><p>{children}</p></div>;
}

function CopyLine({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard?.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return <div className="copy-line"><code>{children}</code><button onClick={copy}>{copied ? '已复制' : '复制'}</button></div>;
}

export default function Home() {
  const [active, setActive] = useState('start');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((item) => `${item.title} ${item.summary} ${item.keywords}`.toLowerCase().includes(q));
  }, [query]);

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
    sections.forEach(({ id }) => { const element = document.getElementById(id); if (element) observer.observe(element); });
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
        <div className="top-actions"><span className="version-pill">GUIDE 1.0</span><a href="https://lyric-grid-cn.beiai.chatgpt.site/" target="_blank" rel="noreferrer">打开词格 <span>↗</span></a></div>
      </header>

      <aside className="docs-sidebar">
        <div className="sidebar-label">使用手册</div>
        <nav>{sections.map((item) => <a className={active === item.id ? 'active' : ''} href={`#${item.id}`} key={item.id}><span>{item.n}</span>{item.title}</a>)}</nav>
        <div className="sidebar-card"><span>LOCAL FIRST</span><b>你的工程留在设备上</b><p>歌词、音频与工程文件默认只在当前浏览器中处理。</p></div>
      </aside>

      <article className="docs-content" id="top">
        <div className="breadcrumb"><span>词格文档</span><i>/</i><b>{sections.find((item) => item.id === active)?.title}</b></div>

        <section className="docs-hero" id="start">
          <div className="hero-copy"><span className="hero-kicker">THE OFFICIAL FIELD GUIDE</span><h1>把听见的每一个音，<br /><em>稳稳放进中文里。</em></h1><p>词格不是翻译器，也不是自动填词机器。它把原唱拆成可操作的发音格，让你听清楚、数明白，再亲手决定中文怎么落。</p><div className="hero-actions"><a href="#model">从核心概念开始</a><a className="secondary" href="https://lyric-grid-cn.beiai.chatgpt.site/" target="_blank" rel="noreferrer">进入编辑器 ↗</a></div><div className="hero-meta"><span><b>12</b> 个章节</span><span><b>15</b> 分钟上手</span><span><b>本地优先</b> 不上传音频</span></div></div>
          <div className="hero-demo" aria-label="发音格示例"><div className="demo-head"><span>LIVE CONCEPT</span><b>一个中文格，可以容纳几个实际音</b></div><div className="sound-row"><span>na</span><button tabIndex={-1}>⌁<small>连</small></button><span>i</span><i>→</i><strong>一格</strong></div><div className="demo-output"><span>你</span><b>nǐ · i 韵</b></div><p>连读和吸收不是固定答案，要以原唱听感为准。</p></div>
        </section>

        <section className="doc-section" id="model">
          <div className="section-number">02</div><SectionHeading item={sections[1]}>整个软件只有一个核心关系：实际唱法决定基础格数，中文填词在这个基础上延长、吸收、连接或拆分。</SectionHeading>
          <div className="workflow"><article><span>01</span><b>导入原词</b><p>日文、英文或工程文件先变成实际唱法。</p></article><i>→</i><article><span>02</span><b>校正发音格</b><p>明确设置吸收、连读、长音与拆音。</p></article><i>→</i><article><span>03</span><b>填写中文</b><p>逐格落字，用拼音和韵脚检查唱感。</p></article></div>
          <div className="kind-grid">{cellKinds.map((cell) => <article className={`kind-card ${cell.tone}`} key={cell.kind}><span>{cell.kind}</span><strong>{cell.token}</strong><p>{cell.note}</p></article>)}</div>
          <div className="callout important"><span>记住这一句</span><p>词格给的是“基础建议”，不是硬性答案。<b>你听到的唱法永远高于自动规则。</b>同一组假名在不同速度、咬字和旋律里，可能需要不同处理。</p></div>
        </section>

        <section className="doc-section" id="phoneme">
          <div className="section-number">03</div><SectionHeading item={sections[2]}>新版交互把“选择”和“修改”分开：点发音格只会选中，任何会改变格数的操作都要再按一次明确按钮。</SectionHeading>
          <div className="three-column"><article><span className="mini-index">A</span><h3>吸收一个音</h3><p>选中 <code>n</code>、<code>q</code> 或其他不想独立占字的音，再点“吸收此音”。它会变成虚线格，但发音信息仍保留。</p><div className="mini-grid"><b>a</b><b className="absorbed">n<small>吸收</small></b><b>ta</b></div></article><article><span className="mini-index">B</span><h3>连接两个音</h3><p>点两个相邻格之间的连接点，或选中后用“与前音／后音连成一格”。连接后共同对应一个中文格。</p><div className="mini-grid"><b>no</b><i>⌁</i><b>u</b><em>一格</em></div></article><article><span className="mini-index">C</span><h3>恢复与拆开</h3><p>选中吸收格可“恢复计字”；选中连读格可拆开。改错时直接撤销，原本的长音状态也会保留。</p><div className="key-row"><kbd>Ctrl</kbd><span>+</span><kbd>Z</kbd><em>撤销</em></div></article></div>
          <div className="example-panel"><div><span>例 01 · 连读</span><h3>no 和 u 连起来</h3><CopyLine>a n ta ra ni o ku ru ho ko ro bi no u ta</CopyLine><p>原唱里 <code>no</code> 与 <code>u</code> 如果听成一个连续落点，就把两格连接；不要把所有 <code>o + u</code> 都自动合并。</p></div><div><span>例 02 · 元音滑连</span><h3>na + i、da + i 也可以是一格</h3><CopyLine>ra ga e na i sa n da i yo kkyu u ka mi no ma ni ma ni</CopyLine><p><code>na + i</code>、<code>da + i</code> 是否合一，要看速度、音符边界和实际咬字。词格会提示可能性，最后由你确认。</p></div></div>
        </section>

        <section className="doc-section" id="chinese">
          <div className="section-number">04</div><SectionHeading item={sections[3]}>一个格通常填一个中文字。延音用“—”表达，它只延长前一个字，不会多算一个发音。</SectionHeading>
          <div className="lyric-board"><div className="lyric-board-head"><span>中文填词示例</span><b>12 个字 · 18 个实际音位</b></div><div className="lyric-cells">{['你|nǐ','的|de','触|chù','摸|mō','让|ràng','我|wǒ','—|延音','心|xīn','脏|zàng','暂|zàn','—|延音','停|tíng','—|延音'].map((item, index) => { const [han, py] = item.split('|'); return <div className={han === '—' ? 'sustain' : ''} key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><b>{han}</b><small>{py}</small></div>; })}</div><p>“我”后面的延音只是让这个字唱得更舒服，和新增发音无关。</p></div>
          <div className="feature-split"><article><span>01</span><div><h3>连续输入，也能逐格修改</h3><p>直接粘贴一句中文会按格填入；随后可以点任意格改单字、删除格、拆格或补延音。</p></div></article><article><span>02</span><div><h3>拼音自动跟随</h3><p>每个中文字下方显示拼音，句尾还会标出韵脚，方便检查相邻句是否押在同一组韵上。</p></div></article><article><span>03</span><div><h3>格数差异随时可见</h3><p>顶部同时显示基础建议和当前设计。少字不一定错，但你会知道哪里用了延音、连读或吸收。</p></div></article></div>
        </section>

        <section className="doc-section" id="timeline">
          <div className="section-number">05</div><SectionHeading item={sections[4]}>把音频和时间字幕放在一起，播放到哪一句，歌词列表与整组词格就跟到哪一句。</SectionHeading>
          <div className="player-demo"><div className="wave">{Array.from({ length: 46 }, (_, i) => <i key={i} style={{ height: `${18 + ((i * 17) % 42)}px` }} />)}</div><div className="playline"><button>▶</button><span>01:09.66</span><div><i /></div><b>01:13.31</b></div><div className="karaoke-lines"><p>一直下决心 ima ni mi te ro yo</p><p className="playing"><span>cho he n shi n</span> ko no o ka shi</p><p>se i sa i ka shi ta i de o...</p></div></div>
          <div className="step-list"><article><span>1</span><div><b>上传歌曲音频</b><p>选择 MP3、WAV 或浏览器能播放的音频格式。</p></div></article><article><span>2</span><div><b>导入 LRC／SRT</b><p>字幕提供每句的时间；LRC 滚动时会有缩放、淡入与焦点过渡。</p></div></article><article><span>3</span><div><b>设置句首与句尾</b><p>需要反复磨一句时，用 A/B 标记锁定范围并循环播放。</p></div></article></div>
          <div className="callout"><span>为什么只导入音频不会滚动？</span><p>音频本身不知道哪一秒对应哪句歌词。需要 LRC、SRT，或从带时间的歌声工程中读取句段。</p></div>
        </section>

        <section className="doc-section" id="blind">
          <div className="section-number">06</div><SectionHeading item={sections[5]}>不先相信自动分词，直接用耳朵记录每个落点。这个模式必须同时有歌曲音频和真正的 .lrc 文件。</SectionHeading>
          <div className="blind-stage"><div className="blind-top"><span>BLIND TAP SESSION</span><b>按下空格，记录一个 la</b><em>REC 00:18.42</em></div><div className="tap-track"><i /><span>la</span><span>la</span><span>la</span><span>la</span><span className="now">la</span><b /></div><div className="blind-actions"><div><kbd>Space</kbd><span>记录 la</span></div><div><kbd>Backspace</kbd><span>删除最后一个</span></div><div><kbd>Esc</kbd><span>退出打点</span></div></div></div>
          <ol className="numbered-guide"><li><span>01</span><div><h3>准备素材</h3><p>先上传歌曲音频，再导入带时间的 <code>.lrc</code>。SRT、SVP 或 MIDI 时间线不会被误当成 LRC。</p></div></li><li><span>02</span><div><h3>只听，不看答案</h3><p>开始播放后，每听见一个适合落中文字的位置就按一次空格。每次会在当下时间写入一个 <code>la</code>。</p></div></li><li><span>03</span><div><h3>完成后再对照</h3><p>结束打点，打开对比视图，把你的 <code>la</code> 落点与罗马音或英标排列对照。</p></div></li><li><span>04</span><div><h3>修改并应用</h3><p>把自动标签改成你真正听到的发音，再应用为这一句的实际唱法。</p></div></li></ol>
        </section>

        <section className="doc-section" id="import">
          <div className="section-number">07</div><SectionHeading item={sections[6]}>顶部只保留一个“导入”入口。打开后再选择来源，避免按钮越来越多。</SectionHeading>
          <div className="import-table"><div className="table-head"><span>来源</span><span>格式</span><span>词格会做什么</span></div>{imports.map((row) => <div className="table-row" key={row[0]}><b>{row[0]}</b><code>{row[1]}</code><p>{row[2]}</p></div>)}</div>
          <div className="two-callouts"><div className="callout safe"><span>原文件安全</span><p>导入只读取副本，不会回写或覆盖你的 SVP、MIDI、VSQX、VPR 原工程。</p></div><div className="callout warn"><span>分句不是一次定死</span><p>工程里连续音符可能跨过原歌词行。导入时先按停顿、休止与时间间隔分段，之后仍可手动合并或拆句。</p></div></div>
        </section>

        <section className="doc-section" id="lab">
          <div className="section-number">08</div><SectionHeading item={sections[7]}>实验室容纳仍在验证中的辅助工具。能稳定帮助填词的先开放，其余工具保持锁定。</SectionHeading>
          <div className="lab-grid"><article className="lab-live"><span>LIVE</span><b>盲听打点</b><p>用空格键记录你实际听到的落字位置。</p><em>立即使用 →</em></article><article className="lab-live"><span>LIVE</span><b>音韵匹配</b><p>查看中文拼音与目标发音的接近程度。</p><em>立即使用 →</em></article><article className="lab-live"><span>LIVE</span><b>韵脚地图</b><p>把全曲句尾按韵母分组，快速找出跑韵。</p><em>立即使用 →</em></article><article className="lab-live"><span>LIVE</span><b>导出自检</b><p>导出前检查空格、超格与未确认的连接。</p><em>立即使用 →</em></article></div>
          <div className="coming-shop"><div className="shop-sign"><span>COMING SOON</span><b>敬请期待</b><p>这里正在装修下一批真正有用的工具。</p></div><div className="shutter">{Array.from({ length: 24 }, (_, i) => <i key={i} />)}<span>词格实验商店</span><b>LOCKED</b></div></div>
        </section>

        <section className="doc-section" id="ai">
          <div className="section-number">09</div><SectionHeading item={sections[8]}>AI 是查资料和打开思路的参谋，不是替你写中文填词的人。模型由用户自行配置，当前按 GLM 4.7 兼容方式连接。</SectionHeading>
          <div className="ai-policy"><div className="ai-warning"><span>创作红线</span><h3>禁止直接使用 AI 生成歌词</h3><p>首次进入 AI 参谋，必须输入“我不会使用AI生成歌词”才能解锁。这个确认只提醒创作边界，不会把密钥或歌词上传给词格服务器。</p><div className="warning-tape"><span>AI 只是工具 · 不是偷懒的捷径 · 保留人的判断 · AI 只是工具 ·</span></div></div><div className="policy-cols"><article><span>可以问</span><ul><li>逐句翻译与语法解释</li><li>音乐背景、意象和隐喻资料</li><li>某个韵母可用的中文词</li><li>发音、连读和语气建议</li></ul></article><article className="no"><span>不可以</span><ul><li>生成整句中文填词</li><li>代写副歌或整首歌词</li><li>绕过字数限制自动灌词</li><li>把模型输出冒充原创</li></ul></article></div></div>
          <div className="setup-strip"><span>01</span><div><b>选择 GLM 兼容接口</b><p>使用你自己的服务地址与模型名。</p></div><span>02</span><div><b>填写自己的 API Key</b><p>密钥仅保存在当前设备的浏览器中。</p></div><span>03</span><div><b>通过创作承诺</b><p>解锁后仍只开放辅助型提问。</p></div></div>
        </section>

        <section className="doc-section" id="appearance">
          <div className="section-number">10</div><SectionHeading item={sections[9]}>让工具适应你的眼睛，而不是让背景图压过正在编辑的歌词。</SectionHeading>
          <div className="appearance-showcase"><div className="theme-preview"><div className="preview-window"><i /><i /><i /><span>液态玻璃</span></div><div className="preview-card"><span>cho</span><span>he</span><span className="ghost">n</span><span>shi</span></div><div className="preview-cell"><b>心</b><small>xīn · in 韵</small></div></div><div className="appearance-copy"><article><b>自定义主色</b><p>强调色会同步用于选中格、播放器和提示，不改变信息层级。</p></article><article><b>背景与遮罩</b><p>上传图片后可调暗度、模糊和饱和度，保证文字始终清晰。</p></article><article><b>液态玻璃</b><p>提高面板透明感与背景折射；看不清时降低透明度即可。</p></article></div></div>
          <div className="privacy-grid"><article><span>只在本机</span><b>工程自动保存到浏览器</b><p>换设备或清理浏览器数据前，请先导出 JSON 备份。</p></article><article><span>不会上传</span><b>音频不进入工程文件</b><p>重新打开工程后，需要重新选择本地歌曲音频。</p></article><article><span>你来决定</span><b>AI 密钥由用户配置</b><p>词格不提供公共密钥，也不会代你购买模型服务。</p></article></div>
        </section>

        <section className="doc-section" id="shortcuts">
          <div className="section-number">11</div><SectionHeading item={sections[10]}>高频动作尽量不离开键盘。盲听打点中的空格只在该模式播放时生效。</SectionHeading>
          <div className="shortcut-table"><div><span>撤销上一步</span><p>恢复最近一次填字、吸收、连接或拆分</p><kbd>Ctrl</kbd><i>+</i><kbd>Z</kbd></div><div><span>移动到相邻格</span><p>在中文逐格编辑时切换焦点</p><kbd>←</kbd><i>/</i><kbd>→</kbd></div><div><span>盲听记录一个音</span><p>在当前播放时间写入一个 la</p><kbd>Space</kbd></div><div><span>删除最后一个打点</span><p>只在盲听打点会话中生效</p><kbd>Backspace</kbd></div><div><span>搜索本文档</span><p>从任何位置快速跳到对应章节</p><kbd>Ctrl</kbd><i>+</i><kbd>K</kbd></div><div><span>关闭弹窗</span><p>退出搜索或当前临时面板</p><kbd>Esc</kbd></div></div>
        </section>

        <section className="doc-section faq-section" id="faq">
          <div className="section-number">12</div><SectionHeading item={sections[11]}>先看最常碰到的情况。仍然解决不了时，导出工程备份再反馈，最容易复现。</SectionHeading>
          <div className="faq-list"><details open><summary>为什么自动建议的格数和我听到的不一样？<span>＋</span></summary><p>自动建议依据文字读音与常见规则，不知道歌手在这一处怎样吞音、滑音或故意拆字。选中对应发音格，用吸收、连接或拆分把它改成你的听感。</p></details><details><summary>为什么 SVP 导入后几句连在一起？<span>＋</span></summary><p>有些工程只有连续音符，没有明确歌词行边界。词格会参考休止、音符间隔和歌词符号分句；导入界面可调整分句灵敏度，进工程后也能继续拆句或合句。</p></details><details><summary>MIDI 导入后为什么没有歌词？<span>＋</span></summary><p>MIDI 可能只有音高和时值。先选择真正的人声旋律轨；如果文件本身没有 lyric 事件，词格会保留节奏格，歌词需要另行导入或填写。</p></details><details><summary>LRC 为什么不跟随滚动？<span>＋</span></summary><p>确认导入的是带时间标签的 .lrc，并且音频从同一版本歌曲开始。若整体固定偏移，可调整字幕偏移量；若每句越走越偏，通常是音频版本或速度不同。</p></details><details><summary>延音“—”为什么不增加字数？<span>＋</span></summary><p>延音表示继续唱前一个中文字，它占用旋律时间，但不是新的汉字或发音，所以当前设计字数不会增加。</p></details><details><summary>换电脑后工程去哪了？<span>＋</span></summary><p>自动保存默认只在当前浏览器。换电脑、换浏览器或清理站点数据之前，请从“导出”保存 JSON 工程，再在新设备导入。</p></details></div>
          <div className="closing-card"><span>READY WHEN YOU ARE</span><h2>现在，去把那一句唱顺。</h2><p>先听，再数，最后落字。任何自动建议都可以改，最终答案在你的耳朵里。</p><a href="https://lyric-grid-cn.beiai.chatgpt.site/" target="_blank" rel="noreferrer">打开词格编辑器 ↗</a></div>
        </section>

        <footer><div><span className="brand-mark"><i /><i /><i /></span><b>词格使用手册</b></div><p>策划与制作：北艾sama</p><span>最后更新 · 2026.08.27</span></footer>
      </article>

      <aside className="page-rail"><span>本页目录</span>{sections.map((item) => <a className={active === item.id ? 'active' : ''} href={`#${item.id}`} key={item.id}>{item.title}</a>)}<div className="rail-rule" /><p><b>预计阅读</b><span>15 分钟</span></p><p><b>文档版本</b><span>Guide 1.0</span></p></aside>

      {searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="搜索使用文档" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><div className="search-modal"><div className="search-box"><span>⌕</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索：吸收、LRC、MIDI、韵脚……" /><kbd>ESC</kbd></div><div className="search-results"><div className="result-label">{query ? `找到 ${results.length} 个章节` : '快速前往'}</div>{results.map((item) => <button key={item.id} onClick={() => goTo(item.id)}><span>{item.n}</span><div><b>{item.title}</b><p>{item.summary}</p></div><em>↗</em></button>)}{results.length === 0 && <div className="no-result"><b>没有找到这一项</b><p>试试搜索“吸收”“LRC”“MIDI”或“韵脚”。</p></div>}</div><div className="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 浏览</span><span><kbd>Enter</kbd> 打开</span><span>词格文档搜索</span></div></div></div>}
    </main>
  );
}
