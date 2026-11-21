(function () {
  'use strict';

  const CH = (window.IMAT && window.IMAT.chapters ? window.IMAT.chapters : []).slice().sort((a, b) => a.number - b.number);
  const FIGS = window.IMATFigures || {};
  const app = document.getElementById('app');
  const SCORE = { right: 1.5, wrong: -0.4, blank: 0 };
  const SECS_PER_Q = 100; // IMAT pace: 60 questions in 100 minutes
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const INTERVALS = [1, 3, 7, 16, 35]; // days between recall sessions, stage 1 → 5
  const RECALL_MAX = 15;               // questions per recall session
  const DAY = 86400000;

  /* ------------------------------------------------------------ storage */
  const KEY = 'chemspark.imat.v1';
  const blank = () => ({ v: 1, attempts: [], mistakes: {}, fixed: {}, reviewed: {}, flash: {}, days: [], srs: {}, ui: { prefs: { mode: 'practice', count: 20, topic: 'all' }, sub: {} } });
  let S = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = Object.assign(blank(), JSON.parse(raw));
    S.ui = Object.assign(blank().ui, S.ui || {});
    S.srs = S.srs || {};
  } catch (e) { /* storage unavailable: run in memory */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function touchDay() { const t = today(); if (!S.days.includes(t)) { S.days.push(t); if (S.days.length > 400) S.days.shift(); } }
  function streak() {
    const set = new Set(S.days); let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (set.has(k)) { n++; d.setDate(d.getDate() - 1); } else break;
    }
    return n;
  }

  /* ------------------------------------------------------------ helpers */
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function fmt(s) {
    // text may contain <br> deliberately; escape everything else
    return esc(s)
      .replace(/&lt;br&gt;/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/==(.+?)==/g, '<mark class="term">$1</mark>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_\{(.+?)\}/g, '<sub>$1</sub>')
      .replace(/\^\{(.+?)\}/g, '<sup>$1</sup>')
      .replace(/M_r\b/g, 'M<sub>r</sub>');
  }
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const byId = (cid) => CH.find((c) => c.id === cid);
  const qById = (cid, qid) => byId(cid).questions.find((q) => q.id === qid);
  const pct = (x) => Math.round(x * 100);
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ------------------------------------------------------------ spaced recall */
  const dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const addDays = (ts, n) => { const d = new Date(dayStart(ts)); d.setDate(d.getDate() + n); return d.getTime(); };
  const daysUntil = (ts) => Math.round((dayStart(ts) - dayStart(Date.now())) / DAY);
  const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const relDay = (n) => n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 1 ? `in ${n} days` : `${-n} day${n === -1 ? '' : 's'} overdue`;
  const srsKey = (cid, sid) => cid + ':' + sid;
  function recallPool(ch, sid) { return ch.questions.filter((q) => (ch.topicSection || {})[q.topic] === sid); }
  function recallCount(ch, sid) { return Math.min(RECALL_MAX, recallPool(ch, sid).length); }
  function srsStatus(ch, sid) {
    const r = S.srs[srsKey(ch.id, sid)];
    if (!r) return { state: 'new', level: 0, r: null };
    const d = daysUntil(r.next);
    if (d <= 0) return { state: d < 0 ? 'overdue' : 'due', level: r.level, days: d, r };
    return { state: r.level >= INTERVALS.length ? 'locked' : 'scheduled', level: r.level, days: d, r };
  }
  function dueList() {
    const out = [];
    CH.forEach((ch) => ch.sections.forEach((s) => {
      const st = srsStatus(ch, s.id);
      if ((st.state === 'due' || st.state === 'overdue') && recallCount(ch, s.id)) out.push({ ch, s, st });
    }));
    return out;
  }
  // Update the schedule after a recall session and say what happened.
  function srsApply(cid, sid, acc) {
    const k = srsKey(cid, sid);
    const cur = S.srs[k] || { level: 0, next: 0, sessions: [] };
    const now = Date.now();
    const wasDue = !cur.next || daysUntil(cur.next) <= 0;
    let level = cur.level, next, outcome;
    if (acc >= 0.8 && !wasDue) { outcome = 'early'; next = cur.next; }
    else if (acc >= 0.8) { level = Math.min(level + 1, INTERVALS.length); outcome = level >= INTERVALS.length ? 'locked' : 'up'; next = addDays(now, INTERVALS[level - 1]); }
    else if (acc >= 0.6) { outcome = 'hold'; next = addDays(now, level > 0 ? INTERVALS[level - 1] : 1); }
    else { outcome = 'reset'; level = 0; next = addDays(now, 1); }
    const sessions = (cur.sessions || []).concat([{ date: now, acc: +acc.toFixed(3) }]).slice(-30);
    S.srs[k] = { level, next, last: now, sessions };
    return { sid, outcome, level, prevLevel: cur.level, next, acc };
  }
  function stageTrack(level) {
    return `<div class="stages" aria-label="Stage ${level} of ${INTERVALS.length}">${INTERVALS.map((d, i) => `<span class="stage ${i < level ? 'on' : ''}"><i></i><small>${d}d</small></span>`).join('')}</div>`;
  }

  function ring(value, size, label) {
    const r = (size - 10) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, value)));
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <defs><linearGradient id="rg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--cyan)"/><stop offset="1" stop-color="var(--pink)"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke="url(#rg${size})" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-txt">${label}</text>
    </svg>`;
  }

  /* ------------------------------------------------------------ stats */
  function chStats(ch) {
    const at = S.attempts.filter((a) => a.cid === ch.id && a.source !== 'mistakes');
    const all = S.attempts.filter((a) => a.cid === ch.id);
    const best = at.length ? Math.max(...at.map((a) => a.correct / a.total)) : 0;
    const avg = at.length ? at.reduce((s, a) => s + a.correct / a.total, 0) / at.length : 0;
    const reviewed = ch.sections.filter((s) => S.reviewed[ch.id + ':' + s.id]).length;
    const reviewPct = reviewed / ch.sections.length;
    const mistakes = Object.entries(S.mistakes).filter(([, m]) => m.cid === ch.id).length;
    const topics = {};
    for (const a of all) for (const [t, v] of Object.entries(a.topics || {})) { topics[t] = topics[t] || [0, 0]; topics[t][0] += v[0]; topics[t][1] += v[1]; }
    const known = Object.keys(S.flash[ch.id] || {}).length;
    const answered = all.reduce((s, a) => s + a.correct + a.wrong, 0);
    const mastery = 0.35 * reviewPct + 0.65 * best;
    return { at, all, best, avg, reviewed, reviewPct, mistakes, topics, known, answered, mastery };
  }

  /* ------------------------------------------------------------ routing */
  let cleanup = [];
  let run = null;       // active test
  let timerId = null;
  let pendingScroll = null;
  let ui = { confirmFinish: false, confirmReset: false, resFilter: 'all', flashIdx: 0, flashFlip: false, flashDeck: null, revealed: {} };

  function parse() {
    const h = location.hash.replace('#', '');
    const m = h.match(/^(c\d+)-(review|test|recall|figures|mistakes|progress)$/);
    if (m && byId(m[1])) return { view: 'chapter', cid: m[1], tab: m[2] };
    return { view: 'home' };
  }
  function go(hash) { if (location.hash === '#' + hash) render(); else location.hash = hash; }
  window.addEventListener('hashchange', () => { ui.confirmFinish = false; ui.confirmReset = false; render(true); });

  function render(scrollTop) {
    cleanup.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
    cleanup = [];
    const r = parse();
    let html = '';
    if (r.view === 'home') html = viewHome();
    else html = viewChapter(byId(r.cid), r.tab);
    app.innerHTML = html;
    document.title = r.view === 'home' ? 'ChemSpark IMAT' : `Ch ${byId(r.cid).number} · ${byId(r.cid).title} · ChemSpark`;
    if (r.view === 'chapter' && r.tab === 'figures') mountFigures(byId(r.cid));
    if (pendingScroll) {
      const el = document.getElementById(pendingScroll); pendingScroll = null;
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } else if (scrollTop) window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ home */
  function viewHome() {
    const totalTests = S.attempts.length;
    const avg = totalTests ? S.attempts.reduce((s, a) => s + a.correct / a.total, 0) / totalTests : 0;
    const mist = Object.keys(S.mistakes).length;
    return `
    <section class="hero">
      <p class="eyebrow">IMAT preparation · Chemistry</p>
      <h1 class="hero-title"><span class="shine">ChemSpark</span></h1>
      <p class="hero-sub">Review each chapter, test yourself with IMAT-style questions scored +1.5 / −0.4 / 0, and turn every mistake into a note.</p>
      <div class="statstrip">
        <div><b>${totalTests}</b><span>tests taken</span></div>
        <div><b>${totalTests ? pct(avg) + '%' : '–'}</b><span>average accuracy</span></div>
        <div><b>${mist}</b><span>mistakes to fix</span></div>
        <div><b>${streak()}</b><span>day streak</span></div>
      </div>
    </section>
    ${(() => { const due = dueList(); return due.length ? `<section class="block"><div class="panel duebox">
      <div><span class="eyebrow">Spaced recall</span><h2>${due.length} recall session${due.length === 1 ? '' : 's'} due</h2><p class="muted">Do them today to keep the schedule on track.</p></div>
      <div class="due-links">${due.map(({ ch, s, st }) => `<a class="btn ${st.state === 'overdue' ? 'warn' : 'primary'} small" href="#${ch.id}-recall">Ch ${ch.number} · ${esc(s.id)} ${esc(s.title)}${st.state === 'overdue' ? ' · ' + relDay(st.days) : ''}</a>`).join('')}</div>
    </div></section>` : ''; })()}
    <section class="block">
      <div class="block-head"><h2>Choose a chapter</h2><span class="muted small">${CH.length} chapter${CH.length === 1 ? '' : 's'} loaded</span></div>
      <div class="chapters">
        ${CH.map((ch) => {
          const st = chStats(ch);
          return `<article class="chapter-card">
            <a class="chapter-main" href="#${ch.id}-review">
              <div class="chapter-num"><span>CH</span>${ch.number}</div>
              <div class="chapter-info">
                <h3>${fmt(ch.title)}</h3>
                <p>${fmt(ch.blurb)}</p>
                <div class="chips"><span class="chip">${ch.sections.length} sections</span><span class="chip">${ch.questions.length} questions</span><span class="chip">${ch.figures.length} figures</span><span class="chip ghost">${ch.pages}</span></div>
              </div>
              <div class="chapter-ring">${ring(st.mastery, 76, pct(st.mastery) + '%')}<small>mastery</small></div>
            </a>
            <div class="chapter-actions">
              <a class="btn ghost small" href="#${ch.id}-review">Review</a>
              <a class="btn primary small" href="#${ch.id}-test">Start a test</a>
              <a class="btn ghost small" href="#${ch.id}-recall">Recall</a>
              <a class="btn ghost small" href="#${ch.id}-figures">Figures</a>
              ${st.mistakes ? `<a class="btn ghost small warn" href="#${ch.id}-mistakes">${st.mistakes} mistakes</a>` : ''}
            </div>
          </article>`;
        }).join('')}
        <article class="chapter-card coming">
          <div class="chapter-num dim"><span>CH</span>+</div>
          <div class="chapter-info"><h3>Next chapter</h3><p>Send the pages of the next chapter and it appears here with its own review, tests and figures.</p></div>
        </article>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ chapter shell */
  function viewChapter(ch, tab) {
    const st = chStats(ch);
    const tabs = [['review', 'Review'], ['test', 'Test'], ['recall', 'Recall'], ['figures', 'Figures'], ['mistakes', 'Mistakes'], ['progress', 'Progress']];
    const dueN = ch.sections.filter((s) => { const x = srsStatus(ch, s.id).state; return x === 'due' || x === 'overdue'; }).length;
    const liveTab = run && run.cid === ch.id && !run.finished ? (run.source === 'recall' ? 'recall' : 'test') : '';
    let body = '';
    if (tab === 'review') body = viewReview(ch);
    if (tab === 'test') body = viewTest(ch);
    if (tab === 'recall') body = viewRecall(ch);
    if (tab === 'figures') body = viewFigures(ch);
    if (tab === 'mistakes') body = viewMistakes(ch);
    if (tab === 'progress') body = viewProgress(ch, st);
    return `
    <section class="ch-head">
      <a class="back" href="#home">← All chapters</a>
      <div class="ch-title">
        <div class="chapter-num sm"><span>CH</span>${ch.number}</div>
        <div><h1>${fmt(ch.title)}</h1><p class="muted">${fmt(ch.blurb)}</p></div>
      </div>
    </section>
    <nav class="tabs" aria-label="Chapter sections">
      ${tabs.map(([k, l]) => `<a href="#${ch.id}-${k}" class="tab ${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}>${l}${k === 'mistakes' && st.mistakes ? `<i class="badge">${st.mistakes}</i>` : ''}${k === 'recall' && dueN ? `<i class="badge due">${dueN} due</i>` : ''}${k === liveTab ? '<i class="badge live">live</i>' : ''}</a>`).join('')}
    </nav>
    <div class="tabbody">${body}</div>`;
  }

  /* ------------------------------------------------------------ review */
  function viewReview(ch) {
    const sub = S.ui.sub[ch.id] || ch.sections[0].id;
    const items = ch.sections.map((s) => [s.id, s.id + ' ' + s.title, S.reviewed[ch.id + ':' + s.id]])
      .concat([['book', 'Book questions'], ['flash', 'Flashcards'], ['cheat', 'Cheat sheet']]);
    let content = '';
    const sec = ch.sections.find((s) => s.id === sub);
    if (sec) {
      const idx = ch.sections.indexOf(sec), next = ch.sections[idx + 1];
      const done = S.reviewed[ch.id + ':' + sec.id];
      content = `<article class="notes">
        <header class="notes-head"><span class="eyebrow">Section ${sec.id}</span><h2>${fmt(sec.title)}</h2></header>
        ${sec.blocks.map((b) => block(b, ch)).join('')}
        <footer class="notes-foot">
          <button class="btn ${done ? 'done' : 'primary'}" data-act="toggle-reviewed" data-id="${sec.id}" type="button">${done ? '✓ Reviewed' : 'Mark as reviewed'}</button>
          ${next ? `<button class="btn ghost" data-act="sub" data-id="${next.id}" type="button">Next: ${next.id} ${esc(next.title)} →</button>` : `<button class="btn ghost" data-act="sub" data-id="book" type="button">Try the book questions →</button>`}
        </footer>
      </article>`;
    } else if (sub === 'book') content = viewBook(ch);
    else if (sub === 'flash') content = viewFlash(ch);
    else if (sub === 'cheat') content = viewCheat(ch);
    return `<div class="review">
      <aside class="subnav" aria-label="Review sections">
        ${items.map(([id, label, done]) => `<button class="subnav-item ${id === sub ? 'on' : ''}" data-act="sub" data-id="${id}" type="button">${done ? '<i class="tick">✓</i>' : '<i class="dotm"></i>'}<span>${fmt(label)}</span></button>`).join('')}
      </aside>
      <div class="review-main">${content}</div>
    </div>`;
  }

  function block(b, ch) {
    switch (b.t) {
      case 'h': return `<h3 class="nh">${fmt(b.x)}</h3>`;
      case 'p': return `<p>${fmt(b.x)}</p>`;
      case 'list': return `<ul class="nl">${b.items.map((i) => `<li>${fmt(i)}</li>`).join('')}</ul>`;
      case 'imp': return `<div class="callout imp"><span class="callout-tag">Important</span><p>${fmt(b.x)}</p></div>`;
      case 'tip': return `<div class="callout tip"><span class="callout-tag">IMAT tip</span><p>${fmt(b.x)}</p></div>`;
      case 'formula': return `<div class="formula"><div class="formula-x">${fmt(b.x)}</div>${b.note ? `<div class="formula-n">${fmt(b.note)}</div>` : ''}</div>`;
      case 'table': return `<div class="tablewrap"><table class="nt"><thead><tr>${b.head.map((h) => `<th>${fmt(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${fmt(c)}</th>` : `<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>${b.caption ? `<p class="tcap">${fmt(b.caption)}</p>` : ''}</div>`;
      case 'fig': { const f = FIGS[b.id]; return f ? `<a class="figlink" href="#${ch.id}-figures" data-scroll="fig-${b.id}"><span class="figlink-ico" aria-hidden="true">◈</span><span><small>${esc(f.tag)}</small>${esc(f.title)}</span><b>${esc(b.x)} →</b></a>` : ''; }
      case 'worked': return `<details class="worked"><summary><span class="callout-tag">Worked example</span>${fmt(b.title)}</summary><ol>${b.steps.map((s) => `<li>${fmt(s)}</li>`).join('')}</ol></details>`;
      default: return '';
    }
  }

  function viewBook(ch) {
    return `<article class="notes">
      <header class="notes-head"><span class="eyebrow">From the coursebook</span><h2>Book questions</h2><p class="muted">Answer in your head or on paper first, then reveal the model answer.</p></header>
      <div class="bookqs">
      ${ch.bookQuestions.map((b) => {
        const open = ui.revealed[ch.id + b.n];
        return `<div class="bookq ${open ? 'open' : ''}">
          <div class="bookq-q"><span class="qnum">Q${esc(b.n)}</span><p>${fmt(b.q)}</p></div>
          ${open ? `<div class="bookq-a">${fmt(b.a)}</div>` : ''}
          <button class="btn ghost small" data-act="reveal" data-id="${esc(b.n)}" type="button">${open ? 'Hide answer' : 'Show answer'}</button>
        </div>`;
      }).join('')}
      </div>
    </article>`;
  }

  function flashDeck(ch) {
    if (!ui.flashDeck || ui.flashDeck.cid !== ch.id) {
      const known = S.flash[ch.id] || {};
      const idx = ch.flashcards.map((_, i) => i);
      const order = shuffle(idx.filter((i) => !known[i])).concat(shuffle(idx.filter((i) => known[i])));
      ui.flashDeck = { cid: ch.id, order }; ui.flashIdx = 0; ui.flashFlip = false;
    }
    return ui.flashDeck.order;
  }
  function viewFlash(ch) {
    const order = flashDeck(ch);
    const known = S.flash[ch.id] || {};
    const k = Object.keys(known).length;
    const i = order[ui.flashIdx % order.length];
    const card = ch.flashcards[i];
    return `<article class="notes">
      <header class="notes-head"><span class="eyebrow">Flashcards</span><h2>Quick recall</h2>
        <p class="muted">${k} of ${ch.flashcards.length} marked as known. Tap the card to flip it.</p>
        <div class="bar"><i style="width:${(k / ch.flashcards.length) * 100}%"></i></div></header>
      <button class="flash ${ui.flashFlip ? 'flipped' : ''}" data-act="flip" type="button" aria-label="Flip card">
        <span class="flash-inner">
          <span class="flash-face front"><small>Card ${(ui.flashIdx % order.length) + 1} / ${order.length}${known[i] ? ' · known' : ''}</small><b>${fmt(card.f)}</b><em>tap to reveal</em></span>
          <span class="flash-face back"><small>Answer</small><b>${fmt(card.b)}</b></span>
        </span>
      </button>
      <div class="flash-actions">
        <button class="btn ghost" data-act="flash-again" type="button">Show again later</button>
        <button class="btn primary" data-act="flash-know" type="button">I know this ✓</button>
      </div>
    </article>`;
  }

  function viewCheat(ch) {
    return `<article class="notes">
      <header class="notes-head"><span class="eyebrow">One page</span><h2>Cheat sheet</h2><p class="muted">Every equation and conversion from this chapter.</p></header>
      <dl class="cheat">${ch.cheatsheet.map((c) => `<div><dt>${fmt(c.k)}</dt><dd>${fmt(c.v)}</dd></div>`).join('')}</dl>
      <h3 class="nh">Key terms</h3>
      <div class="terms">${ch.flashcards.slice(0, 18).map((c) => `<div class="term-card"><b>${fmt(c.f)}</b><span>${fmt(c.b)}</span></div>`).join('')}</div>
    </article>`;
  }

  /* ------------------------------------------------------------ test */
  function startRun(ch, opts) {
    let pool = ch.questions;
    if (opts.qids) pool = opts.qids.map((id) => qById(ch.id, id)).filter(Boolean);
    else if (opts.topic && opts.topic !== 'all') pool = pool.filter((q) => q.topic === opts.topic);
    let picked = shuffle(pool);
    if (!opts.qids) picked = picked.slice(0, Math.min(opts.count, picked.length));
    run = {
      cid: ch.id, mode: opts.mode, source: opts.source || 'test', unit: opts.unit || null,
      items: picked.map((q) => ({ qid: q.id, order: shuffle([0, 1, 2, 3, 4]), pick: null, locked: false })),
      i: 0, start: Date.now(), limit: opts.mode === 'exam' ? picked.length * SECS_PER_Q : 0, finished: false, result: null
    };
    ui.confirmFinish = false; ui.resFilter = 'all';
    startTimer();
  }
  function startTimer() {
    clearInterval(timerId);
    if (!run || run.mode !== 'exam' || run.finished) return;
    timerId = setInterval(() => {
      if (!run || run.finished) { clearInterval(timerId); return; }
      const left = run.limit - (Date.now() - run.start) / 1000;
      const el = document.getElementById('timer');
      if (el) { el.textContent = mmss(left); el.classList.toggle('low', left < 60); }
      if (left <= 0) { finishRun(); render(); }
    }, 500);
  }
  function finishRun() {
    if (!run || run.finished) return;
    clearInterval(timerId);
    const ch = byId(run.cid);
    let correct = 0, wrong = 0, blankN = 0; const topics = {};
    for (const it of run.items) {
      const q = qById(run.cid, it.qid);
      topics[q.topic] = topics[q.topic] || [0, 0];
      topics[q.topic][1]++;
      if (it.pick === null) { blankN++; S.mistakes[q.id] = { cid: ch.id, times: ((S.mistakes[q.id] || {}).times || 0) + 1, last: Date.now(), picked: null, reason: 'skipped' }; }
      else if (it.pick === q.a) {
        correct++; topics[q.topic][0]++;
        if (S.mistakes[q.id]) { delete S.mistakes[q.id]; S.fixed[q.id] = Date.now(); }
      } else { wrong++; S.mistakes[q.id] = { cid: ch.id, times: ((S.mistakes[q.id] || {}).times || 0) + 1, last: Date.now(), picked: it.pick, reason: 'wrong' }; }
    }
    const total = run.items.length;
    const score = correct * SCORE.right + wrong * SCORE.wrong;
    const res = { cid: ch.id, date: Date.now(), mode: run.mode, source: run.source, unit: run.unit, total, correct, wrong, blank: blankN, score: +score.toFixed(2), max: total * SCORE.right, secs: Math.round((Date.now() - run.start) / 1000), limit: run.limit, topics };
    if (run.source === 'recall' && run.unit) res.srs = srsApply(ch.id, run.unit, correct / total);
    S.attempts.push(res);
    if (S.attempts.length > 300) S.attempts.shift();
    touchDay(); save();
    run.finished = true; run.result = res;
  }

  function viewTest(ch) {
    if (run && run.cid === ch.id && run.source !== 'recall') return run.finished ? viewResults(ch) : viewQuestion(ch);
    const recallLive = run && run.cid === ch.id && run.source === 'recall' && !run.finished;
    const P = S.ui.prefs;
    const topicCounts = {};
    ch.questions.forEach((q) => { topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1; });
    const st = chStats(ch);
    const last = st.all.slice(-4).reverse();
    return `${recallLive ? `<a class="livebar" href="#${ch.id}-recall">A timed recall session is running. Tap to go back to it →</a>` : ''}<div class="setup">
      <section class="panel setup-main">
        <span class="eyebrow">New test</span>
        <h2>IMAT-style test</h2>
        <p class="muted">Questions are drawn at random from a bank of ${ch.questions.length}, with options shuffled every time.</p>
        <div class="opt-group"><span class="opt-label">Mode</span>
          <div class="seg">
            <button class="${P.mode === 'practice' ? 'on' : ''}" data-act="pref" data-k="mode" data-v="practice" type="button">Practice<small>see the answer after each question</small></button>
            <button class="${P.mode === 'exam' ? 'on' : ''}" data-act="pref" data-k="mode" data-v="exam" type="button">Exam<small>timed, answers at the end</small></button>
          </div></div>
        <div class="opt-group"><span class="opt-label">Questions</span>
          <div class="seg">${[10, 15, 20].map((n) => `<button class="${+P.count === n ? 'on' : ''}" data-act="pref" data-k="count" data-v="${n}" type="button">${n}</button>`).join('')}</div></div>
        <div class="opt-group"><span class="opt-label">Topic</span>
          <div class="chips pick">
            <button class="chip ${P.topic === 'all' ? 'on' : ''}" data-act="pref" data-k="topic" data-v="all" type="button">Whole chapter</button>
            ${Object.entries(ch.topics).map(([k, l]) => `<button class="chip ${P.topic === k ? 'on' : ''}" data-act="pref" data-k="topic" data-v="${k}" type="button">${fmt(l)} <i>${topicCounts[k] || 0}</i></button>`).join('')}
          </div></div>
        <div class="setup-go">
          <button class="btn primary big" data-act="start" type="button">Start test</button>
          <span class="muted small">${P.mode === 'exam' ? `Time limit: ${mmss(Math.min(+P.count, P.topic === 'all' ? 999 : topicCounts[P.topic] || 0) * SECS_PER_Q)} (IMAT pace)` : 'No time limit'}</span>
        </div>
      </section>
      <aside class="panel setup-side">
        <h3>Scoring</h3>
        <ul class="scoring"><li><b class="good">+1.5</b> correct</li><li><b class="bad">−0.4</b> wrong</li><li><b>0</b> left blank</li></ul>
        <p class="muted small">A wrong answer costs marks, so skip a question when you can't narrow it down to two options.</p>
        ${last.length ? `<h3>Recent</h3><ul class="recent">${last.map((a) => `<li><span>${fmtDate(a.date)} · ${a.source === 'mistakes' ? 'mistakes' : a.mode}</span><b>${a.score} / ${a.max}</b></li>`).join('')}</ul>` : ''}
      </aside>
    </div>`;
  }

  function viewQuestion(ch) {
    const it = run.items[run.i];
    const q = qById(ch.id, it.qid);
    const n = run.items.length;
    const answered = run.items.filter((x) => x.pick !== null).length;
    const practice = run.mode === 'practice';
    const reveal = practice && it.locked;
    const left = run.limit ? run.limit - (Date.now() - run.start) / 1000 : 0;
    return `<div class="quiz">
      <div class="quiz-top">
        <div class="quiz-meta"><b>Question ${run.i + 1}</b><span class="muted"> / ${n}</span><span class="chip">${fmt(ch.topics[q.topic])}</span>${run.source === 'recall' ? `<span class="chip recall">Recall ${esc(run.unit)}</span>` : ''}<span class="diff d${q.d}" title="Difficulty">${'●'.repeat(q.d)}${'○'.repeat(3 - q.d)}</span></div>
        <div class="quiz-right">${run.mode === 'exam' ? `<span class="timer ${left < 60 ? 'low' : ''}" id="timer" aria-label="Time left">${mmss(left)}</span>` : `<span class="chip ghost">${run.source === 'mistakes' ? 'Mistake practice' : 'Practice'}</span>`}
          <button class="btn ghost small" data-act="quit" type="button">Quit</button></div>
      </div>
      <div class="bar"><i style="width:${((run.i + (reveal ? 1 : 0)) / n) * 100}%"></i></div>
      <section class="qcard">
        <p class="qtext">${fmt(q.q)}</p>
        <div class="options" role="list">
          ${it.order.map((oi, pos) => {
            let cls = '';
            if (reveal) { if (oi === q.a) cls = 'right'; else if (oi === it.pick) cls = 'wrong'; else cls = 'dim'; }
            else if (it.pick === oi) cls = 'picked';
            return `<button class="opt ${cls}" data-act="pick" data-v="${oi}" type="button" ${reveal ? 'disabled' : ''} role="listitem"><span class="letter">${LETTERS[pos]}</span><span class="otext">${fmt(q.o[oi])}</span></button>`;
          }).join('')}
        </div>
        ${reveal ? `<div class="explain ${it.pick === q.a ? 'ok' : 'no'}"><b>${it.pick === q.a ? 'Correct  +1.5' : it.pick === null ? 'Skipped  0' : 'Not quite  −0.4'}</b><p>${fmt(q.ex)}</p></div>` : ''}
      </section>
      <div class="quiz-nav">
        ${practice
          ? (reveal
              ? `<span></span><button class="btn primary" data-act="next" type="button">${run.i + 1 < n ? 'Next question →' : 'See results'}</button>`
              : `<button class="btn ghost" data-act="skip" type="button">Skip (0)</button><button class="btn primary" data-act="check" type="button" ${it.pick === null ? 'disabled' : ''}>Check answer</button>`)
          : `<button class="btn ghost" data-act="prev" type="button" ${run.i === 0 ? 'disabled' : ''}>← Previous</button>
             <div class="qdots">${run.items.map((x, k) => `<button class="qdot ${x.pick !== null ? 'done' : ''} ${k === run.i ? 'cur' : ''}" data-act="jump" data-v="${k}" type="button" aria-label="Question ${k + 1}">${k + 1}</button>`).join('')}</div>
             ${run.i + 1 < n ? `<button class="btn primary" data-act="next" type="button">Next →</button>` : `<button class="btn primary" data-act="finish" type="button">Finish</button>`}`}
      </div>
      ${!practice ? `<div class="quiz-foot"><span class="muted small">${answered} of ${n} answered. Tap a selected answer again to clear it.</span><button class="btn ghost small" data-act="finish" type="button">Finish test</button></div>` : ''}
      ${ui.confirmFinish ? `<div class="confirm panel"><p><b>${n - answered} question${n - answered === 1 ? ' is' : 's are'} unanswered.</b> They will score 0 and be added to your mistakes.</p><div><button class="btn ghost small" data-act="finish-cancel" type="button">Keep going</button><button class="btn primary small" data-act="finish-yes" type="button">Finish now</button></div></div>` : ''}
    </div>`;
  }

  function viewResults(ch) {
    const r = run.result;
    const ratio = r.correct / r.total;
    const verdict = ratio >= 0.85 ? 'Excellent: exam ready on this chapter.' : ratio >= 0.65 ? 'Good work. Clear your mistakes to lock it in.' : ratio >= 0.4 ? 'Getting there. Review the notes for your weak topics.' : 'Start with the review notes, then try again.';
    const rows = run.items.map((it, k) => ({ it, k, q: qById(ch.id, it.qid) }))
      .filter(({ it, q }) => ui.resFilter === 'all' || (ui.resFilter === 'wrong' && it.pick !== null && it.pick !== q.a) || (ui.resFilter === 'blank' && it.pick === null));
    const wrongIds = run.items.filter((it) => it.pick !== qById(ch.id, it.qid).a).map((it) => it.qid);
    return `<div class="results">
      <section class="panel res-hero">
        <div class="res-ring">${ring(ratio, 150, `${r.score}`)}<small>of ${r.max} points</small></div>
        <div class="res-info">
          <span class="eyebrow">${r.source === 'recall' ? `Recall · section ${esc(r.unit)}` : r.source === 'mistakes' ? 'Mistake practice' : r.mode === 'exam' ? 'Exam result' : 'Practice result'}</span>
          <h2>${verdict}</h2>
          <div class="res-stats">
            <div class="good"><b>${r.correct}</b><span>correct</span></div>
            <div class="bad"><b>${r.wrong}</b><span>wrong</span></div>
            <div><b>${r.blank}</b><span>blank</span></div>
            <div><b>${mmss(r.secs)}</b><span>${r.limit ? 'of ' + mmss(r.limit) : 'time'}</span></div>
          </div>
          <div class="res-actions">
            ${wrongIds.length ? `<button class="btn primary" data-act="retry-wrong" type="button">Retry the ${wrongIds.length} I missed</button>` : ''}
            <button class="btn ghost" data-act="new-test" type="button">${r.source === 'recall' ? 'Back to recall plan' : 'New test'}</button>
            <a class="btn ghost" href="#${ch.id}-mistakes">Open mistakes</a>
          </div>
        </div>
      </section>
      ${r.srs ? scheduleCard(r.srs) : ''}
      <section class="panel">
        <h3>By topic</h3>
        <div class="tbars">${Object.entries(r.topics).map(([t, v]) => `<div class="tbar"><span>${fmt(ch.topics[t])}</span><div class="bar"><i style="width:${(v[0] / v[1]) * 100}%"></i></div><b>${v[0]}/${v[1]}</b></div>`).join('')}</div>
      </section>
      <section class="panel">
        <div class="block-head"><h3>Answer review</h3>
          <div class="seg small">${[['all', 'All'], ['wrong', 'Wrong'], ['blank', 'Blank']].map(([k, l]) => `<button class="${ui.resFilter === k ? 'on' : ''}" data-act="res-filter" data-v="${k}" type="button">${l}</button>`).join('')}</div></div>
        <div class="rlist">${rows.length ? rows.map(({ it, k, q }) => reviewCard(ch, q, it.pick, k + 1, it.order)).join('') : '<p class="muted">Nothing here.</p>'}</div>
      </section>
    </div>`;
  }

  function reviewCard(ch, q, pick, num, order) {
    const status = pick === null ? 'blank' : pick === q.a ? 'right' : 'wrong';
    order = order || [0, 1, 2, 3, 4];
    return `<article class="rcard ${status}">
      <header><span class="qnum">${num ? 'Q' + num : ''}</span><span class="chip">${fmt(ch.topics[q.topic])}</span><span class="rstatus">${status === 'right' ? 'Correct' : status === 'wrong' ? 'Wrong' : 'Skipped'}</span></header>
      <p class="qtext sm">${fmt(q.q)}</p>
      <ul class="ropts">${order.map((oi, pos) => `<li class="${oi === q.a ? 'right' : oi === pick ? 'wrong' : ''}"><span class="letter">${LETTERS[pos]}</span>${fmt(q.o[oi])}${oi === pick && oi !== q.a ? '<em>your answer</em>' : ''}${oi === q.a ? '<em>correct</em>' : ''}</li>`).join('')}</ul>
      <div class="note"><span class="callout-tag">Note</span><p>${fmt(q.ex)}</p></div>
    </article>`;
  }

  function scheduleCard(x) {
    const n = daysUntil(x.next);
    const msg = {
      up: `Stage ${x.level} of ${INTERVALS.length} reached. Come back ${relDay(n)} and the gap grows again.`,
      locked: `All ${INTERVALS.length} stages done: this section is locked in. One check-up ${relDay(n)} keeps it there.`,
      hold: `Between 60% and 80%, so you stay on stage ${x.level} and repeat the same gap.`,
      reset: `Below 60%, so the schedule starts again from stage 0. Read the notes for this section, then try again tomorrow.`,
      early: `This was before the due date, so it counts as extra practice and doesn't move you up a stage. Your scheduled recall stays the same.`
    }[x.outcome];
    return `<section class="panel schedule ${x.outcome}">
      <div class="sched-date"><span class="eyebrow">Next recall</span><b>${fmtDay(x.next)}</b><small>${relDay(n)}</small></div>
      <div class="sched-info"><h3>${x.outcome === 'reset' ? 'Schedule restarted' : x.outcome === 'locked' ? 'Locked in ✦' : x.outcome === 'early' ? 'Extra practice' : x.outcome === 'hold' ? 'Same gap again' : 'Moving up'}</h3>
        <p class="muted">${msg}</p>${stageTrack(x.level)}</div>
    </section>`;
  }

  function viewRecall(ch) {
    if (run && run.cid === ch.id && run.source === 'recall') return run.finished ? viewResults(ch) : viewQuestion(ch);
    const otherLive = run && run.cid === ch.id && !run.finished;
    return `<div class="recall">
      ${otherLive ? `<a class="livebar" href="#${ch.id}-test">You have an unfinished test. Finish or quit it before starting a recall session →</a>` : ''}
      <section class="panel recall-intro">
        <div>
          <span class="eyebrow">Spaced recall</span>
          <h2>Timed recall, then come back on schedule</h2>
          <p class="muted">Take a timed test on one section. When it ends you see your result and the day to come back. Score 80% or more on the due day to move up a stage. Pass all five stages, with gaps of 1 → 3 → 7 → 16 → 35 days, and the section is locked in.</p>
        </div>
        <ul class="recall-rules">
          <li><b>${SECS_PER_Q} s</b><span>per question, IMAT pace (60 questions in 100 min)</span></li>
          <li><b class="good">≥ 80%</b><span>next stage, longer gap</span></li>
          <li><b class="warnc">60–79%</b><span>same gap again</span></li>
          <li><b class="bad">&lt; 60%</b><span>restart tomorrow</span></li>
        </ul>
      </section>
      <div class="recall-grid">
        ${ch.sections.map((s) => {
          const n = recallCount(ch, s.id);
          if (!n) return '';
          const st = srsStatus(ch, s.id);
          const last = st.r && st.r.sessions.length ? st.r.sessions[st.r.sessions.length - 1] : null;
          const pill = { new: ['New', 'new'], due: ['Due today', 'due'], overdue: [relDay(st.days), 'due'], scheduled: [relDay(st.days), 'sched'], locked: ['Locked in', 'locked'] }[st.state];
          const early = st.state === 'scheduled' || st.state === 'locked';
          return `<article class="panel rcd ${st.state}">
            <header><span class="eyebrow">Section ${s.id}</span><span class="pill ${pill[1]}">${esc(pill[0])}</span></header>
            <h3>${fmt(s.title)}</h3>
            ${stageTrack(st.level)}
            <dl class="rcd-facts">
              <div><dt>Next recall</dt><dd>${st.r ? fmtDay(st.r.next) : 'Start any time'}</dd></div>
              <div><dt>Last score</dt><dd>${last ? pct(last.acc) + '%' : '–'}</dd></div>
              <div><dt>Sessions</dt><dd>${st.r ? st.r.sessions.length : 0}</dd></div>
            </dl>
            <button class="btn ${early ? 'ghost' : 'primary'}" data-act="recall-start" data-id="${s.id}" type="button" ${otherLive ? 'disabled' : ''}>${early ? 'Practise early' : 'Start recall'} · ${n} Q · ${mmss(n * SECS_PER_Q)}</button>
            ${early ? `<p class="muted small">Not due yet: an early session won't move you up a stage.</p>` : ''}
          </article>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ mistakes */
  function viewMistakes(ch) {
    const list = Object.entries(S.mistakes).filter(([, m]) => m.cid === ch.id).sort((a, b) => b[1].times - a[1].times || b[1].last - a[1].last);
    const fixedN = Object.keys(S.fixed).filter((id) => ch.questions.some((q) => q.id === id)).length;
    if (!list.length) {
      return `<section class="panel empty">
        <div class="empty-ico" aria-hidden="true">✦</div>
        <h2>No mistakes to fix</h2>
        <p class="muted">Every question you get wrong or skip in a test lands here with its explanation, so you can revisit it as a note and retry it.${fixedN ? ` You have already fixed ${fixedN}.` : ''}</p>
        <a class="btn primary" href="#${ch.id}-test">Take a test</a>
      </section>`;
    }
    const byTopic = {};
    list.forEach(([id]) => { const q = qById(ch.id, id); if (q) byTopic[q.topic] = (byTopic[q.topic] || 0) + 1; });
    return `<div class="mistakes">
      <section class="panel mist-head">
        <div><span class="eyebrow">Your notebook</span><h2>${list.length} question${list.length === 1 ? '' : 's'} to fix</h2>
          <p class="muted">Answer one correctly in any test and it moves out of this list.${fixedN ? ` Fixed so far: <b class="good">${fixedN}</b>.` : ''}</p>
          <div class="chips">${Object.entries(byTopic).map(([t, n]) => `<span class="chip">${fmt(ch.topics[t])} <i>${n}</i></span>`).join('')}</div>
        </div>
        <button class="btn primary big" data-act="practice-mistakes" type="button">Practise my mistakes</button>
      </section>
      <div class="rlist">
        ${list.map(([id, m]) => {
          const q = qById(ch.id, id); if (!q) return '';
          return `<div class="mist-item">
            <div class="mist-meta"><span>Missed ${m.times}×</span><span>last on ${fmtDate(m.last)}</span><button class="btn ghost small" data-act="fix" data-id="${id}" type="button">I've got it ✓</button></div>
            ${reviewCard(ch, q, m.picked, 0)}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ progress */
  function viewProgress(ch, st) {
    const hist = st.all.slice(-20);
    const chart = (() => {
      if (hist.length < 1) return '<p class="muted">Take a test to start your score history.</p>';
      const w = 600, h = 200, x0 = 40, y0 = 14, gw = w - x0 - 16, gh = h - 40;
      const X = (i) => x0 + (hist.length === 1 ? gw / 2 : (i / (hist.length - 1)) * gw);
      const Y = (v) => y0 + gh - v * gh;
      const pts = hist.map((a, i) => [X(i), Y(a.correct / a.total)]);
      const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const area = line + ` L${pts[pts.length - 1][0]},${Y(0)} L${pts[0][0]},${Y(0)} Z`;
      return `<div class="chartwrap"><svg viewBox="0 0 ${w} ${h}" class="g-svg" role="img" aria-label="Accuracy over your last ${hist.length} tests">
        <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cyan)" stop-opacity=".35"/><stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/></linearGradient></defs>
        ${[0, 0.25, 0.5, 0.75, 1].map((v) => `<line x1="${x0}" x2="${x0 + gw}" y1="${Y(v)}" y2="${Y(v)}" class="g-grid"/><text x="${x0 - 8}" y="${Y(v) + 4}" text-anchor="end" class="g-tick">${v * 100}%</text>`).join('')}
        <path d="${area}" fill="url(#area)"/>
        <path d="${line}" class="g-line" fill="none"/>
        ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 6 : 3.5}" class="${i === pts.length - 1 ? 'g-dot' : 'g-pt'}"><title>${fmtDate(hist[i].date)}: ${hist[i].correct}/${hist[i].total}</title></circle>`).join('')}
        <text x="${x0}" y="${h - 6}" class="g-tick">oldest</text><text x="${x0 + gw}" y="${h - 6}" class="g-tick" text-anchor="end">latest</text>
      </svg></div>`;
    })();
    const topicRows = Object.keys(ch.topics).map((t) => ({ t, v: st.topics[t] })).sort((a, b) => {
      const ra = a.v ? a.v[0] / a.v[1] : 2, rb = b.v ? b.v[0] / b.v[1] : 2; return ra - rb;
    });
    return `<div class="progress">
      <section class="tiles">
        <div class="tile"><span>Mastery</span><b>${pct(st.mastery)}%</b><small>review + best test</small></div>
        <div class="tile"><span>Tests taken</span><b>${st.all.length}</b><small>${st.answered} questions answered</small></div>
        <div class="tile"><span>Best accuracy</span><b>${st.at.length ? pct(st.best) + '%' : '–'}</b><small>average ${st.at.length ? pct(st.avg) + '%' : '–'}</small></div>
        <div class="tile"><span>Mistakes open</span><b class="${st.mistakes ? 'warnc' : ''}">${st.mistakes}</b><small>${Object.keys(S.fixed).filter((id) => ch.questions.some((q) => q.id === id)).length} fixed</small></div>
      </section>
      <section class="panel"><h3>Accuracy over time</h3>${chart}</section>
      <div class="two">
        <section class="panel"><h3>Topics, weakest first</h3>
          <div class="tbars">${topicRows.map(({ t, v }) => `<div class="tbar ${v && v[0] / v[1] < 0.6 ? 'weak' : ''}"><span>${fmt(ch.topics[t])}</span><div class="bar"><i style="width:${v ? (v[0] / v[1]) * 100 : 0}%"></i></div><b>${v ? pct(v[0] / v[1]) + '%' : 'not tried'}</b></div>`).join('')}</div>
        </section>
        <section class="panel"><h3>Review checklist</h3>
          <ul class="checklist">
            ${ch.sections.map((s) => `<li class="${S.reviewed[ch.id + ':' + s.id] ? 'done' : ''}"><button data-act="toggle-reviewed" data-id="${s.id}" type="button"><i>${S.reviewed[ch.id + ':' + s.id] ? '✓' : ''}</i>${s.id} ${fmt(s.title)}</button></li>`).join('')}
            <li class="${st.known === ch.flashcards.length ? 'done' : ''}"><span><i>${st.known === ch.flashcards.length ? '✓' : ''}</i>Flashcards known: ${st.known} / ${ch.flashcards.length}</span></li>
          </ul>
          <div class="reset">
            ${ui.confirmReset
              ? `<p class="small">Delete all tests, mistakes and review marks for this chapter?</p><button class="btn ghost small" data-act="reset-no" type="button">Cancel</button><button class="btn small danger" data-act="reset-yes" type="button">Delete chapter progress</button>`
              : `<button class="btn ghost small" data-act="reset-ask" type="button">Reset chapter progress</button>`}
          </div>
        </section>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ figures */
  function viewFigures(ch) {
    return `<div class="figs">
      <p class="muted figs-intro">Redrawn, interactive versions of the figures in this chapter. Move the sliders and watch the particles.</p>
      ${ch.figures.map((id) => {
        const f = FIGS[id]; if (!f) return '';
        return `<article class="panel fig" id="fig-${id}">
          <header><span class="eyebrow">${esc(f.tag)}</span><h2>${esc(f.title)}</h2><p class="muted">${esc(f.caption)}</p></header>
          <div class="fig-body" data-fig="${id}"></div>
          ${f.notice && f.notice.length ? `<div class="notice"><span class="callout-tag">What to notice</span><ul>${f.notice.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
        </article>`;
      }).join('')}
    </div>`;
  }
  function mountFigures() {
    document.querySelectorAll('[data-fig]').forEach((el) => {
      const f = FIGS[el.dataset.fig];
      if (f) { try { const c = f.mount(el); if (typeof c === 'function') cleanup.push(c); } catch (e) { el.innerHTML = '<p class="muted">This figure could not load.</p>'; } }
    });
  }

  /* ------------------------------------------------------------ actions */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-scroll]');
    if (link) { pendingScroll = link.dataset.scroll; return; }
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act, r = parse();
    const ch = r.cid ? byId(r.cid) : null;
    switch (act) {
      case 'sub': S.ui.sub[ch.id] = b.dataset.id; save(); render(); document.querySelector('.review-main')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return;
      case 'toggle-reviewed': {
        const k = ch.id + ':' + b.dataset.id;
        if (S.reviewed[k]) delete S.reviewed[k]; else { S.reviewed[k] = Date.now(); touchDay(); }
        save(); render(); return;
      }
      case 'reveal': { const k = ch.id + b.dataset.id; ui.revealed[k] = !ui.revealed[k]; render(); return; }
      case 'flip': ui.flashFlip = !ui.flashFlip; b.classList.toggle('flipped', ui.flashFlip); return;
      case 'flash-know': {
        const order = flashDeck(ch); const i = order[ui.flashIdx % order.length];
        S.flash[ch.id] = S.flash[ch.id] || {}; S.flash[ch.id][i] = 1; touchDay(); save();
        ui.flashIdx++; ui.flashFlip = false; render(); return;
      }
      case 'flash-again': ui.flashIdx++; ui.flashFlip = false; render(); return;
      case 'pref': {
        const k = b.dataset.k; S.ui.prefs[k] = k === 'count' ? +b.dataset.v : b.dataset.v; save(); render(); return;
      }
      case 'start': if (run && !run.finished && run.source === 'recall') return; startRun(ch, { mode: S.ui.prefs.mode, count: +S.ui.prefs.count, topic: S.ui.prefs.topic }); render(true); return;
      case 'pick': {
        const it = run.items[run.i]; const v = +b.dataset.v;
        if (run.mode === 'practice' && it.locked) return;
        it.pick = it.pick === v && run.mode === 'exam' ? null : v;
        render(); return;
      }
      case 'check': run.items[run.i].locked = true; render(); return;
      case 'skip': { const it = run.items[run.i]; it.pick = null; it.locked = true; render(); return; }
      case 'next':
        if (run.i + 1 < run.items.length) { run.i++; render(); scrollQuiz(); }
        else { finishRun(); render(true); }
        return;
      case 'prev': if (run.i > 0) { run.i--; render(); } return;
      case 'jump': run.i = +b.dataset.v; render(); return;
      case 'finish': {
        const unanswered = run.items.filter((x) => x.pick === null).length;
        if (unanswered && run.mode === 'exam') { ui.confirmFinish = true; render(); return; }
        finishRun(); render(true); return;
      }
      case 'finish-yes': ui.confirmFinish = false; finishRun(); render(true); return;
      case 'finish-cancel': ui.confirmFinish = false; render(); return;
      case 'quit': clearInterval(timerId); run = null; render(true); return;
      case 'res-filter': ui.resFilter = b.dataset.v; render(); return;
      case 'retry-wrong': {
        const ids = run.items.filter((it) => it.pick !== qById(ch.id, it.qid).a).map((it) => it.qid);
        startRun(ch, { mode: 'practice', qids: ids, source: 'mistakes' });
        if (r.tab === 'test') render(true); else go(ch.id + '-test');
        return;
      }
      case 'recall-start': {
        if (run && !run.finished) return;
        const sid = b.dataset.id;
        const pool = recallPool(ch, sid);
        const missed = shuffle(pool.filter((q) => S.mistakes[q.id]));
        const rest = shuffle(pool.filter((q) => !S.mistakes[q.id]));
        const ids = missed.concat(rest).slice(0, RECALL_MAX).map((q) => q.id);
        startRun(ch, { mode: 'exam', qids: shuffle(ids), source: 'recall', unit: sid });
        render(true); return;
      }
      case 'new-test': run = null; render(true); return;
      case 'practice-mistakes': {
        const ids = Object.entries(S.mistakes).filter(([, m]) => m.cid === ch.id).map(([id]) => id);
        startRun(ch, { mode: 'practice', qids: ids, source: 'mistakes' }); go(ch.id + '-test'); return;
      }
      case 'fix': delete S.mistakes[b.dataset.id]; S.fixed[b.dataset.id] = Date.now(); save(); render(); return;
      case 'reset-ask': ui.confirmReset = true; render(); return;
      case 'reset-no': ui.confirmReset = false; render(); return;
      case 'reset-yes': {
        S.attempts = S.attempts.filter((a) => a.cid !== ch.id);
        for (const [id, m] of Object.entries(S.mistakes)) if (m.cid === ch.id) delete S.mistakes[id];
        for (const id of Object.keys(S.fixed)) if (ch.questions.some((q) => q.id === id)) delete S.fixed[id];
        for (const k of Object.keys(S.reviewed)) if (k.startsWith(ch.id + ':')) delete S.reviewed[k];
        delete S.flash[ch.id]; ui.flashDeck = null;
        ui.confirmReset = false; save(); render(); return;
      }
    }
  });
  function scrollQuiz() { const q = document.querySelector('.quiz'); if (q && q.getBoundingClientRect().top < 0) q.scrollIntoView({ block: 'start' }); }

  // keyboard: A–E to pick, Enter to check/next
  document.addEventListener('keydown', (e) => {
    if (!run || run.finished || !['test', 'recall'].includes(parse().tab) || e.target.matches('input,select,textarea')) return;
    const k = e.key.toUpperCase();
    const idx = LETTERS.indexOf(k);
    if (idx >= 0) { const btn = document.querySelectorAll('.opt')[idx]; if (btn && !btn.disabled) btn.click(); }
    if (e.key === 'Enter') { const n = document.querySelector('[data-act="check"]:not([disabled]), [data-act="next"]'); if (n) { e.preventDefault(); n.click(); } }
  });

  /* ------------------------------------------------------------ sparkle background */
  (function sparkle() {
    const cv = document.getElementById('sparkle');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W, H, stars = [], bubbles = [];
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((W * H) / 9000);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6.28, s: Math.random() * 1.5 + 0.5 }));
      bubbles = Array.from({ length: Math.max(6, Math.round(W / 160)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 3 + 2, vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 10 - 4, hue: Math.random() < 0.5 ? '94,242,255' : '255,106,213' }));
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const a = reduce ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0006 * s.s + s.p));
        ctx.fillStyle = `rgba(220,230,255,${a * 0.8})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
        if (s.r > 1.25 && a > 0.92) {
          ctx.strokeStyle = `rgba(200,240,255,${(a - 0.9) * 6})`; ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(s.x - 5, s.y); ctx.lineTo(s.x + 5, s.y); ctx.moveTo(s.x, s.y - 5); ctx.lineTo(s.x, s.y + 5); ctx.stroke();
        }
      }
      for (const b of bubbles) {
        if (!reduce) { b.x += b.vx / 60; b.y += b.vy / 60; if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; } }
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 5);
        g.addColorStop(0, `rgba(${b.hue},0.55)`); g.addColorStop(0.25, `rgba(${b.hue},0.18)`); g.addColorStop(1, `rgba(${b.hue},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 5, 0, 6.283); ctx.fill();
      }
    }
    size();
    window.addEventListener('resize', size);
    if (reduce) { draw(0); return; }
    let last = 0;
    const f = (t) => { if (!document.hidden && t - last > 33) { last = t; draw(t); } requestAnimationFrame(f); };
    requestAnimationFrame(f);
  })();

  render(true);
})();
