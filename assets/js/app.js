// Simple “handshake” test so you KNOW JS is loaded & DOM is reachable
(function () {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = '✅ JS connected!';
  } else {
    console.warn('Status element not found.');
  }

  const btn = document.getElementById('ping');
  if (btn) {
    btn.addEventListener('click', () => {
      alert('JS event listeners working!');
    });
  }

  // Tiny debug log so you can see it in the browser console
  console.log('[Wordle-like] app.js loaded and running.');
})();

