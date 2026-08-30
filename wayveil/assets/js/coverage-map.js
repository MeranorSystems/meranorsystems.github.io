(() => {
  'use strict';

  const DATA_URLS = {
    coverage: '../assets/data/coverage-regions.geojson',
    cameras: '../assets/data/known-alpr.geojson',
    zips: '../assets/data/zip-coverage.json'
  };
  const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
  const CAMERA_LAYER_IDS = ['camera-clusters', 'camera-cluster-count', 'camera-points'];
  const COVERAGE_LAYER_IDS = ['coverage-fill', 'coverage-line'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mapElement = document.getElementById('coverage-map');
  if (!mapElement) return;

  const loading = document.querySelector('[data-map-loading]');
  const mapStatus = document.querySelector('[data-map-status]');
  const detailCard = document.querySelector('[data-map-detail]');
  const detailEyebrow = document.querySelector('[data-detail-eyebrow]');
  const detailTitle = document.querySelector('[data-detail-title]');
  const detailBody = document.querySelector('[data-detail-body]');
  const searchForm = document.querySelector('[data-coverage-search]');
  const searchInput = document.getElementById('coverage-zip');
  const searchStatus = document.querySelector('[data-search-status]');
  const filterButton = document.querySelector('[data-filter-button]');
  const filterPanel = document.querySelector('[data-filter-panel]');
  const verificationInputs = [...document.querySelectorAll('[data-verification-filter]')];
  const layerButtons = [...document.querySelectorAll('[data-layer-toggle]')];

  let map = null;
  let mapReady = false;
  let coverageData = emptyCollection();
  let cameraData = emptyCollection();
  let zipIndex = { version: 1, zips: {} };
  let coverageAvailable = false;
  let camerasAvailable = false;
  let zipAvailable = false;
  let coverageVisible = true;
  let camerasVisible = true;

  function emptyCollection() { return { type: 'FeatureCollection', features: [], metadata: {} }; }

  function setMapStatus(message, warning = false) {
    if (!mapStatus) return;
    mapStatus.textContent = message;
    mapStatus.classList.toggle('is-warning', warning);
  }

  function setSearchStatus(message, isError = false) {
    if (!searchStatus) return;
    searchStatus.textContent = message;
    searchStatus.classList.toggle('is-error', isError);
  }

  function setLoading(title, note) {
    if (!loading) return;
    loading.classList.remove('is-hidden');
    const strong = loading.querySelector('strong');
    const small = loading.querySelector('small');
    if (strong) strong.textContent = title;
    if (small) small.textContent = note || '';
  }

  function hideLoading() { if (loading) loading.classList.add('is-hidden'); }

  async function loadJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  }

  async function loadData() {
    const [coverageResult, cameraResult, zipResult] = await Promise.allSettled([
      loadJson(DATA_URLS.coverage), loadJson(DATA_URLS.cameras), loadJson(DATA_URLS.zips)
    ]);

    if (coverageResult.status === 'fulfilled' && coverageResult.value?.type === 'FeatureCollection') {
      coverageData = coverageResult.value; coverageAvailable = true;
    }
    if (cameraResult.status === 'fulfilled' && cameraResult.value?.type === 'FeatureCollection') {
      cameraData = cameraResult.value; camerasAvailable = true;
    }
    if (zipResult.status === 'fulfilled' && zipResult.value?.zips) {
      zipIndex = zipResult.value; zipAvailable = true;
    }

    const warnings = [];
    if (!coverageAvailable) warnings.push('coverage status');
    if (!camerasAvailable) warnings.push('known-camera data');
    if (warnings.length) {
      setMapStatus(`${warnings.join(' and ')} temporarily unavailable.`, true);
    } else {
      const count = Array.isArray(cameraData.features) ? cameraData.features.length : 0;
      const stamp = cameraData.metadata?.snapshot_date || coverageData.metadata?.snapshot_date || '';
      setMapStatus(`Public snapshot loaded${count ? ` · ${count} known records` : ''}${stamp ? ` · ${stamp}` : ''}`);
    }
    if (!zipAvailable) setSearchStatus('ZIP coverage checking is temporarily unavailable.', true);
  }

  function selectedVerificationStates() {
    return new Set(verificationInputs.filter(input => input.checked).map(input => input.value));
  }

  function filteredCameraCollection() {
    const allowed = selectedVerificationStates();
    return {
      type: 'FeatureCollection', metadata: cameraData.metadata || {},
      features: (cameraData.features || []).filter(feature => allowed.has(String(feature.properties?.verification_state || '').toUpperCase()))
    };
  }

  function applyCameraFilters() {
    if (!mapReady || !map?.getSource('known-cameras')) return;
    map.getSource('known-cameras').setData(filteredCameraCollection());
  }

  function addSourcesAndLayers() {
    map.addSource('coverage-regions', { type: 'geojson', data: coverageData });
    map.addLayer({
      id: 'coverage-fill', type: 'fill', source: 'coverage-regions',
      paint: {
        'fill-color': ['match', ['get', 'status'], 'LIMITED', '#ffb44a', 'DEVELOPMENT', '#39ecc9', '#39ecc9'],
        'fill-opacity': ['match', ['get', 'status'], 'LIMITED', 0.10, 'DEVELOPMENT', 0.08, 0.13]
      }
    });
    map.addLayer({
      id: 'coverage-line', type: 'line', source: 'coverage-regions',
      paint: {
        'line-color': ['match', ['get', 'status'], 'LIMITED', '#ffb44a', '#72f4d5'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.2, 8, 2.2, 12, 3],
        'line-opacity': 0.92, 'line-blur': 0.35
      }
    });

    map.addSource('known-cameras', { type: 'geojson', data: filteredCameraCollection(), cluster: true, clusterRadius: 48, clusterMaxZoom: 11 });
    map.addLayer({
      id: 'camera-clusters', type: 'circle', source: 'known-cameras', filter: ['has', 'point_count'], maxzoom: 11.6,
      paint: {
        'circle-color': '#ff8066', 'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 23, 200, 29],
        'circle-opacity': 0.83, 'circle-stroke-color': 'rgba(255,199,167,.8)', 'circle-stroke-width': 1.1, 'circle-blur': 0.05
      }
    });
    map.addLayer({
      id: 'camera-cluster-count', type: 'symbol', source: 'known-cameras', filter: ['has', 'point_count'], maxzoom: 11.6,
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 10 },
      paint: { 'text-color': '#fff7f2' }
    });
    map.addLayer({
      id: 'camera-points', type: 'circle', source: 'known-cameras', filter: ['!', ['has', 'point_count']], minzoom: 11.3,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11.3, 4.5, 15, 6.5],
        'circle-color': ['match', ['get', 'verification_state'], 'VERIFIED', '#ff8066', 'PROBABLE', '#ffb44a', 'UNVERIFIED', '#9b7bb7', '#ffb44a'],
        'circle-stroke-color': '#f9fbfb', 'circle-stroke-width': 1.1, 'circle-opacity': 0.92
      }
    });
    bindMapInteractions();
  }

  function bindMapInteractions() {
    map.on('click', 'camera-clusters', async event => {
      const feature = event.features?.[0]; if (!feature) return;
      const source = map.getSource('known-cameras');
      try {
        const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
        moveMap({ center: feature.geometry.coordinates, zoom: Math.min(zoom, 12.2) });
      } catch {
        moveMap({ center: feature.geometry.coordinates, zoom: Math.min(map.getZoom() + 2, 12.2) });
      }
    });
    map.on('click', 'camera-points', event => { const feature = event.features?.[0]; if (feature) showCameraDetail(feature); });
    map.on('click', 'coverage-fill', event => { const feature = event.features?.[0]; if (feature) showCoverageDetail(feature); });
    ['camera-clusters', 'camera-points', 'coverage-fill'].forEach(id => {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    });
  }

  function moveMap(options) {
    if (!mapReady || !map) return;
    if (reducedMotion) map.jumpTo({ ...options });
    else map.flyTo({ ...options, duration: 900, essential: false });
  }

  function row(label, value) {
    const item = document.createElement('div'); item.className = 'map-detail-row';
    const key = document.createElement('span'); key.textContent = label;
    const val = document.createElement('strong'); val.textContent = value;
    item.append(key, val); return item;
  }

  function copy(text) { const p = document.createElement('p'); p.className = 'map-detail-copy'; p.textContent = text; return p; }

  function showDetail({ eyebrow, title, nodes }) {
    if (!detailCard || !detailTitle || !detailBody) return;
    detailEyebrow.textContent = eyebrow; detailTitle.textContent = title; detailBody.replaceChildren(...nodes); detailCard.hidden = false;
  }
  function closeDetail() { if (detailCard) detailCard.hidden = true; }

  function readableBoolean(value, yes = 'Available', no = 'Not available') {
    if (value === true) return yes; if (value === false) return no; return 'Not reported';
  }
  function readableCompleteness(value) {
    const raw = String(value || '').toUpperCase();
    if (!raw || raw === 'UNKNOWN') return 'Unknown / not guaranteed complete';
    if (raw === 'LIMITED') return 'Limited / developing';
    if (raw === 'SUPPORTED') return 'Supported snapshot';
    return String(value);
  }

  function showCoverageDetail(feature) {
    const p = feature.properties || {}; const status = String(p.status || 'SUPPORTED').toUpperCase();
    const nodes = [
      row('Coverage status', status === 'DEVELOPMENT' ? 'Development region' : sentenceCase(status)),
      row('Navigation data', readableBoolean(toBoolean(p.navigation_available))),
      row('Known ALPR data', readableBoolean(toBoolean(p.surveillance_available))),
      row('Data completeness', readableCompleteness(p.surveillance_completeness))
    ];
    if (p.snapshot_date) nodes.push(row('Snapshot', p.snapshot_date));
    nodes.push(copy('Coverage describes the published regional package and supported public data. It is separate from Alpha entitlement and does not guarantee that every surveillance device is known.'));
    showDetail({ eyebrow: 'Regional coverage', title: p.label || p.region_label || 'WayVeil regional coverage', nodes });
  }

  function showCameraDetail(feature) {
    const p = feature.properties || {}; const verification = String(p.verification_state || 'UNKNOWN').toUpperCase();
    const nodes = [row('Provider', cleanVendor(p.vendor)), row('Confidence', sentenceCase(verification)), row('Status', sentenceCase(String(p.status || 'UNKNOWN'))), row('Source', p.source || 'Public supported dataset')];
    if (p.last_confirmed && String(p.last_confirmed).toUpperCase() !== 'UNKNOWN') nodes.push(row('Last confirmed', p.last_confirmed));
    nodes.push(copy('This marker represents a known record in the current public snapshot. Its absence elsewhere does not prove that surveillance is absent.'));
    showDetail({ eyebrow: 'Known ALPR record', title: 'Known ALPR camera', nodes });
  }

  function cleanVendor(value) {
    const vendor = String(value || '').trim();
    if (!vendor || vendor.toLowerCase() === 'unknown' || vendor.toLowerCase() === 'none') return 'Unknown';
    return vendor;
  }
  function sentenceCase(value) { const text = String(value || '').replaceAll('_', ' ').toLowerCase(); return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Unknown'; }
  function toBoolean(value) {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return null;
  }

  function regionPropertiesAtPoint(lon, lat) {
    for (const feature of coverageData.features || []) if (feature.geometry && pointInGeometry([lon, lat], feature.geometry)) return feature.properties || {};
    return null;
  }
  function pointInGeometry(point, geometry) {
    if (!geometry) return false;
    if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates);
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.some(poly => pointInPolygon(point, poly));
    return false;
  }
  function pointInPolygon(point, rings) {
    if (!Array.isArray(rings) || !rings.length || !pointInRing(point, rings[0])) return false;
    for (let i = 1; i < rings.length; i += 1) if (pointInRing(point, rings[i])) return false;
    return true;
  }
  function pointInRing([x, y], ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      const intersects = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function normalizedZipRecord(zip, record) {
    const lat = Number(record.lat), lon = Number(record.lon);
    const region = Number.isFinite(lat) && Number.isFinite(lon) ? regionPropertiesAtPoint(lon, lat) : null;
    return {
      zip, lat, lon, place: record.place || record.label || `ZIP ${zip}`,
      status: String(record.coverage_status || region?.status || 'NOT_YET_SUPPORTED').toUpperCase(),
      navigation_available: record.navigation_available ?? region?.navigation_available ?? false,
      surveillance_available: record.surveillance_available ?? region?.surveillance_available ?? false,
      surveillance_completeness: record.surveillance_completeness ?? region?.surveillance_completeness ?? 'UNKNOWN',
      snapshot_date: record.snapshot_date ?? region?.snapshot_date ?? coverageData.metadata?.snapshot_date ?? ''
    };
  }

  function showZipResult(record) {
    let title, summary;
    if (record.status === 'SUPPORTED') {
      title = 'WayVeil has supported regional coverage here.'; summary = 'This ZIP is represented by a published supported navigation region.';
    } else if (['LIMITED', 'PARTIAL', 'DEVELOPMENT'].includes(record.status)) {
      title = 'WayVeil coverage is limited here.'; summary = 'Some supported regional data is available here, but navigation and surveillance-intelligence coverage may differ.';
    } else {
      title = 'WayVeil regional coverage isn’t available here yet.'; summary = 'Coverage expands region by region as navigation packages and surveillance-intelligence states are accepted.';
    }
    const nodes = [copy(`${record.place} · ${summary}`), row('Navigation data', readableBoolean(toBoolean(record.navigation_available))), row('Known ALPR data', readableBoolean(toBoolean(record.surveillance_available))), row('ALPR completeness', readableCompleteness(record.surveillance_completeness))];
    if (record.snapshot_date) nodes.push(row('Snapshot', record.snapshot_date));
    const action = document.createElement('a'); action.className = 'button button-primary map-detail-action'; action.href = '../alpha/'; action.textContent = 'Join the Alpha'; nodes.push(action);
    nodes.push(copy('Known-camera data can be incomplete. No displayed record does not mean no surveillance.'));
    showDetail({ eyebrow: `ZIP ${record.zip}`, title, nodes });
  }

  function handleZipSearch(event) {
    event.preventDefault(); const zip = String(searchInput?.value || '').trim();
    if (!/^\d{5}$/.test(zip)) { setSearchStatus('Enter a valid 5-digit ZIP.', true); searchInput?.focus(); return; }
    if (!zipAvailable) { setSearchStatus('ZIP coverage checking is temporarily unavailable.', true); return; }
    const raw = zipIndex.zips[zip];
    if (!raw) { setSearchStatus('We couldn’t locate that ZIP in the current coverage index.', true); return; }
    const record = normalizedZipRecord(zip, raw);
    if (!Number.isFinite(record.lat) || !Number.isFinite(record.lon)) { setSearchStatus('That ZIP does not have a usable map location in the current index.', true); return; }
    setSearchStatus(`Showing coverage for ${record.place}.`); showZipResult(record); moveMap({ center: [record.lon, record.lat], zoom: 9.6 });
    document.querySelector('.coverage-map-section')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function setLayerVisibility(kind, visible) {
    if (!mapReady || !map) return; const ids = kind === 'coverage' ? COVERAGE_LAYER_IDS : CAMERA_LAYER_IDS;
    ids.forEach(id => { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'); });
  }
  function toggleLayer(button) {
    const kind = button.dataset.layerToggle;
    if (kind === 'coverage') coverageVisible = !coverageVisible; if (kind === 'cameras') camerasVisible = !camerasVisible;
    const active = kind === 'coverage' ? coverageVisible : camerasVisible;
    button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); setLayerVisibility(kind, active);
  }
  function toggleFilters(force) {
    if (!filterPanel || !filterButton) return; const shouldOpen = typeof force === 'boolean' ? force : filterPanel.hidden;
    filterPanel.hidden = !shouldOpen; filterButton.setAttribute('aria-expanded', String(shouldOpen)); if (shouldOpen) filterPanel.querySelector('input')?.focus();
  }
  function initControls() {
    searchForm?.addEventListener('submit', handleZipSearch);
    layerButtons.forEach(button => button.addEventListener('click', () => toggleLayer(button)));
    filterButton?.addEventListener('click', () => toggleFilters());
    document.querySelector('[data-filter-close]')?.addEventListener('click', () => toggleFilters(false));
    verificationInputs.forEach(input => input.addEventListener('change', applyCameraFilters));
    document.querySelector('[data-detail-close]')?.addEventListener('click', closeDetail);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { toggleFilters(false); closeDetail(); } });
  }

  async function init() {
    initControls(); await loadData();
    if (!window.maplibregl) {
      setLoading('Interactive map is temporarily unavailable.', 'Coverage checking can still work when the local ZIP index is available.'); setMapStatus('Map renderer unavailable.', true); return;
    }
    map = new window.maplibregl.Map({ container: 'coverage-map', style: STYLE_URL, center: [-100.4, 43.1], zoom: 2.65, minZoom: 2.2, maxZoom: 17, attributionControl: true, cooperativeGestures: true });
    map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => { mapReady = true; addSourcesAndLayers(); setLayerVisibility('coverage', coverageVisible); setLayerVisibility('cameras', camerasVisible); hideLoading(); });
    map.on('error', event => { if (!mapReady && event?.error) setMapStatus('Basemap is having trouble loading. Coverage data remains separate.', true); });
  }

  init().catch(() => { setLoading('Coverage explorer is temporarily unavailable.', 'Please try again later.'); setMapStatus('Coverage explorer could not start.', true); });
})();
