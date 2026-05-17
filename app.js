// Tab navigation
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function activateTab(tabId) {
  // Update buttons
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update panels
  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  // Scroll nav item into view
  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update URL hash without jumping
  history.replaceState(null, '', `#${tabId}`);
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// Handle direct URL hash on load
const hash = window.location.hash.replace('#', '');
if (hash && document.getElementById(`tab-${hash}`)) {
  activateTab(hash);
}

// Sticky nav shrink on scroll
const nav = document.getElementById('tabNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });
