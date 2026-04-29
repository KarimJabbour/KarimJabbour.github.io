document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const setTheme = (mode) => {
    const isDark = mode === 'dark';
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
