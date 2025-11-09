// /core/engine.js
(function (global) {
  const STATE = {
    rows: 6,
    cols: 5,
    board: [],
    rowMarks: [],
    cursor: { row: 0, col: 0 },
    done: false,
    win: false,
    answer: 'APPLE',
    allowed: new Set(),
    keyStatus: {}, // letter -> 'correct' | 'present' | 'absent'
  };

  function init(cfg) {
    STATE.rows = cfg.rows || 6;
    STATE.cols = cfg.cols || 5;
    STATE.board = Array.from({ length: STATE.rows }, () => Array(STATE.cols).fill(''));
    STATE.rowMarks = Array.from({ length: STATE.rows }, () => Array(STATE.cols).fill(null));
    STATE.cursor = { row: 0, col: 0 };
    STATE.done = false;
    STATE.win = false;
    STATE.keyStatus = {};
    return { rows: STATE.rows, cols: STATE.cols };
  }

  function setAnswer(word) { STATE.answer = (word || '').toUpperCase(); }
  function setAllowed(set) { STATE.allowed = set || new Set(); }

  function getBoard() { return STATE.board.map(r => r.slice()); }
  function getRowMarks(){ return STATE.rowMarks.map(r => r.slice()); }
  function getCursor(){ return { row: STATE.cursor.row, col: STATE.cursor.col }; }
  function isDone(){ return STATE.done; }

  function getKeyStatus(){ return { ...STATE.keyStatus }; }

  function serializeState() {
    return {
      rows: STATE.rows,
      cols: STATE.cols,
      board: STATE.board.map(row => row.map(ch => (ch || '').toUpperCase())),
      rowMarks: STATE.rowMarks.map(row => row.map(mark => (mark === 'correct' || mark === 'present' || mark === 'absent') ? mark : null)),
      cursor: { row: STATE.cursor.row, col: STATE.cursor.col },
      done: STATE.done,
      win: STATE.win,
      answer: STATE.answer,
      keyStatus: { ...STATE.keyStatus }
    };
  }

  function hydrateState(saved) {
    if (!saved || typeof saved !== 'object') return false;
    if (saved.rows !== STATE.rows || saved.cols !== STATE.cols) return false;

    try {
      const board = Array.from({ length: STATE.rows }, (_, r) => {
        const row = Array.isArray(saved.board?.[r]) ? saved.board[r] : [];
        return Array.from({ length: STATE.cols }, (_, c) => {
          const ch = row[c];
          if (typeof ch === 'string' && /^[A-Za-z]$/.test(ch.charAt(0))) {
            return ch.charAt(0).toUpperCase();
          }
          return '';
        });
      });

      const rowMarks = Array.from({ length: STATE.rows }, (_, r) => {
        const row = Array.isArray(saved.rowMarks?.[r]) ? saved.rowMarks[r] : [];
        return Array.from({ length: STATE.cols }, (_, c) => {
          const mark = row[c];
          return (mark === 'correct' || mark === 'present' || mark === 'absent') ? mark : null;
        });
      });

      const cursorRow = Math.min(Math.max(parseInt(saved.cursor?.row, 10) || 0, 0), STATE.rows - 1);
      const cursorCol = Math.min(Math.max(parseInt(saved.cursor?.col, 10) || 0, 0), STATE.cols);

      const keyStatus = {};
      if (saved.keyStatus && typeof saved.keyStatus === 'object') {
        Object.entries(saved.keyStatus).forEach(([key, val]) => {
          const upper = String(key || '').toUpperCase();
          if (!/^[A-Z]$/.test(upper)) return;
          if (val === 'correct' || val === 'present' || val === 'absent') {
            keyStatus[upper] = val;
          }
        });
      }

      STATE.board = board;
      STATE.rowMarks = rowMarks;
      STATE.cursor = { row: cursorRow, col: cursorCol };
      STATE.done = !!saved.done;
      STATE.win = !!saved.win;
      if (typeof saved.answer === 'string' && saved.answer) {
        STATE.answer = saved.answer.toUpperCase();
      }
      STATE.keyStatus = keyStatus;
      return true;
    } catch {
      return false;
    }
  }

  function addLetter(ch) {
    if (STATE.done) return false;
    ch = (ch || '').toUpperCase();
    if (!/^[A-Z]$/.test(ch)) return false;
    const { row, col } = STATE.cursor;
    if (col >= STATE.cols) return false;
    STATE.board[row][col] = ch;
    STATE.cursor.col = Math.min(STATE.cols, col + 1);
    return true;
  }

  function backspace() {
    if (STATE.done) return false;
    const { row, col } = STATE.cursor;
    if (col === 0) return false;
    STATE.cursor.col = col - 1;
    STATE.board[row][STATE.cursor.col] = '';
    return true;
  }

  function evaluateRow(guess) {
    const ans = STATE.answer.split('');
    const g = guess.slice();

    // mark counts for answer letters
    const counts = {};
    ans.forEach(ch => { counts[ch] = (counts[ch] || 0) + 1; });

    const marks = Array(STATE.cols).fill('absent');

    // First pass: correct
    for (let i = 0; i < STATE.cols; i++) {
      if (g[i] === ans[i]) {
        marks[i] = 'correct';
        counts[g[i]] -= 1;
      }
    }

    // Second pass: present
    for (let i = 0; i < STATE.cols; i++) {
      if (marks[i] === 'correct') continue;
      const ch = g[i];
      if (counts[ch] > 0) {
        marks[i] = 'present';
        counts[ch] -= 1;
      }
    }
    return marks;
  }

  function updateKeyStatus(guess, marks) {
    for (let i = 0; i < guess.length; i++) {
      const ch = guess[i];
      const mark = marks[i];
      const current = STATE.keyStatus[ch];
      if (mark === 'correct') {
        STATE.keyStatus[ch] = 'correct';
      } else if (mark === 'present') {
        if (current !== 'correct') STATE.keyStatus[ch] = 'present';
      } else { // absent
        if (!current) STATE.keyStatus[ch] = 'absent';
      }
    }
  }

  function submitRow() {
    if (STATE.done) return { ok:false, reason:'done' };

    const row = STATE.cursor.row;
    if (STATE.cursor.col < STATE.cols) {
      return { ok:false, reason:'incomplete', attempt: row+1 };
    }

    const guess = STATE.board[row].join('');
    const dict = window.WordscendDictionary;
    const allowed = dict && typeof dict.isAllowedGuess === 'function'
      ? dict.isAllowedGuess(guess)
      : STATE.allowed.has(guess);
    if (!allowed) {
      return { ok:false, reason:'invalid', attempt: row+1 };
    }

    const marks = evaluateRow(STATE.board[row]);
    STATE.rowMarks[row] = marks.slice();
    updateKeyStatus(STATE.board[row], marks);

    const win = marks.every(m => m === 'correct');
    let done = false;

    if (win) {
      STATE.done = true;
      STATE.win = true;
      done = true;
    } else if (row === STATE.rows - 1) {
      STATE.done = true;
      STATE.win = false;
      done = true;
    } else {
      STATE.cursor = { row: row + 1, col: 0 };
    }

    return {
      ok: true,
      attempt: row + 1,
      done,
      win: win,
      marks: marks.slice()
    };
  }

  global.WordscendEngine = {
    init, setAnswer, setAllowed,
    getBoard, getRowMarks, getCursor, isDone,
    addLetter, backspace, submitRow,
    getKeyStatus, serializeState, hydrateState
  };
})(window);
