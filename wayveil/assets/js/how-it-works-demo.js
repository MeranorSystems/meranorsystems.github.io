(() => {
  'use strict';

  const demo = document.querySelector('[data-route-demo]');
  if (!demo) return;

  const choices = {
    fastest: {
      label: 'Fastest', minutes: 12, miles: '6.1', encounters: 3,
      turn: 'Continue northeast', turnDistance: '0.3 mi',
      status: 'Fastest selected: illustrative 12-minute route with 3 encounters in the example known dataset.'
    },
    balanced: {
      label: 'Balanced', minutes: 14, miles: '6.8', encounters: 1,
      turn: 'Keep right', turnDistance: '0.5 mi',
      status: 'Balanced selected: illustrative 14-minute route with 1 encounter in the example known dataset.'
    },
    zero: {
      label: 'Zero Known ALPR', minutes: 17, miles: '7.4', encounters: 0,
      turn: 'Head northeast', turnDistance: '0.4 mi',
      status: 'Zero Known ALPR selected: illustrative 17-minute route with 0 encounters in the example known dataset.'
    }
  };

  const buttons = [...demo.querySelectorAll('[data-route-mode]')];
  const paths = [...demo.querySelectorAll('[data-route-path]')];
  const phoneRoutes = [...demo.querySelectorAll('[data-phone-route]')];
  const status = demo.querySelector('[data-demo-status]');
  const activeLabel = demo.querySelector('[data-active-label]');
  const activeTime = demo.querySelector('[data-active-time]');
  const activeCount = demo.querySelector('[data-active-count]');
  const phoneTime = demo.querySelector('[data-phone-time]');
  const phoneMeta = demo.querySelector('[data-phone-meta]');
  const phoneCount = demo.querySelector('[data-phone-count]');
  const phoneMode = demo.querySelector('[data-phone-mode]');
  const phoneTurn = demo.querySelector('[data-phone-turn]');
  const phoneTurnDistance = demo.querySelector('[data-phone-turn-distance]');

  function selectMode(mode) {
    const choice = choices[mode];
    if (!choice) return;

    demo.dataset.active = mode;

    buttons.forEach(button => {
      const selected = button.dataset.routeMode === mode;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    paths.forEach(path => path.classList.toggle('is-active', path.dataset.routePath === mode));
    phoneRoutes.forEach(path => path.classList.toggle('is-active', path.dataset.phoneRoute === mode));

    if (activeLabel) activeLabel.textContent = choice.label;
    if (activeTime) activeTime.textContent = `${choice.minutes} min`;
    if (activeCount) activeCount.textContent = `${choice.encounters} known ${choice.encounters === 1 ? 'encounter' : 'encounters'}`;
    if (phoneTime) phoneTime.textContent = `${choice.minutes} min`;
    if (phoneMeta) phoneMeta.textContent = `${choice.miles} mi · illustrative`;
    if (phoneCount) phoneCount.textContent = String(choice.encounters);
    if (phoneMode) phoneMode.textContent = choice.label;
    if (phoneTurn) phoneTurn.textContent = choice.turn;
    if (phoneTurnDistance) phoneTurnDistance.textContent = choice.turnDistance;
    if (status) status.textContent = choice.status;
  }

  buttons.forEach(button => button.addEventListener('click', () => selectMode(button.dataset.routeMode)));
  selectMode('zero');
})();
