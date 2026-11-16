// Prototype animé : animations CSS déterministes, capture contrôlée par Playwright.
(() => {
  const params = new URLSearchParams(location.search);
  const t = Number(params.get('t') || 0);
  document.documentElement.style.setProperty('--capture-time', t + 's');
  // Mode capture : chaque frame peut être figée à un instant précis.
  if (params.has('t')) {
    document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; });
  }
})();