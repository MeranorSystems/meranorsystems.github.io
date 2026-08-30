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
  const status = demo.querySelector('[data-demo-status]');
  const activeLabel = demo.querySelector('[data-active-label]');
  const activeTime = demo.querySelector('[data-active-time]');
  const activeCount = demo.querySelector('[data-active-count]');

  function selectMode(mode) {
    const choice = choices[mode];
    if (!choice) return;

    demo.dataset.active = mode;

    buttons.forEach(button => {
      const selected = button.dataset.routeMode === mode;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    if (activeLabel) activeLabel.textContent = choice.label;
    if (activeTime) activeTime.textContent = `${choice.minutes} min`;
    if (activeCount) activeCount.textContent = `${choice.encounters} known ${choice.encounters === 1 ? 'encounter' : 'encounters'}`;
    if (status) status.textContent = choice.status;
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => selectMode(button.dataset.routeMode));
  });

  selectMode('zero');
})();
