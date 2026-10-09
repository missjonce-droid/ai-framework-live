(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FrameworkDirectory = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function normalise(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function prepare(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.entries)) throw new Error('Search index invalid');
    return data.entries.filter(function (entry) { return /^[a-z0-9-]+$/.test(entry.slug) && /^\/(tool|creator|company)\/[a-z0-9-]+$/.test(entry.path); }).map(function (entry) { return Object.assign({}, entry, {searchText: normalise([entry.name, entry.description, entry.category].concat(entry.categories || [], entry.tags || []).join(' '))}); });
  }
  function filter(entries, query, plan) {
    var text = normalise(String(query || '').trim().slice(0, 160));
    var terms = text.split(/\s+/).filter(Boolean);
    return entries.filter(function (entry) {
      return terms.every(function (term) { return entry.searchText.includes(term); }) && (plan === 'all' || plan === 'free' && ['free', 'freemium', 'open-source'].includes(entry.pricing) || plan === 'paid' && ['paid', 'subscription', 'usage-based'].includes(entry.pricing));
    }).sort(function (a, b) { return Number(normalise(b.name) === text) - Number(normalise(a.name) === text) || a.name.localeCompare(b.name); });
  }
  return {prepare: prepare, filter: filter};
});
