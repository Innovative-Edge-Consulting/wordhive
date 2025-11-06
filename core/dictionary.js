// /core/dictionary.js
(function (global) {
  const Dict = {
    allowed: null,
    answers: null,

    async loadLists(baseUrl) {
      async function loadText(url) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return null;
          const text = await res.text();
          return text
            .split(/\r?\n/)
            .map(s => s.trim().toUpperCase())
            .filter(Boolean);
        } catch {
          return null;
        }
      }

      const allowed = await loadText(`${baseUrl}/allowed.txt`);
      const answers = await loadText(`${baseUrl}/answers.txt`);

      // Fallback tiny lists so dev doesn’t break if files missing
      this.allowed = allowed || ['ABOUT','OTHER','WHICH','CRANE','ROUTE','ALERT','TRAIN','PLANT','SHEEP'];
      this.answers = answers || ['CRANE','ROUTE','ALERT','PLANT','SHEEP'];

      return { allowed: this.allowed, answers: this.answers };
    },

    pickToday(list) {
      const now = new Date();
      const epoch = new Date('2025-01-01T00:00:00Z');
      const dayIndex = Math.floor((now - epoch) / 86400000);
      return list[dayIndex % list.length];
    }
  };

  global.WordscendDictionary = Dict;
  console.log('[Wordscend] Dictionary loader ready.');
})(window);
