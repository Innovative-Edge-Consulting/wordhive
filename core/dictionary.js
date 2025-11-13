// /core/dictionary.js
(function (global) {
  const Dictionary = {
    _answersByLen: new Map(),   // len -> string[]
    _allowedSet: new Set(),     // all allowed guesses (UPPERCASE)
    _metaByWord: new Map(),     // WORD -> { hint?, def? }

    async loadCustom(answersUrl, allowedUrl, opts = { minLen:4, maxLen:7 }) {
      const minLen = opts.minLen ?? 4;
      const maxLen = opts.maxLen ?? 7;

      // ---------- Load curated answers (JSON) ----------
      const answersJson = await fetch(answersUrl).then(r => {
        if (!r.ok) throw new Error('answers.json fetch failed');
        return r.json();
      });

      // ---------- Try to load big allowed dictionary ----------
      let allowedRaw = null; // can be: array (flat list), object (by length), or null
      try {
        if (allowedUrl) {
          const r = await fetch(allowedUrl);
          if (!r.ok) throw new Error('allowed fetch failed');
          const ct = (r.headers.get('Content-Type') || '').toLowerCase();

          if (ct.includes('application/json')) {
            // JSON format (e.g. { "4":[...], "5":[...], ... })
            allowedRaw = await r.json();
          } else {
            // Plain text: one word per line
            const txt = await r.text();
            const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            allowedRaw = lines; // flat list of strings
          }
        }
      } catch {
        // If allowedUrl fails, we’ll fall back to answers only
        allowedRaw = null;
      }

      // ---------- Helpers ----------
      const normWord = (w) => (String(w || '')).toUpperCase().trim();
      const isAlpha  = (w) => /^[A-Z]+$/.test(w);
      const isClean  = (w) =>
        isAlpha(w) &&
        w.length >= minLen &&
        w.length <= maxLen &&
        !/^([A-Z])\1+$/.test(w); // reject OOOO / AAAAA etc.

      const normalizeEntry = (entry) => {
        // entries from answers.json: string or { w, hint?, def? }
        if (typeof entry === 'string') {
          const w = normWord(entry);
          return w && isClean(w) ? { w } : null;
        }
        if (entry && typeof entry === 'object' && typeof entry.w === 'string') {
          const w = normWord(entry.w);
          if (!isClean(w)) return null;
          const rec = { w };
          if (entry.hint) rec.hint = String(entry.hint);
          if (entry.def)  rec.def  = String(entry.def);
          return rec;
        }
        return null;
      };

      this._answersByLen.clear();
      this._metaByWord = new Map();

      // ---------- Build answersByLen + meta from curated file ----------
      for (let L = minLen; L <= maxLen; L++) {
        const key   = String(L);
        const raw   = Array.isArray(answersJson[key]) ? answersJson[key] : [];
        const objs  = raw.map(normalizeEntry).filter(Boolean);
        const words = Array.from(new Set(objs.map(o => o.w))); // dedupe

        this._answersByLen.set(L, words);

        for (const o of objs) {
          if (o.hint || o.def) {
            this._metaByWord.set(o.w, { hint: o.hint, def: o.def });
          }
        }
      }

      // ---------- Build allowed set ----------
      const allowedAll = [];

      if (Array.isArray(allowedRaw)) {
        // Flat text/array list: one big list for all lengths
        for (const rawWord of allowedRaw) {
          const w = normWord(rawWord);
          if (!isClean(w)) continue;
          allowedAll.push(w);
        }
      } else if (allowedRaw && typeof allowedRaw === 'object') {
        // JSON by length: { "4":[...], "5":[...], ... }
        for (let L = minLen; L <= maxLen; L++) {
          const key = String(L);
          const src = Array.isArray(allowedRaw[key]) ? allowedRaw[key] : (answersJson[key] || []);
          const cleaned = src.map(normWord).filter(isClean);
          allowedAll.push(...cleaned);
        }
      } else {
        // No external allowed list -> fall back to curated answers only
        for (let L = minLen; L <= maxLen; L++) {
          const key = String(L);
          const src = answersJson[key] || [];
          const cleaned = src.map(normWord).filter(isClean);
          allowedAll.push(...cleaned);
        }
      }

      this._allowedSet = new Set(allowedAll);

      // Ensure all curated answers are allowed
      for (const list of this._answersByLen.values()) {
        for (const w of list) this._allowedSet.add(w);
      }

      return { answersByLen: this._answersByLen, allowedSet: this._allowedSet };
    },

    answersOfLength(len) { return this._answersByLen.get(len) || []; },
    get allowedSet() { return this._allowedSet; },
    getMeta(word) { return this._metaByWord.get((word || '').toUpperCase()) || null; },

    // Deterministic pick by date + length (stable daily answer)
    pickToday(list, seedStr) {
      if (!list || !list.length) return 'APPLE';
      const seed = (seedStr || this._todayKey()) + ':' + list[0].length;
      let h = 5381; // djb2-ish
      for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) + seed.charCodeAt(i);
      const idx = Math.abs(h) % list.length;
      return list[idx];
    },

    _todayKey() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    }
  };

  global.WordscendDictionary = Dictionary;
})(window);
