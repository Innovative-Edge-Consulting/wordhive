// /ui/dom-view.js
(function (global) {
  const UI = {
    mount(rootEl, config) {
      if (!rootEl) {
        console.warn('[Wordscend] No mount element provided.');
        return;
      }
      this.root = rootEl;
      this.config = config;
      this.renderGrid();
      this.bindKeyboard();
      console.log('[Wordscend] Grid rendered:', config.rows, 'rows ×', config.cols);
    },

    renderGrid() {
      const board = global.WordscendEngine.getBoard();
      const cursor = global.WordscendEngine.getCursor();

      // Build grid
      const grid = document.createElement('div');
      grid.className = 'ws-grid';

      for (let r = 0; r < board.length; r++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'ws-row';

        const row = board[r];
        for (let c = 0; c < row.length; c++) {
          const tile = document.createElement('div');
          tile.className = 'ws-tile';
          const ch = row[c] || '';
          tile.textContent = ch;

          // Visual cues
          if (ch) tile.classList.add('filled');
          if (r === cursor.row && c === cursor.col) {
            tile.classList.add('active');
          }

          tile.setAttribute('data-row', r);
          tile.setAttribute('data-col', c);
          rowEl.appendChild(tile);
        }

        // If a previous row was submitted, lock it (just a visual hint for now)
        if (r < cursor.row) rowEl.classList.add('ws-locked');

        grid.appendChild(rowEl);
      }

      // Replace previous grid
      this.root.innerHTML = '';
      this.root.appendChild(grid);
    },

    bindKeyboard() {
      // Prevent multiple bindings
      if (this._bound) return;
      this._bound = true;

      window.addEventListener('keydown', (e) => {
        const key = e.key;

        if (/^[A-Za-z]$/.test(key)) {
          const ok = global.WordscendEngine.addLetter(key);
          if (ok) this.renderGrid();
          return;
        }

        if (key === 'Backspace') {
          const ok = global.WordscendEngine.backspace();
          if (ok) this.renderGrid();
          return;
        }

        if (key === 'Enter') {
          const res = global.WordscendEngine.submitRow();
          if (!res.ok && res.reason === 'incomplete') {
            this.shakeCurrentRow();
            return;
          }
          // row advanced
          this.renderGrid();
          return;
        }
      });
    },

    shakeCurrentRow() {
      const cursor = global.WordscendEngine.getCursor();
      const rows = this.root.querySelectorAll('.ws-row');
      const rowEl = rows[cursor.row];
      if (!rowEl) return;
      rowEl.classList.remove('shake');
      // reflow trick to restart animation
      void rowEl.offsetWidth;
      rowEl.classList.add('shake');
      setTimeout(() => rowEl.classList.remove('shake'), 400);
    }
  };

  global.WordscendUI = UI;
})(window);
