/* One keypress = next slide. Each slide's animation starts by itself on arrival and loops; only the
   visible slide animates (requestAnimationFrame + timers are cancelled on leave), so nothing lags. */
(() => {
  const S = [...document.querySelectorAll('.slide')];
  const $ = id => document.getElementById(id);
  const stage = $('stage'), body = document.body;
  const STOP = Symbol('stop');
  const NS = 'http://www.w3.org/2000/svg';
  let cur = -1, tok = null, speaker = null, t0 = Date.now();

  const fit = () => { const k = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${k}) translate(-50%, -50%)`; };
  addEventListener('resize', fit); fit();

  // ------------------------------------------------------------------ helpers (all cancellable)
  const mk = (parent, tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const sleep = (ms, t) => new Promise((res, rej) => {
    if (t.dead) return rej(STOP);
    const id = setTimeout(() => (t.dead ? rej(STOP) : res()), ms);
    t.timers.add(id);
  });
  const frame = (t, fn) => new Promise((res, rej) => {        // fn(now) returns true when done
    const step = now => { if (t.dead) return rej(STOP); if (fn(now)) res(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const ease = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  function move(svg, pts, dur, t, cls = 'pk', r = 8) {
    const g = mk(svg, 'g'); mk(g, 'circle', { r: r * 2.2, class: 'pk-halo' }); mk(g, 'circle', { r, class: cls });
    const seg = []; let tot = 0;
    for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(d); tot += d; }
    const start = performance.now();
    return frame(t, now => {
      const k = Math.min(1, (now - start) / dur); let d = ease(k) * tot, j = 0;
      while (j < seg.length - 1 && d > seg[j]) { d -= seg[j]; j++; }
      const f = seg[j] ? d / seg[j] : 1;
      g.setAttribute('transform', `translate(${pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f} ${pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f})`);
      if (k >= 1) g.remove();
      return k >= 1;
    }).catch(e => { g.remove(); throw e; });
  }
  const flash = (el, ms = 700) => { el.classList.add('hot'); setTimeout(() => el.classList.remove('hot'), ms); };
  const quiet = p => p.catch(() => {});
  const forever = async (t, fn) => { while (!t.dead) await fn(); };
  function countUp(el, to, ms, t, fmt = n => n.toLocaleString()) {
    const start = performance.now();
    return frame(t, now => { const k = Math.min(1, (now - start) / ms); el.textContent = fmt(Math.round(ease(k) * to)); return k >= 1; });
  }
  async function type(el, text, t, ms = 28) { for (const ch of text) { el.textContent += ch; await sleep(ms, t); } }
  const hex = n => Array.from({ length: n }, () => '0123456789abcdef'[Math.random() * 16 | 0]).join('');
  async function scramble(el, final, t, ms = 700) {
    const end = performance.now() + ms;
    await frame(t, now => { el.textContent = final.slice(0, 7) + hex(Math.max(8, final.length - 7)); return now > end; });
    el.textContent = final;
  }
  const fx = s => { const svg = s.querySelector('svg.fx'); svg.querySelectorAll('.dyn').forEach(n => n.remove()); return svg; };

  // ------------------------------------------------------------------ per-slide animations
  const ANIM = {
    async candles(s, t) {   // a candlestick chart that builds up, then keeps trading
      const svg = fx(s), g = mk(svg, 'g', { class: 'dyn' }), N = 44, X0 = 140, STEP = 36, Y0 = 440, H = 470;
      let last = 100, k = 0;
      const next = () => { const o = last, c = o + (Math.random() - .42) * 3.2, hi = Math.max(o, c) + Math.random() * 1.6, lo = Math.min(o, c) - Math.random() * 1.6; last = c; return { o, c, hi, lo }; };
      const data = Array.from({ length: N }, next);
      const draw = shown => {
        g.replaceChildren();
        const vis = data.slice(0, shown), lo = Math.min(...data.map(d => d.lo)), hi = Math.max(...data.map(d => d.hi));
        const y = v => Y0 + H - ((v - lo) / (hi - lo)) * H;
        let ma = '';
        vis.forEach((d, i) => {
          const x = X0 + i * STEP, col = d.c >= d.o ? 'var(--up)' : 'var(--down)';
          mk(g, 'line', { x1: x + 11, x2: x + 11, y1: y(d.hi), y2: y(d.lo), style: `stroke:${col};stroke-width:1.5;opacity:.8` });
          mk(g, 'rect', { x, y: y(Math.max(d.o, d.c)), width: 22, height: Math.max(2, Math.abs(y(d.o) - y(d.c))), rx: 2, style: `fill:${col};opacity:.85` });
          const w = vis.slice(Math.max(0, i - 6), i + 1), avg = w.reduce((a, b) => a + b.c, 0) / w.length;
          ma += `${i ? 'L' : 'M'}${x + 11} ${y(avg)}`;
        });
        if (vis.length) {
          mk(g, 'path', { d: ma, style: 'fill:none;stroke:#fff;stroke-width:2;opacity:.55' });
          const lc = vis[vis.length - 1].c, ly = y(lc), pct = ((lc - data[0].o) / data[0].o) * 100;
          mk(g, 'line', { x1: X0, x2: 1700, y1: ly, y2: ly, style: 'stroke:#fff;stroke-dasharray:4 6;opacity:.35' });
          mk(g, 'rect', { x: 1708, y: ly - 18, width: 112, height: 36, rx: 5, style: `fill:${pct >= 0 ? 'var(--up)' : 'var(--down)'}` });
          const tx = mk(g, 'text', { x: 1764, y: ly + 6, 'text-anchor': 'middle', style: 'fill:#000;font:600 16px var(--mono)' });
          tx.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
        }
      };
      for (k = 1; k <= N; k++) { draw(k); await sleep(55, t); }
      await forever(t, async () => { await sleep(900, t); data.shift(); data.push(next()); draw(N); });
    },

    async problem(s, t) {
      const svg = fx(s), scr = $('lapScreen'), st = $('lapStatus'), pods = [$('pP1'), $('pP2')];
      s.querySelectorAll('[data-count]').forEach(b => quiet(countUp(b, +b.dataset.count, 1400, t, n => (b.dataset.pre || '') + n.toLocaleString())));
      const ys = [430, 500, 570];
      const right = async i => { const y = ys[i % 3], p = i % 2, py = [430, 500][p];
        await move(svg, [[1110, y], [1300, 500]], 450, t); flash($('pLb'));
        await move(svg, [[1450, 500], [1560, py]], 380, t); flash(pods[p]); };
      const left = async (i, down) => { const y = ys[i % 3];
        if (!down) { await move(svg, [[190, y], [540, 500], [600, 488]], 700, t); flash(scr); }
        else await move(svg, [[190, y], [380, (y + 500) / 2]], 600, t, 'pk bad'); };
      let i = 0;
      await forever(t, async () => {
        for (let k = 0; k < 4; k++, i++) await Promise.all([left(i, false), right(i), sleep(500, t)]);
        scr.style.transform = 'scaleY(.04)'; st.textContent = 'offline · site gone';
        for (let k = 0; k < 4; k++, i++) await Promise.all([left(i, true), right(i), sleep(500, t)]);
        scr.style.transform = ''; st.textContent = 'online';
      });
    },

    async website(s, t) {
      const svg = fx(s), cards = [...s.querySelectorAll('.card')], cnt = $('wCount'); let n = 0;
      await forever(t, async () => {
        for (const c of cards) {
          c.classList.add('hot');
          const x = parseFloat(c.style.left) + 270, y = parseFloat(c.style.top) + 230;
          await sleep(250, t);
          await move(svg, [[x, y], [x, 900], [1560, 900]], 1200, t);
          flash($('wGcp')); cnt.textContent = `${++n} request${n > 1 ? 's' : ''}`;
          c.classList.remove('hot'); await sleep(150, t);
        }
      });
    },

    async cloud(s, t) {
      const svg = fx(s), P = [$('cP1'), $('cP2')], PY = [446, 544], say = $('cSay'), lock = $('cLock'), log = $('cLog');
      let lines = 0, i = 0;
      const tell = txt => { say.textContent = txt; say.style.opacity = txt ? 1 : 0; };
      tell('startup · keys into pod memory');
      flash($('cSec'), 900);
      await Promise.all([move(svg, [[1390, 722], [1270, 544], [1270, 446]], 900, t), move(svg, [[1390, 722], [1270, 544]], 700, t)]);
      P.forEach(p => flash(p)); await sleep(500, t);
      const SVC = [[$('cSql'), 398, 'query · Cloud SQL'], [$('cSql'), 398, 'trade · one transaction'], [$('cSto'), 560, 'photo · private bucket'], [$('cSql'), 398, 'sign-in · new session']];
      await forever(t, async () => {
        const p = i % 2, py = PY[p], [svc, sy, label] = SVC[i % SVC.length]; i++;
        flash($('cYou'));
        await move(svg, [[330, 630], [410, 630]], 420, t);
        flash($('cLb')); lock.style.opacity = 1;
        await move(svg, [[760, 630], [880, py]], 420, t);
        flash(P[p]); tell(label);
        quiet(move(svg, [[1075, py + 36], [1075, 820], [960, 868]], 800, t, 'pk', 5).then(() => { log.textContent = `Cloud Logging · ${++lines} log line${lines > 1 ? 's' : ''}`; }));
        await move(svg, [[1270, py], [1390, sy]], 420, t);
        flash(svc);
        await move(svg, [[1390, sy], [1270, py], [880, py], [760, 630], [410, 630], [330, 630]], 1100, t, 'pk hollow', 7);
        flash($('cYou')); await sleep(250, t);
      });
    },

    async changes(s, t) {
      const svg = fx(s), rows = [...s.querySelectorAll('.row')];
      await forever(t, async () => {
        for (const [k, r] of rows.entries()) {
          r.classList.add('hot');
          const y = parseFloat(r.style.top) + 91, burst = k === 5 ? 3 : 1;
          await Promise.all(Array.from({ length: burst }, (_, b) => sleep(b * 180, t).then(() => move(svg, [[560, y], [1810, y]], 1000, t, 'pk', 6))));
          await sleep(900, t); r.classList.remove('hot');
        }
      });
    },

    async database(s, t) {
      const svg = fx(s), E = $('dEmail'), Pw = $('dPass'), T = $('dTok'), buy = $('dBuy'), txn = $('dTxn');
      const tb = id => $(id), hot = (id, on = true) => tb(id).classList.toggle('hot', on);
      const all = ['t_users', 't_sessions', 't_auth', 't_port', 't_hold', 't_tx'];
      await forever(t, async () => {
        E.textContent = Pw.textContent = T.textContent = ''; all.forEach(id => hot(id, false)); txn.style.opacity = 0; buy.classList.remove('hot');
        await sleep(400, t);
        await type(E, 'demo@example.com', t, 40);
        await type(Pw, '••••••••••', t, 55); await sleep(350, t);
        await scramble(Pw, 'scrypt$16384$8$1$' + hex(10) + '…', t);
        await move(svg, [[600, 470], [690, 395]], 600, t); hot('t_users');
        T.textContent = 'sent to your browser once'; await sleep(700, t);
        await scramble(T, 'sha256 ' + hex(16) + '…', t);
        await move(svg, [[600, 600], [690, 520]], 600, t); hot('t_sessions');
        await move(svg, [[600, 640], [690, 645]], 550, t); hot('t_auth');
        await move(svg, [[600, 450], [650, 350], [1060, 350], [1080, 395]], 900, t); hot('t_port');
        await sleep(700, t); buy.classList.add('hot'); await sleep(300, t);
        ['t_users', 't_sessions', 't_auth', 't_port'].forEach(id => hot(id, false));
        await Promise.all([395, 520, 645].map(y => move(svg, [[600, 820], [650, 860], [1040, 860], [1080, y]], 1000, t)));
        ['t_port', 't_hold', 't_tx'].forEach(id => hot(id)); txn.style.opacity = 1;
        await sleep(2600, t);
      });
    },

    async security(s, t) {
      const svg = fx(s), L = [0, 1, 2, 3, 4].map(i => $('L' + i)), R = [0, 1, 2, 3].map(i => $('R' + i)), msg = $('sMsg');
      const say = x => { msg.textContent = x; msg.style.opacity = x ? 1 : 0; };
      const X = [40, 100, 175, 250, 325, 400];
      await forever(t, async () => {
        say('a signed-in request');
        for (let k = 0; k < 5; k++) { await move(svg, [[X[k], 640], [X[k + 1], 640]], 380, t); flash(L[k], 900); if (R[k]) flash(R[k], 1100); }
        say('reaches the data'); await sleep(1400, t);
        for (let k = 1; k <= 6; k++) {
          say(k <= 5 ? `wrong password · ${k} of 5` : 'blocked · up to 15 min');
          await move(svg, [[40, 640], [k <= 5 ? 168 : 95, 640], [50, 640]], 650, t, 'pk bad'); flash(L[k <= 5 ? 1 : 0]); flash(R[1], 600);
        }
        await sleep(600, t);
        say('internet → database: no public IP');
        await move(svg, [[480, 1060], [480, 742], [480, 1000]], 1200, t, 'pk bad'); flash(L[3], 1000); flash(R[3], 1000);
        await sleep(1300, t);
      });
    },

    async ops(s, t) {
      const chip = (txt, pend) => { const c = document.createElement('div'); c.className = 'chip' + (pend ? ' pending' : ''); c.textContent = txt; return c; };
      const N1 = $('oN1p'), N2 = $('oN2p'), N3 = $('oN3'), N3p = $('oN3p'), cpu = $('oCpu'), cpuL = $('oCpuL'), say = $('oSay'), req = $('oReq');
      const clock = $('oClock'), stages = [...$('oStages').children], psay = $('oPipeSay'), tf = $('oTf');
      const mm = sec => `${sec / 60 | 0}:${String(sec % 60).padStart(2, '0')}`;
      const cluster = forever(t, async () => {
        N1.replaceChildren(chip('pod')); N2.replaceChildren(chip('pod')); N3p.replaceChildren(); N3.classList.add('ghost');
        cpu.style.width = '8%'; cpuL.textContent = 'cpu · normal'; say.textContent = '';
        const start = performance.now();
        quiet(frame(t, now => { const n = Math.min(668, Math.round((now - start) / 17)); req.textContent = `requests ok ${n} / ${n}`; return n >= 668; }));
        await sleep(1200, t);
        say.textContent = 'a pod is deleted'; N1.firstChild.classList.add('dead'); await sleep(700, t);
        const fresh = chip('starting', true); N1.replaceChildren(fresh);
        for (let k = 0; k <= 19; k++) { fresh.textContent = `starting ${k} s`; await sleep(95, t); }
        fresh.classList.remove('pending'); fresh.textContent = 'pod'; say.textContent = 'replaced and ready in ~19 s'; await sleep(1600, t);
        say.textContent = 'load test'; cpu.style.width = '96%'; cpuL.textContent = 'cpu 225–280% of request · target 60%'; await sleep(900, t);
        const extra = [chip('pod', true), chip('pod', true)]; N2.append(extra[0]); N3.classList.remove('ghost'); N3p.append(extra[1]);
        await sleep(900, t); extra.forEach(c => c.classList.remove('pending')); say.textContent = '2 → 4 pods, +1 server'; await sleep(2000, t);
        cpu.style.width = '10%'; cpuL.textContent = 'load stopped'; await sleep(900, t);
        extra.forEach(c => c.classList.add('gone')); N3.classList.add('ghost'); say.textContent = 'back to 2'; await sleep(2000, t);
      });
      const runStages = async (plan, fail) => {
        let sec = 0;
        for (const [k, el] of stages.entries()) {
          el.className = 'stage-box run';
          const to = sec + plan[k], from = sec, st = performance.now();
          await frame(t, now => { const f = Math.min(1, (now - st) / 900); sec = Math.round(from + (to - from) * f); clock.textContent = mm(sec); return f >= 1; });
          if (fail === k) { el.className = 'stage-box fail'; return; }
          el.className = 'stage-box ok';
        }
      };
      const pipeline = forever(t, async () => {
        stages.forEach(e => (e.className = 'stage-box')); tf.textContent = ''; clock.textContent = '0:00';
        psay.textContent = 'git push → master'; await sleep(600, t);
        await runStages([62, 71, 27, 13]);
        psay.textContent = 'live · /health shows the new commit · 2:53'; await sleep(900, t);
        await type(tf, '$ terraform plan\n', t, 30);
        tf.textContent += 'No changes. Your infrastructure matches the configuration.\n31 resources under Terraform';
        await sleep(2400, t);
        stages.forEach(e => (e.className = 'stage-box')); tf.textContent = ''; clock.textContent = '0:00';
        psay.textContent = 'a broken release (wrong port)'; await sleep(500, t);
        await runStages([60, 70, 300, 0], 2);
        psay.textContent = 'deploy failed → rollback in 2 s → previous version serving'; await sleep(2800, t);
      });
      await Promise.all([cluster, pipeline]);
    },

    async production(s, t) {
      const svg = fx(s), rows = [...s.querySelectorAll('.prow')], zt = $('zTitle'), zB = $('zB'), zC = $('zC');
      const hl = forever(t, async () => { for (const r of rows) { r.classList.add('hot'); await sleep(1300, t); r.classList.remove('hot'); } });
      const zones = forever(t, async () => {
        zt.textContent = 'today · one zone'; zB.style.opacity = zC.style.opacity = 0; await sleep(2600, t);
        zt.textContent = 'regional · high availability'; zB.style.opacity = 1; await sleep(350, t); zC.style.opacity = 1; await sleep(500, t);
        for (let k = 0; k < 4; k++) { await move(svg, [[1385, 730], [1455, 730]], 600, t, 'pk', 6); flash($('zDbB'), 500); await sleep(250, t); }
        await sleep(900, t);
      });
      await Promise.all([hl, zones]);
    },

    async demo(s, t) {
      const steps = [...s.querySelectorAll('.step')], term = $('mTerm');
      const at = k => steps.forEach((e, j) => e.classList.toggle('hot', j === k));
      const out = async (txt, ms = 260) => { term.textContent += txt + '\n'; await sleep(ms, t); };
      await forever(t, async () => {
        term.textContent = '';
        at(0); await out('# 01 · on the website'); await out('new account            → $100,000 cash'); await out('buy $1,000 of NVDA     → holding + cash updated', 900);
        at(1); await type(term, '\n$ kubectl exec -i deploy/app -- python - \\\n    demo@example.com < db_peek.py\n', t, 18);
        await out('== users           demo@example.com  scrypt$16384$8$1$…'); await out('== sessions        token_hash (SHA-256) …');
        await out('== transactions    BUY  NVDA  …', 900);
        at(2); await out('\n# 03 · Logs Explorer'); await out('POST /auth/register 201'); await out('POST /portfolio/…/trade-stock 200', 900);
        at(3); await type(term, '\n$ kubectl delete pod app-…\n', t, 22);
        await out('app-…   0/1   ContainerCreating', 900); await out('app-…   1/1   Running', 2600);
      });
    },
  };

  // ------------------------------------------------------------------ navigation
  function go(i) {
    i = Math.max(0, Math.min(S.length - 1, i));
    if (i === cur) return;
    if (tok) { tok.dead = true; tok.timers.forEach(clearTimeout); }
    if (S[cur]) S[cur].classList.remove('active');
    cur = i;
    const s = S[i];
    s.classList.add('active');
    body.classList.toggle('is-hero', s.dataset.type === 'hero');
    $('chipNum').textContent = s.dataset.num || '';
    $('kicker').textContent = s.dataset.kicker || '';
    $('who').textContent = s.dataset.who || '';
    $('progress').style.width = `${(i / (S.length - 1)) * 100}%`;
    history.replaceState(null, '', '#' + (i + 1));
    tok = { dead: false, timers: new Set() };
    const fn = ANIM[s.dataset.anim];
    if (fn) fn(s, tok).catch(e => { if (e !== STOP) console.error(e); });
    paintSpeaker();
  }

  // speaker window (S): notes, next slide, timer; notes ship only in the local build
  const NOTES = window.NOTES || [];
  function paintSpeaker() {
    if (!speaker || speaker.closed || !NOTES.length) return;
    const n = NOTES[cur] || {}, nx = S[cur + 1];
    speaker.document.body.innerHTML = `<div style="font:14px -apple-system,sans-serif;color:#888;display:flex;justify-content:space-between"><span>Slide ${cur + 1} / ${S.length} · ${n.who || ''}</span><span id="tm"></span></div>
      <div style="font:24px/1.5 -apple-system,sans-serif;margin-top:18px;white-space:pre-wrap">${(n.text || '').replace(/</g, '&lt;')}</div>
      <div style="margin-top:28px;font:14px -apple-system,sans-serif;color:#888">Next: ${nx ? (nx.querySelector('h2,.mega,.thanks') || {}).textContent : '—'}</div>`;
  }
  setInterval(() => { const e = speaker && !speaker.closed && speaker.document.getElementById('tm'); if (e) { const s = (Date.now() - t0) / 1000 | 0; e.textContent = `${s / 60 | 0}:${String(s % 60).padStart(2, '0')}`; } }, 1000);

  addEventListener('keydown', e => {
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); go(cur - 1); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(S.length - 1);
    else if (k === 'f' || k === 'F') (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
    else if ((k === 's' || k === 'S') && NOTES.length) {
      speaker = open('', 'mahok-speaker', 'width=900,height=700');
      speaker.document.title = 'Speaker notes'; speaker.document.body.style.cssText = 'background:#111;color:#eee;padding:28px';
      t0 = Date.now(); paintSpeaker();
    }
  });
  let tx = null;
  addEventListener('touchstart', e => (tx = e.touches[0].clientX), { passive: true });
  addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); tx = null; });
  // ticker tape: decorative moves (no prices), duplicated for a seamless loop; a few names re-tick every 2 s
  const TICK = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'JPM', 'V', 'LLY', 'UNH', 'XOM', 'COST', 'NFLX', 'AMD', 'ANT', 'WMT', 'ORCL', 'CRM'];
  const run = $('tapeRun');
  const cells = [...TICK, ...TICK].map(sym => { const sp = document.createElement('span'); sp.innerHTML = `<b>${sym}</b><em></em>`; run.append(sp); return sp; });
  const tick = sp => { const v = (Math.random() - .45) * 4, e = sp.querySelector('em'); e.textContent = `${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(2)}%`; e.className = v >= 0 ? 'u' : 'd'; };
  cells.forEach(tick);
  setInterval(() => { for (let i = 0; i < 4; i++) { const j = Math.random() * TICK.length | 0; [cells[j], cells[j + TICK.length]].forEach(sp => { tick(sp); }); } }, 2000);

  // background: a faint price line drifting across the grid (≈30 fps, one path)
  const cv = $('chart'), cx = cv.getContext('2d'), pts = []; let lv = 0, lastT = 0, off = 0;
  for (let i = 0; i < 70; i++) { lv += (Math.random() - .48) * 18; pts.push(lv); }
  const bgLoop = now => {
    requestAnimationFrame(bgLoop);
    if (now - lastT < 33) return; lastT = now;
    off += 0.6; if (off >= 30) { off -= 30; pts.shift(); lv += (Math.random() - .48) * 18; pts.push(lv); }
    const lo = Math.min(...pts), hi = Math.max(...pts), y = v => 1000 - ((v - lo) / (hi - lo || 1)) * 300;
    cx.clearRect(0, 0, 1920, 1080);
    cx.beginPath(); pts.forEach((v, i) => cx[i ? 'lineTo' : 'moveTo'](i * 30 - off, y(v)));
    cx.strokeStyle = 'rgba(255,255,255,.10)'; cx.lineWidth = 2; cx.stroke();
    cx.lineTo(1920, 1080); cx.lineTo(0, 1080); cx.closePath();
    const gr = cx.createLinearGradient(0, 700, 0, 1080); gr.addColorStop(0, 'rgba(47,210,122,.06)'); gr.addColorStop(1, 'rgba(47,210,122,0)');
    cx.fillStyle = gr; cx.fill();
  };
  requestAnimationFrame(bgLoop);
  setTimeout(() => ($('hint').style.opacity = 0), 4000);
  go((parseInt(location.hash.slice(1), 10) || 1) - 1);
})();
