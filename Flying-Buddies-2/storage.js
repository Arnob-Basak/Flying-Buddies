/* IndexedDB is primary; localStorage mirrors writes and supports file:// browsers.
   If both are blocked, a game remains playable with temporary in-memory scores. */
(function (root) {
  'use strict';
  const KEY = 'flying-buddies-save-v1';
  const characters = ['mithai', 'riaan'];
  const modes = ['easy', 'classic', 'hard'];
  const defaults = () => ({ version: 1, character: 'mithai', settings: {
    difficulty: 'classic', sound: true, gentle: Boolean(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, scores: { mithai: { easy: 0, classic: 0, hard: 0 }, riaan: { easy: 0, classic: 0, hard: 0 } } });
  function clean(input) {
    const value = defaults();
    if (!input || typeof input !== 'object') return value;
    if (characters.includes(input.character)) value.character = input.character;
    if (modes.includes(input.settings?.difficulty)) value.settings.difficulty = input.settings.difficulty;
    for (const key of ['sound', 'gentle']) if (typeof input.settings?.[key] === 'boolean') value.settings[key] = input.settings[key];
    for (const who of characters) for (const mode of modes) {
      const score = input.scores?.[who]?.[mode];
      if (Number.isSafeInteger(score) && score >= 0) value.scores[who][mode] = score;
    }
    return value;
  }
  class BuddyStore {
    constructor() { this.data = defaults(); this.db = null; this.localWorks = false; this.backend = 'memory'; this.onStatus = null; this.writeQueue = Promise.resolve(); }
    async init() {
      let mirror = null;
      try {
        mirror = JSON.parse(root.localStorage.getItem(KEY));
        root.localStorage.setItem(KEY, JSON.stringify(clean(mirror)));
        this.localWorks = true;
      } catch (_) { /* Private/blocked storage: try IndexedDB next. */ }
      this.data = clean(mirror);
      const db = await new Promise(resolve => {
        let finished = false;
        const finish = value => { if (finished) { if (value) value.close(); return; } finished = true; clearTimeout(timeout); resolve(value); };
        const timeout = setTimeout(() => finish(null), 1800);
        try {
          const request = root.indexedDB.open('FlyingBuddies', 1);
          request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves'); };
          request.onsuccess = () => finish(request.result);
          request.onerror = () => finish(null);
          request.onblocked = () => finish(null);
        } catch (_) { finish(null); }
      });
      this.db = db;
      if (db) {
        const stored = await new Promise(resolve => {
          const timeout = setTimeout(() => resolve(null), 1200);
          try {
            const request = db.transaction('saves', 'readonly').objectStore('saves').get('player');
            request.onsuccess = () => { clearTimeout(timeout); resolve(request.result || null); };
            request.onerror = () => { clearTimeout(timeout); resolve(null); };
          } catch (_) { clearTimeout(timeout); resolve(null); }
        });
        // The mirror is written synchronously before every IDB write; prefer it
        // when available so an interrupted write/reset cannot restore stale data.
        if (!mirror && stored) this.data = clean(stored);
        db.onversionchange = () => { db.close(); this.db = null; this.updateBackend(); };
      }
      this.updateBackend();
      await this.save();
      return this;
    }
    updateBackend() {
      this.backend = this.db ? 'indexedDB' : this.localWorks ? 'localStorage' : 'memory';
      if (this.onStatus) this.onStatus(this.backend);
    }
    save() {
      const snapshot = clean(this.data);
      try { root.localStorage.setItem(KEY, JSON.stringify(snapshot)); this.localWorks = true; } catch (_) { this.localWorks = false; }
      this.updateBackend();
      this.writeQueue = this.writeQueue.then(() => new Promise(resolve => {
        if (!this.db) return resolve();
        try {
          const tx = this.db.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(snapshot, 'player');
          tx.oncomplete = () => resolve();
          tx.onerror = tx.onabort = () => { if (this.db) this.db.close(); this.db = null; this.updateBackend(); resolve(); };
        } catch (_) { this.db = null; this.updateBackend(); resolve(); }
      }));
      return this.writeQueue;
    }
    best(character, difficulty) { return this.data.scores[character]?.[difficulty] || 0; }
    get overallBest() { return Math.max(...characters.flatMap(who => modes.map(mode => this.best(who, mode)))); }
    record(character, difficulty, score) {
      if (!characters.includes(character) || !modes.includes(difficulty) || !Number.isSafeInteger(score) || score < 0) return false;
      const isNew = score > this.best(character, difficulty);
      if (isNew) { this.data.scores[character][difficulty] = score; void this.save(); }
      return isNew;
    }
    resetScores() { this.data.scores = defaults().scores; return this.save(); }
  }
  root.BuddyStore = BuddyStore;
})(typeof window !== 'undefined' ? window : globalThis);
