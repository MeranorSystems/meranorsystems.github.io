(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
    });
    mobileNav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        mobileNav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }
  document.querySelectorAll('[data-interest-form]').forEach((form) => {
    const status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (status) status.textContent = 'Preview only — nothing was transmitted. Live alpha interest collection is not enabled yet.';
    });
  });
})();

// W5 mocked Alpha Portal interactions only. No entitlement or identity decision is made here.
document.querySelectorAll('[data-preview-redeem]').forEach((form) => {
  const status = form.querySelector('[data-redeem-status]');
  const continueLink = form.querySelector('[data-redeem-continue]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (status) status.classList.add('is-visible');
    if (continueLink) continueLink.hidden = false;
  });
});
