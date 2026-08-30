(() => {
  'use strict';

  const demo = document.querySelector('[data-route-demo]');
  if (!demo) return;

  const choices = {
    fastest: {
      label: 'Fastest',
      minutes: 12,
      miles: '6.1',
      encounters: 3,
      status: 'Fastest selected: illustrative 12-minute route with 3 encounters in the example known dataset.'
    },
    balanced: {
      label: 'Balanced',
      minutes: 14,
      miles: '6.8',
      encounters: 1,
      status: 'Balanced selected: illustrative 14-minute route with 1 encounter in the example known dataset.'
    },
    zero: {
      label: 'Zero Known ALPR',
      minutes: 17,
      miles: '7.4',
      encounters: 0,
      status: 'Zero Known ALPR selected: illustrative 17-minute route with 0 encounters in the example known dataset.'
    }
  };

  const buttons = [...demo.querySelectorAll('[data-route-mode]')];
  const paths = [...demo.querySelectorAll('[data-route-path]')];
  const phoneTime = demo.querySelector('[data-phone-time]');
  const phoneMeta = demo.querySelector('[data-phone-meta]');
  const phoneCount = demo.querySelector('[data-phone-count]');
  const status = demo.querySelector('[data-demo-status]');

  function selectMode(mode) {
    const choice = choices[mode];
    if (!choice) return;

    demo.dataset.active = mode;

    buttons.forEach(button => {
      const selected = button.dataset.routeMode === mode;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    paths.forEach(path => {
      path.classList.toggle('is-active', path.dataset.routePath === mode);
    });

    if (phoneTime) phoneTime.textContent = `${choice.minutes} min`;
    if (phoneMeta) phoneMeta.textContent = `${choice.miles} mi · illustrative`;
    if (phoneCount) phoneCount.textContent = String(choice.encounters);
    if (status) status.textContent = choice.status;
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => selectMode(button.dataset.routeMode));
  });

  selectMode('zero');
})();
