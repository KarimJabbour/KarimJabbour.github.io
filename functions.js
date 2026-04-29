document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const setTheme = (mode) => {
    const isDark = mode === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);
    if (themeToggle) themeToggle.checked = isDark;
  };

  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    setTheme(stored);
  } else {
    setTheme(prefersDark.matches ? 'dark' : 'light');
  }

  themeToggle?.addEventListener('change', (e) => {
    const next = e.target.checked ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  });

  // Tetris mode
  const tetrisLaunch = document.getElementById('tetris-launch');
  const tetrisOverlay = document.getElementById('tetris-overlay');
  const tetrisExit = document.getElementById('tetris-exit');
  const tetrisCanvas = document.getElementById('tetris-canvas');
  const tetrisScoreEl = document.getElementById('tetris-score');
  const tetrisLinesEl = document.getElementById('tetris-lines');
  const tetrisLevelEl = document.getElementById('tetris-level');
  const tetrisTouchButtons = document.querySelectorAll('.tetris-touch-btn');

  if (tetrisLaunch && tetrisOverlay && tetrisExit && tetrisCanvas) {
    const ctx = tetrisCanvas.getContext('2d');
    const cols = 10;
    const rows = 20;
    const block = 30;
    const colors = ['#38bdf8', '#f97316', '#facc15', '#22c55e', '#a855f7', '#ef4444', '#3b82f6'];
    const pieces = [
      [[1, 1, 1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]],
      [[1, 1], [1, 1]],
      [[0, 1, 1], [1, 1, 0]],
      [[0, 1, 0], [1, 1, 1]],
      [[1, 1, 0], [0, 1, 1]]
    ];

    let board = [];
    let piece = null;
    let dropCounter = 0;
    let lastTime = 0;
    let score = 0;
    let lines = 0;
    let level = 1;
    let running = false;
    let paused = false;
    let rafId = null;

    const createBoard = () => Array.from({ length: rows }, () => Array(cols).fill(0));
    const updateHud = () => {
      if (tetrisScoreEl) tetrisScoreEl.textContent = String(score);
      if (tetrisLinesEl) tetrisLinesEl.textContent = String(lines);
      if (tetrisLevelEl) tetrisLevelEl.textContent = String(level);
    };
    const randomPiece = () => {
      const idx = Math.floor(Math.random() * pieces.length);
      const shape = pieces[idx].map((row) => row.slice());
      return { shape, x: Math.floor((cols - shape[0].length) / 2), y: 0, color: idx + 1 };
    };
    const collides = (shape, x, y) => {
      for (let r = 0; r < shape.length; r += 1) {
        for (let c = 0; c < shape[r].length; c += 1) {
          if (!shape[r][c]) continue;
          const ny = y + r;
          const nx = x + c;
          if (nx < 0 || nx >= cols || ny >= rows) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    };
    const mergePiece = () => {
      piece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell && piece.y + r >= 0) board[piece.y + r][piece.x + c] = piece.color;
        });
      });
    };
    const clearLines = () => {
      let cleared = 0;
      for (let r = rows - 1; r >= 0; r -= 1) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(Array(cols).fill(0));
          cleared += 1;
          r += 1;
        }
      }
      if (cleared > 0) {
        lines += cleared;
        score += [0, 100, 300, 500, 800][cleared] * level;
        level = Math.floor(lines / 10) + 1;
        updateHud();
      }
    };
    const rotate = (shape) => shape[0].map((_, c) => shape.map((row) => row[c]).reverse());
    const spawn = () => {
      piece = randomPiece();
      if (collides(piece.shape, piece.x, piece.y)) {
        running = false;
        paused = false;
      }
    };
    const drawBlock = (x, y, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * block, y * block, block - 1, block - 1);
    };
    const draw = () => {
      ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
      board.forEach((row, r) => row.forEach((val, c) => {
        if (val) drawBlock(c, r, colors[val - 1]);
      }));
      if (piece) {
        piece.shape.forEach((row, r) => row.forEach((val, c) => {
          if (val) drawBlock(piece.x + c, piece.y + r, colors[piece.color - 1]);
        }));
      }
      if (!running) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
        ctx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', tetrisCanvas.width / 2, tetrisCanvas.height / 2 - 10);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Press Tetris button to restart', tetrisCanvas.width / 2, tetrisCanvas.height / 2 + 25);
      } else if (paused) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
        ctx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 30px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', tetrisCanvas.width / 2, tetrisCanvas.height / 2);
      }
    };
    const drop = () => {
      piece.y += 1;
      if (collides(piece.shape, piece.x, piece.y)) {
        piece.y -= 1;
        mergePiece();
        clearLines();
        spawn();
      }
      dropCounter = 0;
    };
    const moveLeft = () => {
      if (!running || paused || !piece) return;
      if (!collides(piece.shape, piece.x - 1, piece.y)) piece.x -= 1;
    };
    const moveRight = () => {
      if (!running || paused || !piece) return;
      if (!collides(piece.shape, piece.x + 1, piece.y)) piece.x += 1;
    };
    const rotatePiece = () => {
      if (!running || paused || !piece) return;
      const rotated = rotate(piece.shape);
      if (!collides(rotated, piece.x, piece.y)) piece.shape = rotated;
    };
    const softDrop = () => {
      if (!running || paused || !piece) return;
      drop();
    };
    const hardDrop = () => {
      if (!running || paused || !piece) return;
      while (!collides(piece.shape, piece.x, piece.y + 1)) piece.y += 1;
      drop();
    };
    const togglePause = () => {
      if (!running || !piece) return;
      paused = !paused;
    };
    const loop = (time = 0) => {
      const delta = time - lastTime;
      lastTime = time;
      if (running && !paused) {
        dropCounter += delta;
        const speed = Math.max(700 - (level - 1) * 60, 110);
        if (dropCounter > speed) drop();
      }
      draw();
      if (tetrisOverlay.classList.contains('active')) rafId = requestAnimationFrame(loop);
    };
    const resetGame = () => {
      board = createBoard();
      score = 0;
      lines = 0;
      level = 1;
      updateHud();
      running = true;
      paused = false;
      dropCounter = 0;
      lastTime = 0;
      spawn();
      draw();
    };
    const openTetris = () => {
      tetrisOverlay.classList.add('active');
      tetrisOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      resetGame();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    };
    const closeTetris = () => {
      tetrisOverlay.classList.remove('active');
      tetrisOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (rafId) cancelAnimationFrame(rafId);
    };
    const handleKeys = (e) => {
      if (!tetrisOverlay.classList.contains('active')) return;
      if (e.key === 'Escape') {
        closeTetris();
        return;
      }
      if (!running || !piece) return;
      if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
      }
      if (paused) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveRight();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        softDrop();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        rotatePiece();
      } else if (e.key === ' ') {
        e.preventDefault();
        hardDrop();
      }
    };

    tetrisLaunch.addEventListener('click', openTetris);
    tetrisExit.addEventListener('click', closeTetris);
    document.addEventListener('keydown', handleKeys);
    tetrisTouchButtons.forEach((button) => {
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const action = button.getAttribute('data-action');
        if (action === 'left') moveLeft();
        else if (action === 'right') moveRight();
        else if (action === 'rotate') rotatePiece();
        else if (action === 'down') softDrop();
        else if (action === 'drop') hardDrop();
        else if (action === 'pause') togglePause();
      }, { passive: false });
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        if (action === 'left') moveLeft();
        else if (action === 'right') moveRight();
        else if (action === 'rotate') rotatePiece();
        else if (action === 'down') softDrop();
        else if (action === 'drop') hardDrop();
        else if (action === 'pause') togglePause();
      });
    });
    draw();
  }

  // Reveal-on-scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal-on-scroll').forEach((el) => revealObserver.observe(el));

  // Active section in side nav
  const navLinks = document.querySelectorAll('#side-nav .nav-link');
  const sectionToLink = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute('href')?.slice(1);
    if (!id) return;
    const sec = document.getElementById(id);
    if (sec) sectionToLink.set(sec, link);
  });

  if (sectionToLink.size > 0) {
    const setActive = (link) => {
      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
    };

    const activeObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        const link = sectionToLink.get(visible[0].target);
        if (link) setActive(link);
      }
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

    sectionToLink.forEach((_, sec) => activeObserver.observe(sec));
  }

  // Footer year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
});
