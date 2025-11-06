// /core/engine.js
(function (global) {
  function createEmptyBoard(rows, cols) {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
  }

  const Engine = {
    rows: 6,
    cols: 5,

    init() {
      this.board = createEmptyBoard(this.rows, this.cols); // 2D array of letters
      this.currentRow = 0;
      this.currentCol = 0;
      // later: this.answer = 'CRANE' (we'll add dictionary + answers soon)
      return this.getConfig();
    },

    getConfig() {
      return { rows: this.rows, cols: this.cols };
    },

    getBoard() {
      return this.board;
    },

    getCursor() {
      return { row: this.currentRow, col: this.currentCol };
    },

    canType() {
      return this.currentRow < this.rows;
    },

    addLetter(ch) {
      if (!this.canType()) return false;
      if (this.currentCol >= this.cols) return false;
      if (!/^[A-Za-z]$/.test(ch)) return false;
      this.board[this.currentRow][this.currentCol] = ch.toUpperCase();
      this.currentCol += 1;
      return true;
    },

    backspace() {
      if (!this.canType()) return false;
      if (this.currentCol === 0) return false;
      this.currentCol -= 1;
      this.board[this.currentRow][this.currentCol] = '';
      return true;
    },

    rowComplete() {
      return this.board[this.currentRow].every((c) => c && c.length === 1);
    },

    submitRow() {
      // For now, just move to next row if complete. We'll add validation later.
      if (!this.rowComplete()) return { ok: false, reason: 'incomplete' };
      const guess = this.board[this.currentRow].join('');
      // later: evaluate guess vs answer here
      this.currentRow += 1;
      this.currentCol = 0;
      return { ok: true, guess };
    }
  };

  // Initialize default state once on load
  Engine.init();

  global.WordscendEngine = Engine;
  console.log('[Wordscend] Engine ready:', Engine.getConfig());
})(window);
