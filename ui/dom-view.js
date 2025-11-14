    showEndCard(score, streakCurrent = 0, streakBest = 0, extraMeta = {}) {
      document.querySelector('.ws-endcard')?.remove();

      const wrap = document.createElement('div');
      wrap.className = 'ws-endcard';

      const answer = extraMeta.answer || null;
      const meta = extraMeta.meta || null;
      const def = meta?.def ?? meta?.definition ?? null;

      let defHtml = '';
      if (answer) {
        const safeAns = String(answer).toUpperCase();
        if (def) {
          defHtml = `
            <div class="ws-answer-def">
              <div class="ws-answer-word">${safeAns}</div>
              <div class="ws-answer-def-text">${def}</div>
            </div>
          `;
        } else {
          defHtml = `
            <div class="ws-answer-def">
              <div class="ws-answer-word">${safeAns}</div>
            </div>
          `;
        }
      }

      wrap.innerHTML = `
        <div class="card">
          <h3>Daily WordHive Complete 🎉</h3>
          <p>Your total score: <strong>${score}</strong></p>
          <p>Streak: <strong>${streakCurrent}</strong> day(s) • Best: <strong>${streakBest}</strong></p>
          ${defHtml}
          <div class="row">
            <button class="ws-btn primary" data-action="share">Share Score</button>
            <button class="ws-btn" data-action="copy">Copy Score</button>
            <button class="ws-btn" data-action="close">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(wrap);

      const shareText = `I just finished today's WordHive (4→7 letters) with ${score} points! Streak: ${streakCurrent} (best ${streakBest}).`;

      wrap.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const act = btn.dataset.action;

        if (act === 'close') {
          wrap.remove();
        }

        if (act === 'copy') {
          try {
            await navigator.clipboard.writeText(shareText);
            btn.textContent = 'Copied!';
          } catch {
            btn.textContent = 'Copy failed';
          }
        }

        if (act === 'share') {
          if (navigator.share) {
            try {
              await navigator.share({ text: shareText });
            } catch {
              // user cancelled or share failed – ignore
            }
          } else {
            try {
              await navigator.clipboard.writeText(shareText);
              btn.textContent = 'Copied!';
            } catch {
              btn.textContent = 'Share not supported';
            }
          }
        }
      }, { passive: true });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          wrap.remove();
        }
      }, { once: true });
    },

    /* ---------- Modals ---------- */
    showRulesModal() {
      document.querySelector('.ws-modal')?.remove();
      const wrap = document.createElement('div');
      wrap.className = 'ws-modal';

      const exampleRowHTML = `
        <div class="ws-row" style="display:grid;grid-template-columns:repeat(5,var(--tileSize));gap:8px;margin-top:8px;">
          <div class="ws-tile filled state-correct">P</div>
          <div class="ws-tile filled state-present">L</div>
          <div class="ws-tile filled state-absent">A</div>
          <div class="ws-tile filled state-absent">N</div>
          <div class="ws-tile filled state-present">T</div>
        </div>
      `;

      wrap.innerHTML = `
        <div class="card" role="dialog" aria-label="How to play WordHive">
          <h3>How to Play 🧩</h3>
          <p>Climb through <strong>4 levels</strong> of daily WordHive puzzles — from 4-letter to 7-letter words. You have <strong>6 tries</strong> per level.</p>
          <ul style="margin:6px 0 0 18px; color:var(--muted); line-height:1.5;">
            <li>Type or tap to guess a word of the current length.</li>
            <li>Tiles turn <strong>green</strong> (correct spot) or <strong>yellow</strong> (in word, wrong spot).</li>
            <li>Beat a level to advance to the next length.</li>
            <li>Keep your <strong>🔥 streak</strong> by playing each day.</li>
          </ul>
          ${exampleRowHTML}
          <div class="row" style="margin-top:10px;">
            <button class="ws-btn primary" data-action="close">Got it</button>
          </div>
        </div>
      `;
      document.body.appendChild(wrap);

      wrap.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (btn?.dataset.action === 'close' || e.target === wrap) {
          wrap.remove();
        }
      }, { passive: true });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          wrap.remove();
        }
      }, { once: true });
    },

    showSettingsModal() {
      document.querySelector('.ws-modal')?.remove();
      const wrap = document.createElement('div');
      wrap.className = 'ws-modal';

      const sound = localStorage.getItem('ws_sound') !== '0';
      const themePref = (localStorage.getItem('ws_theme') || 'dark');

      wrap.innerHTML = `
        <div class="card" role="dialog" aria-label="Settings">
          <h3>Settings ⚙️</h3>
          <div class="ws-form">
            <div class="ws-field">
              <label for="ws-theme">Theme</label>
              <select id="ws-theme">
                <option value="dark"  ${themePref === 'dark' ? 'selected' : ''}>Dark</option>
                <option value="light" ${themePref === 'light' ? 'selected' : ''}>Light</option>
                <option value="auto"  ${themePref === 'auto' ? 'selected' : ''}>Auto (system)</option>
              </select>
            </div>
            <div class="ws-field">
              <label for="ws-sound">Sound effects</label>
              <input id="ws-sound" type="checkbox" ${sound ? 'checked' : ''}/>
            </div>
          </div>
          <div class="row">
            <button class="ws-btn primary" data-action="save">Save</button>
            <button class="ws-btn" data-action="close">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(wrap);

      wrap.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) {
          if (e.target === wrap) wrap.remove();
          return;
        }

        const act = btn.dataset.action;

        if (act === 'save') {
          const theme = wrap.querySelector('#ws-theme').value;
          const s = wrap.querySelector('#ws-sound').checked;
          try {
            Theme.setPref(theme);
            Theme.apply(theme);
            localStorage.setItem('ws_sound', s ? '1' : '0');
          } catch {}

          btn.textContent = 'Saved';
          setTimeout(() => wrap.remove(), 420);
        }

        if (act === 'close') {
          wrap.remove();
        }
      }, { passive: true });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          wrap.remove();
        }
      }, { once: true });
    },
  };

  global.WordscendUI = UI;
})(window);
