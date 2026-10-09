(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var menu = document.querySelector('.menu-button');
  var nav = document.getElementById('home-nav');
  menu.hidden = false;
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
  menu.addEventListener('click', function () { var open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
  nav.addEventListener('click', function (event) { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  document.getElementById('year').textContent = new Date().getFullYear();
  var form = document.getElementById('directory-search');
  var input = document.getElementById('tool-search');
  var pricing = document.getElementById('price-filter');
  var results = document.getElementById('search-results');
  var grid = document.getElementById('result-grid');
  var status = document.getElementById('search-status');
  var categories = document.getElementById('category-grid');
  var next = document.getElementById('more-results');
  var prev = document.getElementById('previous-results');
  var pageSize = 24, offset = 0, entries = null, indexPromise = null, currentMatches = [];
  var engine = window.FrameworkDirectory;
  function track(event, fields) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({event: event}, fields)); }
  function element(tag, className, content) { var node = document.createElement(tag); node.className = className || ''; if (content) node.textContent = content; return node; }
  function loadIndex() {
    if (!indexPromise) indexPromise = fetch('/data/directory-index.json').then(function (response) { if (!response.ok) throw new Error('Search index unavailable'); return response.json(); }).then(function (data) {
      entries = engine.prepare(data);
      return entries;
    }).catch(function (error) { indexPromise = null; throw error; });
    return indexPromise;
  }
  function renderPage() {
    grid.replaceChildren();
    var end = Math.min(offset + pageSize, currentMatches.length);
    status.textContent = currentMatches.length ? currentMatches.length.toLocaleString() + ' matches · Showing ' + (offset + 1) + '–' + end : 'No matches yet. Try a shorter phrase or another plan type.';
    currentMatches.slice(offset, end).forEach(function (entry) {
      var card = element('article', 'tool-card');
      var top = element('div', 'tool-top'); top.appendChild(element('span', 'tool-monogram purple', entry.name.slice(0, 2))); top.appendChild(element('span', 'tool-label', entry.category)); card.appendChild(top);
      var heading = element('h3'); var profile = element('a', '', entry.name); profile.href = entry.path; heading.appendChild(profile); card.appendChild(heading);
      card.appendChild(element('p', '', entry.description || 'Explore this listing in the AI Framework directory.'));
      var bottom = element('div', 'tool-bottom'); var link = element('a', '', 'Explore profile →'); link.href = entry.path; bottom.appendChild(link); bottom.appendChild(element('span', '', entry.kind === 'tool' ? 'Tool' : entry.kind === 'creator' ? 'Creator' : 'Company')); card.appendChild(bottom);
      if (entry.affiliate) {
        var affiliate = element('a', 'affiliate-label', 'Visit provider · Affiliate link ↗'); affiliate.href = '/go/' + entry.slug; affiliate.target = '_blank'; affiliate.rel = 'sponsored nofollow noopener'; card.appendChild(affiliate);
      }
      grid.appendChild(card);
    });
    if (!currentMatches.length) grid.appendChild(element('p', 'result-empty', 'You can also browse categories or open the full directory.'));
    next.hidden = end >= currentMatches.length; next.textContent = 'Next results →'; prev.hidden = offset === 0;
    results.setAttribute('aria-busy', 'false');
  }
  async function search() {
    offset = 0; results.hidden = false; categories.hidden = true; status.textContent = 'Looking through the directory…'; results.setAttribute('aria-busy', 'true');
    try {
      var catalog = await loadIndex();
      var filter = pricing.value;
      currentMatches = engine.filter(catalog, input.value, filter);
      renderPage();
      results.scrollIntoView({block: 'start'});
      var url = new URL(window.location.href); input.value.trim() ? url.searchParams.set('q', input.value.trim().slice(0, 160)) : url.searchParams.delete('q'); filter === 'all' ? url.searchParams.delete('plan') : url.searchParams.set('plan', filter); history.replaceState(null, '', url.pathname + url.search + '#directory');
      track('directory_search', {result_count: currentMatches.length, plan_filter: filter});
    } catch (error) { grid.replaceChildren(); status.textContent = 'Search is temporarily unavailable. Please open the full directory using the link above.'; results.setAttribute('aria-busy', 'false'); next.hidden = true; prev.hidden = true; }
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); search(); });
  pricing.addEventListener('change', search);
  document.querySelectorAll('[data-search]').forEach(function (button) { button.addEventListener('click', function () { input.value = button.getAttribute('data-search'); search(); }); });
  next.addEventListener('click', function () { offset += pageSize; renderPage(); results.scrollIntoView({block: 'start'}); });
  prev.addEventListener('click', function () { offset = Math.max(0, offset - pageSize); renderPage(); results.scrollIntoView({block: 'start'}); });
  document.getElementById('clear-search').addEventListener('click', function () { input.value = ''; pricing.value = 'all'; results.hidden = true; categories.hidden = false; var url = new URL(window.location.href); url.searchParams.delete('q'); url.searchParams.delete('plan'); history.replaceState(null, '', url.pathname + url.search + '#directory'); input.focus(); });
  document.addEventListener('click', function (event) { var link = event.target.closest('a'); if (!link) return; if (link.classList.contains('affiliate-label')) track('affiliate_link_clicked', {tool_slug: link.getAttribute('href').split('/').pop(), placement: 'homepage_directory'}); if (link.getAttribute('href') === '/build-my-framework/') track('framework_builder_opened', {source_path: '/'}); });
  var query = new URLSearchParams(window.location.search); if (query.has('q') || query.has('plan')) { input.value = (query.get('q') || '').slice(0, 160); if (['free', 'paid'].includes(query.get('plan'))) pricing.value = query.get('plan'); search(); }
})();
