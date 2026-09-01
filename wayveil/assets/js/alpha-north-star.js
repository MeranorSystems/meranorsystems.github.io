(() => {
  'use strict';

  const DATA_URLS = {
    coverage: '../assets/data/coverage-regions.geojson',
    zips: '../assets/data/zip-coverage.json'
  };

  const body = document.body;
  if (!body?.classList.contains('alpha-north-star')) return;

  const alphaState = String(body.dataset.alphaState || 'preparing').toLowerCase();
  const coverageForm = document.querySelector('[data-alpha-coverage-form]');
  const coverageInput = document.getElementById('alpha-coverage-zip');
  const coverageStatus = document.querySelector('[data-alpha-coverage-status]');
  const result = document.querySelector('[data-alpha-coverage-result]');
  const resultPlace = document.querySelector('[data-result-place]');
  const resultTitle = document.querySelector('[data-result-title]');
  const resultState = document.querySelector('[data-result-state]');
  const resultNavigation = document.querySelector('[data-result-navigation]');
  const resultSurveillance = document.querySelector('[data-result-surveillance]');
  const resultCaveat = document.querySelector('[data-result-caveat]');
  const requestForm = document.querySelector('[data-alpha-request-form]');
  const requestSubmit = document.querySelector('[data-request-submit]');
  const requestStatus = document.querySelector('[data-alpha-request-status]');
  const releaseBadges = [...document.querySelectorAll('[data-alpha-live-state]')];

  let coverageData = { type: 'FeatureCollection', features: [], metadata: {} };
  let zipIndex = { version: 1, zips: {} };
  let coverageAvailable = false;
  let zipAvailable = false;

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function setCoverageStatus(message, isError = false) {
    if (!coverageStatus) return;
    coverageStatus.textContent = message;
    coverageStatus.classList.toggle('is-error', isError);
  }

  function setRequestStatus(message, isError = false) {
    if (!requestStatus) return;
    requestStatus.textContent = message;
    requestStatus.classList.toggle('is-error', isError);
  }

  function readableBoolean(value, yes = 'Available', no = 'Not available') {
    if (value === true || value === 'true' || value === 1 || value === '1') return yes;
    if (value === false || value === 'false' || value === 0 || value === '0') return no;
    return 'Not reported';
  }

  function readableCompleteness(value, available) {
    const raw = String(value || '').toUpperCase();
    if (available === false || available === 'false') return 'Not currently published';
    if (!raw || raw === 'UNKNOWN') return 'Available data · completeness unknown';
    if (raw === 'LIMITED') return 'Limited / developing';
    if (raw === 'SUPPORTED') return 'Supported public snapshot';
    return String(value).replaceAll('_', ' ').toLowerCase();
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  }

  async function loadCoverageData() {
    const [coverageResult, zipResult] = await Promise.allSettled([
      loadJson(DATA_URLS.coverage),
      loadJson(DATA_URLS.zips)
    ]);

    if (coverageResult.status === 'fulfilled' && coverageResult.value?.type === 'FeatureCollection') {
      coverageData = coverageResult.value;
      coverageAvailable = true;
    }
    if (zipResult.status === 'fulfilled' && zipResult.value?.zips) {
      zipIndex = zipResult.value;
      zipAvailable = true;
    }

    if (!zipAvailable) {
      setCoverageStatus('Coverage checking is temporarily unavailable. You can still explore the public Coverage page.', true);
    }
  }

  function pointInRing([x, y], ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersects = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pointInPolygon(point, rings) {
    if (!Array.isArray(rings) || !rings.length || !pointInRing(point, rings[0])) return false;
    for (let i = 1; i < rings.length; i += 1) if (pointInRing(point, rings[i])) return false;
    return true;
  }

  function pointInGeometry(point, geometry) {
    if (!geometry) return false;
    if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates);
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.some(poly => pointInPolygon(point, poly));
    return false;
  }

  function regionPropertiesAtPoint(lon, lat) {
    if (!coverageAvailable) return null;
    for (const feature of coverageData.features || []) {
      if (feature.geometry && pointInGeometry([lon, lat], feature.geometry)) return feature.properties || {};
    }
    return null;
  }

  function normalizedZipRecord(zip, raw) {
    const lat = Number(raw.lat);
    const lon = Number(raw.lon);
    const region = Number.isFinite(lat) && Number.isFinite(lon) ? regionPropertiesAtPoint(lon, lat) : null;
    return {
      zip,
      place: raw.place || raw.label || `ZIP ${zip}`,
      status: String(raw.coverage_status || region?.status || 'NOT_YET_SUPPORTED').toUpperCase(),
      navigationAvailable: raw.navigation_available ?? region?.navigation_available ?? false,
      surveillanceAvailable: raw.surveillance_available ?? region?.surveillance_available ?? false,
      surveillanceCompleteness: raw.surveillance_completeness ?? region?.surveillance_completeness ?? 'UNKNOWN'
    };
  }

  function showCoverageResult(record) {
    if (!result) return;

    const navAvailable = record.navigationAvailable === true || record.navigationAvailable === 'true';
    const surveillanceAvailable = record.surveillanceAvailable === true || record.surveillanceAvailable === 'true';
    let title = 'WayVeil regional navigation is not available here yet.';
    let state = 'Not available yet';
    let stateClass = 'is-unavailable';

    if (record.status === 'SUPPORTED' && navAvailable) {
      title = 'WayVeil has supported regional navigation here.';
      state = 'Navigation available';
      stateClass = '';
    } else if (['LIMITED', 'PARTIAL', 'DEVELOPMENT'].includes(record.status) || navAvailable) {
      title = 'WayVeil availability is limited here.';
      state = 'Limited';
      stateClass = 'is-limited';
    }

    setText(resultPlace, `${record.place} · ZIP ${record.zip}`);
    setText(resultTitle, title);
    setText(resultState, state);
    resultState?.classList.remove('is-limited', 'is-unavailable');
    if (stateClass) resultState?.classList.add(stateClass);
    setText(resultNavigation, readableBoolean(record.navigationAvailable));
    setText(resultSurveillance, readableCompleteness(record.surveillanceCompleteness, surveillanceAvailable));
    setText(resultCaveat, surveillanceAvailable
      ? 'Known-surveillance intelligence is shown separately from navigation availability and may still be incomplete or stale.'
      : 'Navigation availability never means surveillance is absent. Known-surveillance intelligence may be limited, developing, or unavailable.');
    result.hidden = false;
  }

  function handleCoverageCheck(event) {
    event.preventDefault();
    const zip = String(coverageInput?.value || '').trim();
    if (!/^\d{5}$/.test(zip)) {
      setCoverageStatus('Enter a valid 5-digit ZIP.', true);
      coverageInput?.focus();
      return;
    }
    if (!zipAvailable) {
      setCoverageStatus('Coverage checking is temporarily unavailable.', true);
      return;
    }
    const raw = zipIndex.zips[zip];
    if (!raw) {
      setCoverageStatus('We couldn’t locate that ZIP in the current coverage index.', true);
      return;
    }
    const record = normalizedZipRecord(zip, raw);
    setCoverageStatus('Coverage check complete.');
    showCoverageResult(record);
  }

  function configureReleaseState() {
    const preparing = alphaState !== 'open';
    releaseBadges.forEach(node => {
      node.textContent = preparing ? 'First wave preparing' : 'Closed Alpha · Wave 1';
    });
    if (requestSubmit) {
      requestSubmit.disabled = preparing;
      requestSubmit.setAttribute('aria-disabled', String(preparing));
      requestSubmit.textContent = preparing ? 'Requests opening soon' : 'Request Alpha Access';
    }
    if (preparing) {
      setRequestStatus('Alpha requests are not open yet. No application information is being collected from this page.');
    }
  }

  function handleRequest(event) {
    event.preventDefault();
    if (!requestForm?.reportValidity()) return;
    if (alphaState !== 'open') {
      setRequestStatus('Alpha requests are not open yet. Nothing was sent or stored.');
      return;
    }
    setRequestStatus('Alpha request submission is temporarily unavailable.', true);
  }

  coverageForm?.addEventListener('submit', handleCoverageCheck);
  requestForm?.addEventListener('submit', handleRequest);
  configureReleaseState();
  loadCoverageData().catch(() => setCoverageStatus('Coverage checking is temporarily unavailable.', true));
})();
