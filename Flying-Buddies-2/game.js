/* Flying Buddies — vanilla JavaScript + Canvas 2D. Open index.html to play. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const { FlightEngine, MODES } = window.FlyingBuddiesEngine;
  const names = { mithai: 'Mithai', riaan: 'Riaan' };
  const assets = {};
  const store = new window.BuddyStore();
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  let engine, character = 'mithai', difficulty = 'classic';
  let active = false, initialized = false, lastTime = 0, accumulator = 0;
  let scale = 1, offsetX = 0, offsetY = 0, screenWidth = 420, screenHeight = 700;
  let lastScore = 0, previousBest = 0, newRecord = false, lastSecond = -1;
  let particles = [], audioContext = null;
  let sceneCache = [], avatarCache = {}, pauseCause = '';
  const step = 1 / 120;

  // No external audio files: short, quiet tones start only after a user gesture.
  function unlockAudio() {
    if (!store.data.settings.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audioContext) audioContext = new Audio();
      if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
    } catch (_) { /* Silent play is always supported. */ }
  }
  function tone(start, end, length, volume = .025, delay = 0) {
    if (!store.data.settings.sound || !audioContext || audioContext.state !== 'running') return;
    try {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const time = audioContext.currentTime + delay;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(start, time);
      oscillator.frequency.exponentialRampToValueAtTime(end, time + length);
      gain.gain.setValueAtTime(.0001, time);
      gain.gain.exponentialRampToValueAtTime(volume, time + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, time + length);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(time); oscillator.stop(time + length + .02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch (_) { /* A missing sound never interrupts a flight. */ }
  }
  function announce(message) { $('announcement').textContent = message; }
  function applySettings() {
    const settings = store.data.settings;
    document.body.classList.toggle('gentle', settings.gentle);
    $('difficulty').value = settings.difficulty;
    $('sound').checked = settings.sound;
    $('motion').checked = settings.gentle;
    refreshHome();
  }
  function refreshHome() {
    character = store.data.character;
    $('all-best').textContent = store.overallBest;
    $('chosen-name').textContent = names[character];
    $('mode-label').textContent = MODES[store.data.settings.difficulty].label + ' flight';
    for (const who of Object.keys(names)) $('' + who + '-best').textContent = store.best(who, store.data.settings.difficulty);
    document.querySelectorAll('[data-character]').forEach(button => {
      const selected = button.dataset.character === character;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  function storageStatus() {
    const temporary = store.backend === 'memory';
    $('storage-note').hidden = !temporary;
    $('storage-note').textContent = temporary ? 'Saving is blocked by this browser. Scores will last for this session only.' : '';
    if (temporary && active) announce('Browser storage is blocked. This score is temporary.');
  }
  function chooseBuddy(who) {
    if (!names[who]) throw new Error('Choose mithai or riaan.');
    if (active) throw new Error('Return home before changing buddies.');
    store.data.character = who;
    void store.save();
    refreshHome();
    announce(names[who] + ' selected.');
  }

  function coverImage(context, img, width, height) {
    const factor = Math.max(width / img.width, height / img.height);
    const w = img.width * factor, h = img.height * factor;
    context.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  }
  function buildSceneCache() {
    if (!engine || !assets.background1) return;
    sceneCache = [assets.background1, assets.background2].map(img => {
      const surface = document.createElement('canvas');
      surface.width = Math.ceil(engine.width * 2);
      surface.height = Math.ceil(engine.height * 2);
      const painter = surface.getContext('2d');
      coverImage(painter, img, surface.width, surface.height);
      painter.fillStyle = '#e5ffed'; painter.globalAlpha = .17;
      painter.fillRect(0, 0, surface.width, surface.height);
      return surface;
    });
  }
  function buildAvatarCache() {
    for (const who of Object.keys(names)) {
      const surface = document.createElement('canvas');
      surface.width = 180; surface.height = 240;
      const painter = surface.getContext('2d');
      painter.drawImage(assets[who], 0, 0, 180, 240);
      avatarCache[who] = surface;
    }
  }
  function resizeCanvas(fresh = false) {
    const rect = $('game-board').getBoundingClientRect();
    screenWidth = Math.max(1, rect.width - $('game-board').clientLeft * 2);
    screenHeight = Math.max(1, $('game-board').clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(screenWidth * dpr);
    canvas.height = Math.round(screenHeight * dpr);
    if (fresh) {
      // At least 420 units wide and 600 tall; no stretched characters on phones.
      const unit = Math.min(screenWidth / 420, screenHeight / 600);
      engine = new FlightEngine({ width: screenWidth / unit, height: screenHeight / unit, difficulty });
      buildSceneCache();
    }
    if (!engine) return;
    scale = Math.min(screenWidth / engine.width, screenHeight / engine.height);
    offsetX = (screenWidth - engine.width * scale) / 2;
    offsetY = (screenHeight - engine.height * scale) / 2;
  }
  function startFlight() {
    if (!initialized) return false;
    unlockAudio();
    character = store.data.character;
    difficulty = store.data.settings.difficulty;
    previousBest = store.best(character, difficulty);
    newRecord = false;
    active = true;
    document.body.classList.add('playing');
    $('home').hidden = true;
    $('game-screen').hidden = false;
    $('pause-overlay').hidden = true;
    $('game-over').hidden = true;
    $('ready').hidden = false;
    $('pause').disabled = false;
    $('pause').setAttribute('aria-label', 'Pause game');
    $('live-score').textContent = '0';
    $('live-best').textContent = previousBest;
    $('ready-name').textContent = names[character];
    $('flying-name').textContent = names[character];
    $('result-buddy').src = 'assets/' + character + '.png';
    particles = []; lastScore = 0; lastSecond = -1;
    accumulator = 0; lastTime = 0;
    resizeCanvas(true);
    canvas.focus({ preventScroll: true });
    updateHUD();
    announce('Ready, ' + names[character] + '. Tap or press Space to start.');
    return true;
  }
  function returnHome() {
    active = false;
    if (engine && engine.state === 'playing') engine.pause();
    $('game-screen').hidden = true;
    $('home').hidden = false;
    document.body.classList.remove('playing');
    refreshHome();
    $('play').focus({ preventScroll: true });
  }
  function pauseFlight(cause = 'button') {
    if (!active || !engine.pause()) return;
    pauseCause = cause;
    $('ready').hidden = true;
    $('pause-overlay').hidden = false;
    $('pause').setAttribute('aria-label', 'Resume game');
    accumulator = 0;
    $('resume').focus({ preventScroll: true });
    announce(cause === 'visibility' ? 'Flight paused while you were away.' : 'Flight paused.');
  }
  function resumeFlight() {
    if (!engine || !engine.resume()) return;
    $('pause-overlay').hidden = true;
    $('ready').hidden = engine.state !== 'ready';
    $('pause').setAttribute('aria-label', 'Pause game');
    lastTime = 0; accumulator = 0; pauseCause = '';
    unlockAudio();
    canvas.focus({ preventScroll: true });
    announce(engine.state === 'ready' ? 'Tap to take off.' : 'Keep flying.');
  }
  function flap() {
    if (!active || !engine.flap()) return;
    $('ready').hidden = true;
    unlockAudio();
    tone(470, 730, .075, .016);
    if (!store.data.settings.gentle) {
      for (let i = 0; i < 4; i++) particles.push({ x: engine.player.x - 17, y: engine.player.y + 9, vx: -35 - Math.random() * 35, vy: (Math.random() - .5) * 45, life: .35, maxLife: .35, size: 2 + Math.random() * 3 });
    }
  }
  function finishFlight() {
    // Record on every passed pipe as well, so closing a tab mid-flight is safe.
    newRecord = store.record(character, difficulty, engine.score) || newRecord;
    $('ready').hidden = true;
    $('pause').disabled = true;
    $('final-score').textContent = engine.score;
    $('final-best').textContent = store.best(character, difficulty);
    $('result-kicker').textContent = newRecord ? 'NEW PERSONAL BEST!' : 'NICE FLIGHT!';
    $('result-message').textContent = newRecord ? names[character] + ' has a new ' + MODES[difficulty].label.toLowerCase() + ' record.' : engine.score === 0 ? 'Short, steady taps. You’ve got this.' : 'Can you make it one pipe further?';
    $('game-over').hidden = false;
    $('retry').focus({ preventScroll: true });
    tone(280, 110, .3, .045);
    announce('Flight over. Score ' + engine.score + '. Best ' + store.best(character, difficulty) + '.');
    refreshHome();
  }
  function updateHUD() {
    if (engine.score !== lastScore) {
      $('live-score').textContent = engine.score;
      const record = store.record(character, difficulty, engine.score);
      newRecord = newRecord || record;
      $('live-best').textContent = store.best(character, difficulty);
      tone(740, 980, .14, .035);
      tone(980, 1240, .14, .025, .1);
      lastScore = engine.score;
    }
    const second = Math.floor(engine.elapsed);
    if (second !== lastSecond) {
      $('flight-time').textContent = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
      lastSecond = second;
    }
  }

  function pipeSegment(x, y, width, height, capAtBottom) {
    if (height <= 0) return;
    const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, '#114b47'); gradient.addColorStop(.12, '#24927c');
    gradient.addColorStop(.35, '#75d5a8'); gradient.addColorStop(.65, '#32a886'); gradient.addColorStop(1, '#12675e');
    ctx.fillStyle = gradient; ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#154e49'; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = '#c7ffe37a'; ctx.fillRect(x + 9, y, 4, height);
    const capY = capAtBottom ? y + height - 23 : y;
    const cap = ctx.createLinearGradient(0, capY, 0, capY + 23);
    cap.addColorStop(0, '#e9dc83'); cap.addColorStop(.22, '#fff3b0'); cap.addColorStop(.45, '#cfc165'); cap.addColorStop(1, '#aaa04e');
    ctx.fillStyle = cap; ctx.fillRect(x - 5, capY, width + 10, 23);
    ctx.strokeStyle = '#675b2f'; ctx.lineWidth = 2.5; ctx.strokeRect(x - 5, capY, width + 10, 23);
    ctx.fillStyle = '#fff8cc'; ctx.fillRect(x - 2, capY + 3, width + 4, 3);
  }
  function draw(now) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#184c51'; ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
    const W = engine.width, H = engine.height;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    const scene = engine.scene;
    const phase = engine.elapsed % 20;
    const switching = engine.elapsed >= 20 && phase < 1.1 && !store.data.settings.gentle;
    if (switching) {
      ctx.drawImage(sceneCache[1 - scene], 0, 0, W, H);
      ctx.globalAlpha = phase / 1.1;
      ctx.drawImage(sceneCache[scene], 0, 0, W, H);
      ctx.globalAlpha = 1;
    } else ctx.drawImage(sceneCache[scene], 0, 0, W, H);
    const shade = ctx.createLinearGradient(0, 0, 0, 170);
    shade.addColorStop(0, '#103e4270'); shade.addColorStop(1, '#103e4200');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, 170);
    for (const pipe of engine.pipes) {
      pipeSegment(pipe.x, -4, engine.pipeWidth, pipe.top + 4, true);
      pipeSegment(pipe.x, pipe.bottom, engine.pipeWidth, H - pipe.bottom, false);
    }
    const floorY = H - engine.groundHeight;
    ctx.fillStyle = '#205b58'; ctx.fillRect(0, floorY, W, engine.groundHeight);
    ctx.fillStyle = '#f5e4a1'; ctx.fillRect(0, floorY, W, 6);
    ctx.fillStyle = '#b5cc91'; ctx.fillRect(0, floorY + 6, W, 4);
    ctx.fillStyle = '#ffffff16';
    const shift = engine.distance % 28;
    for (let x = -28; x < W + 28; x += 28) ctx.fillRect(x - shift, floorY + 16, 13, 3);
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = '#fff7b7'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const p = engine.player;
    const idle = engine.state === 'ready' && !store.data.settings.gentle;
    const bob = idle ? Math.sin(now / 300) * 5 : 0;
    const angle = engine.state === 'playing' || engine.state === 'over' ? Math.max(-.28, Math.min(.7, p.vy / 800)) : -.08;
    ctx.save(); ctx.translate(p.x, p.y + bob);
    if (!store.data.settings.gentle) ctx.rotate(angle);
    ctx.shadowColor = '#173e4670'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
    // Transparent originals are downsampled once in memory for smooth rendering.
    ctx.drawImage(avatarCache[character], -29, -43, 58, 77.33);
    ctx.restore(); ctx.restore();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!active || !engine || document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .08) : 0;
    lastTime = now;
    if (engine.state === 'playing') {
      accumulator += dt;
      while (accumulator >= step && engine.state === 'playing') {
        engine.update(step);
        for (const p of particles) { p.x += p.vx * step; p.y += p.vy * step; p.life -= step; }
        particles = particles.filter(p => p.life > 0);
        accumulator -= step;
      }
      updateHUD();
      if (engine.state === 'over') finishFlight();
    }
    draw(now);
  }

  function openSettings() {
    $('reset-confirm').hidden = true;
    $('reset-scores').hidden = false;
    $('fullscreen-note').textContent = '';
    $('fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
    applySettings();
    $('settings').showModal();
  }
  function wireEvents() {
    document.querySelectorAll('[data-character]').forEach(button => button.addEventListener('click', () => { unlockAudio(); chooseBuddy(button.dataset.character); tone(560, 740, .1, .02); }));
    $('play').addEventListener('click', startFlight);
    $('retry').addEventListener('click', startFlight);
    $('pause-restart').addEventListener('click', startFlight);
    $('result-home').addEventListener('click', returnHome);
    $('pause-home').addEventListener('click', returnHome);
    $('game-home').addEventListener('click', () => {
      if (engine.state === 'over' || engine.state === 'ready') returnHome();
      else if (engine.state !== 'paused') pauseFlight('menu');
    });
    $('pause').addEventListener('click', () => engine.state === 'paused' ? resumeFlight() : pauseFlight());
    $('resume').addEventListener('click', resumeFlight);
    canvas.addEventListener('pointerdown', event => { if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return; event.preventDefault(); canvas.focus({ preventScroll: true }); flap(); });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('keydown', event => {
      if (!active || $('settings').open) return;
      if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
        // A focused dialog button retains native keyboard activation.
        if (event.target.closest('button,select,input')) return;
        event.preventDefault(); if (!event.repeat) flap();
      } else if (event.code === 'KeyP' || event.code === 'Escape') {
        event.preventDefault();
        if (event.repeat) return;
        if (engine.state === 'paused') resumeFlight(); else pauseFlight();
      }
    });
    // Losing focus never costs a life; resuming always needs an explicit action.
    document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseFlight('visibility'); void store.save(); } });
    window.addEventListener('blur', () => pauseFlight('visibility'));
    window.addEventListener('pagehide', () => { void store.save(); });
    let resizeTimer;
    window.addEventListener('resize', () => {
      if (!active) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!active) return;
        if (engine.state === 'playing') pauseFlight('resize');
        // Preserve the existing world/score; letterbox after rotation if needed.
        resizeCanvas(engine.state === 'ready');
      }, 100);
    });
    $('open-settings').addEventListener('click', openSettings);
    for (const id of ['close-settings', 'done-settings']) $(id).addEventListener('click', () => $('settings').close());
    $('settings').addEventListener('click', event => { if (event.target === $('settings')) { const box = $('settings').getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('settings').close(); } });
    $('difficulty').addEventListener('change', event => { store.data.settings.difficulty = event.target.value; void store.save(); refreshHome(); });
    $('sound').addEventListener('change', event => { store.data.settings.sound = event.target.checked; void store.save(); if (event.target.checked) { unlockAudio(); tone(600, 880, .16); } });
    $('motion').addEventListener('change', event => { store.data.settings.gentle = event.target.checked; void store.save(); applySettings(); });
    $('fullscreen').addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else throw new Error('unsupported');
        $('fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
      } catch (_) { $('fullscreen-note').textContent = 'Fullscreen is unavailable here. You can still play normally; portrait works best on phones.'; }
    });
    $('reset-scores').addEventListener('click', () => { $('reset-confirm').hidden = false; $('reset-scores').hidden = true; $('cancel-reset').focus(); });
    $('cancel-reset').addEventListener('click', () => { $('reset-confirm').hidden = true; $('reset-scores').hidden = false; $('reset-scores').focus(); });
    $('confirm-reset').addEventListener('click', async () => {
      $('confirm-reset').disabled = true;
      await store.resetScores(); refreshHome();
      $('confirm-reset').disabled = false; $('reset-confirm').hidden = true; $('reset-scores').hidden = false;
      $('reset-scores').focus(); announce('High scores reset.');
    });
    $('reload').addEventListener('click', () => location.reload());
  }

  function registerAgentTools() {
    // Optional progressive enhancement. Unsupported browsers simply skip this.
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const definitions = [
      { name: 'read_flying_buddies_state', description: 'Read selected buddy, difficulty, saved bests, and current flight state.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute() { return { buddy: store.data.character, difficulty: store.data.settings.difficulty, best: store.overallBest, screen: active ? engine.state : 'home', score: active ? engine.score : null }; } },
      { name: 'select_flying_buddy', description: 'Choose Mithai or Riaan on the home screen. Does not start a flight.', inputSchema: { type: 'object', properties: { buddy: { type: 'string', enum: ['mithai', 'riaan'] } }, required: ['buddy'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { if (!input || Object.keys(input).length !== 1 || !names[input.buddy]) throw new Error('Provide only a valid buddy.'); chooseBuddy(input.buddy); return { selected: store.data.character }; } }
    ];
    for (const definition of definitions) {
      try { void Promise.resolve(context.registerTool(definition, { signal: lifecycle.signal })).catch(() => {}); } catch (_) { /* Optional API. */ }
    }
    window.addEventListener('pagehide', event => { if (!event.persisted) lifecycle.abort(); }, { once: true });
  }

  async function boot() {
    wireEvents();
    if (!ctx) throw new Error('This browser does not support Canvas 2D. Please use a current Chrome, Edge, Firefox, or Safari.');
    store.onStatus = storageStatus;
    const sources = { background1: 'background-1.png', background2: 'background-2.png', mithai: 'mithai.png', riaan: 'riaan.png', logo: 'logo.png' };
    let loaded = 0;
    await Promise.all([
      store.init(),
      new Promise(resolve => setTimeout(resolve, 650)),
      ...Object.entries(sources).map(([key, file]) => new Promise((resolve, reject) => {
        const img = new Image();
        const timer = setTimeout(() => reject(new Error('Could not load ' + file + '. Extract the complete ZIP, including the assets folder.')), 20000);
        img.onload = () => { clearTimeout(timer); assets[key] = img; loaded++; $('loading-fill').style.width = (loaded / 5 * 100) + '%'; $('loading-status').textContent = 'Getting ready… ' + loaded + '/5'; resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Missing image: ' + file + '. Extract the complete ZIP, including the assets folder.')); };
        img.src = 'assets/' + file;
      }))
    ]);
    buildAvatarCache(); applySettings(); storageStatus();
    initialized = true;
    $('loading').hidden = true; $('app').hidden = false;
    registerAgentTools();
    requestAnimationFrame(frame);
  }
  boot().catch(error => { $('loading-status').textContent = error.message || 'The game could not load. Extract all files and try again.'; $('reload').hidden = false; });
})();
