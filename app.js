'use strict';

const STORAGE_KEY = 'soumission_express_v3_quotes';
const SETTINGS_KEY = 'soumission_express_v3_settings';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let quotes = safeParse(localStorage.getItem(STORAGE_KEY), []);
let settings = safeParse(localStorage.getItem(SETTINGS_KEY), {});

function safeParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function money(value) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(value || 0));
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function persistQuotes() { localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes)); }
function persistSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

function openApp() {
  $('#landing').hidden = true;
  $('#app').hidden = false;
  document.querySelector('footer').hidden = true;
  setView('dashboard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeApp() {
  $('#app').hidden = true;
  $('#landing').hidden = false;
  document.querySelector('footer').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setView(name) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  const titles = { dashboard: 'Tableau de bord', editor: 'Nouvelle soumission', quotes: 'Soumissions', settings: 'Réglages' };
  $('#viewTitle').textContent = titles[name] || 'Soumission Express';
  if (name === 'dashboard') renderDashboard();
  if (name === 'quotes') renderQuotesTable();
  if (name === 'settings') loadSettingsForm();
}

function createQuoteNumber() {
  const year = new Date().getFullYear();
  const max = quotes.reduce((m, q) => Math.max(m, Number(String(q.number || '').split('-').pop()) || 0), 0);
  return `SE-${year}-${String(max + 1).padStart(4, '0')}`;
}

function addLine(item = { description: '', qty: 1, unit: 'unité', price: 0 }) {
  const row = document.createElement('div');
  row.className = 'quote-line';
  row.innerHTML = `
    <input class="desc" maxlength="180" placeholder="Travail ou matériau" value="${esc(item.description)}">
    <input class="qty" type="number" min="0" step="0.01" value="${Number(item.qty || 0)}">
    <input class="unit" maxlength="30" placeholder="unité" value="${esc(item.unit || 'unité')}">
    <input class="price" type="number" min="0" step="0.01" value="${Number(item.price || 0)}">
    <input class="line-total" value="0,00 $" readonly aria-label="Total de ligne">
    <button type="button" class="remove-line" aria-label="Supprimer la ligne">×</button>`;
  row.querySelectorAll('input').forEach(i => i.addEventListener('input', calculateTotals));
  $('.remove-line', row).addEventListener('click', () => { row.remove(); calculateTotals(); });
  $('#lines').append(row);
  calculateTotals();
}

function calculateTotals() {
  let subtotal = 0;
  $$('.quote-line').forEach(row => {
    const lineTotal = (Number($('.qty', row).value) || 0) * (Number($('.price', row).value) || 0);
    subtotal += lineTotal;
    $('.line-total', row).value = money(lineTotal);
  });
  const discountRate = Math.min(100, Math.max(0, Number($('#discount').value) || 0));
  const discount = subtotal * discountRate / 100;
  const taxable = Math.max(0, subtotal - discount);
  const taxRate = (Number($('#tax1').value) || 0) + (Number($('#tax2').value) || 0);
  const tax = taxable * taxRate / 100;
  const total = taxable + tax;
  $('#sub').textContent = money(subtotal);
  $('#discountTotal').textContent = `− ${money(discount)}`;
  $('#tax').textContent = money(tax);
  $('#grand').textContent = money(total);
  return { subtotal, discount, tax, total };
}

function collectQuote() {
  const totals = calculateTotals();
  const items = $$('.quote-line').map(row => ({
    description: $('.desc', row).value.trim(),
    qty: Number($('.qty', row).value) || 0,
    unit: $('.unit', row).value.trim() || 'unité',
    price: Number($('.price', row).value) || 0
  })).filter(i => i.description);
  const existingId = $('#quoteId').value ? Number($('#quoteId').value) : null;
  const existing = quotes.find(q => q.id === existingId);
  return {
    id: existingId || Date.now(),
    number: existing?.number || createQuoteNumber(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    client: $('#client').value.trim(),
    contact: $('#contact').value.trim(),
    email: $('#email').value.trim(),
    phone: $('#phone').value.trim(),
    project: $('#project').value.trim(),
    projectAddress: $('#projectAddress').value.trim(),
    description: $('#description').value.trim(),
    items,
    discountRate: Number($('#discount').value) || 0,
    tax1: Number($('#tax1').value) || 0,
    tax2: Number($('#tax2').value) || 0,
    validDays: Number($('#validDays').value) || 14,
    followupDate: $('#followupDate').value || '',
    status: $('#status').value,
    notes: $('#notes').value.trim(),
    ...totals
  };
}

function resetQuoteForm() {
  $('#quoteForm').reset();
  $('#quoteId').value = '';
  $('#discount').value = 0;
  $('#tax1').value = 0;
  $('#tax2').value = 0;
  $('#validDays').value = 14;
  $('#lines').innerHTML = '';
  addLine();
  $('#viewTitle').textContent = 'Nouvelle soumission';
}

function editQuote(id) {
  const q = quotes.find(x => x.id === id);
  if (!q) return;
  setView('editor');
  $('#viewTitle').textContent = `Modifier ${q.number}`;
  $('#quoteId').value = q.id;
  $('#client').value = q.client || '';
  $('#contact').value = q.contact || '';
  $('#email').value = q.email || '';
  $('#phone').value = q.phone || '';
  $('#project').value = q.project || '';
  $('#projectAddress').value = q.projectAddress || '';
  $('#description').value = q.description || '';
  $('#discount').value = q.discountRate || 0;
  $('#tax1').value = q.tax1 || 0;
  $('#tax2').value = q.tax2 || 0;
  $('#validDays').value = q.validDays || 14;
  $('#followupDate').value = q.followupDate || '';
  $('#status').value = q.status || 'brouillon';
  $('#notes').value = q.notes || '';
  $('#lines').innerHTML = '';
  (q.items?.length ? q.items : [{ description: '', qty: 1, unit: 'unité', price: 0 }]).forEach(addLine);
  calculateTotals();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function duplicateQuote(id) {
  const q = quotes.find(x => x.id === id);
  if (!q) return;
  const copy = { ...q, id: Date.now(), number: createQuoteNumber(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'brouillon', followupDate: '' };
  quotes.unshift(copy);
  persistQuotes();
  renderQuotesTable();
  renderDashboard();
  toast('Soumission dupliquée');
}

function deleteQuote(id) {
  if (!confirm('Supprimer cette soumission? Cette action est irréversible.')) return;
  quotes = quotes.filter(q => q.id !== id);
  persistQuotes();
  renderQuotesTable();
  renderDashboard();
  toast('Soumission supprimée');
}

function updateStatus(id, status) {
  quotes = quotes.map(q => q.id === id ? { ...q, status, updatedAt: new Date().toISOString() } : q);
  persistQuotes();
  renderQuotesTable();
  renderDashboard();
  toast('Statut mis à jour');
}

function dueLabel(date) {
  if (!date) return 'Aucune date';
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(`${date}T00:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return `${Math.abs(days)} j en retard`;
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Demain';
  return `Dans ${days} j`;
}

function renderDashboard() {
  const active = quotes.filter(q => ['envoyee','relance'].includes(q.status));
  const accepted = quotes.filter(q => q.status === 'acceptee');
  const decided = quotes.filter(q => ['acceptee','refusee'].includes(q.status)).length;
  const conversion = decided ? Math.round(accepted.length / decided * 100) : 0;
  const pipelineValue = active.reduce((sum, q) => sum + Number(q.total || 0), 0);
  $('#stats').innerHTML = [
    ['Soumissions', quotes.length], ['Pipeline actif', money(pipelineValue)], ['Acceptées', accepted.length], ['Conversion', `${conversion} %`]
  ].map(([label,value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`).join('');

  const followups = quotes.filter(q => q.followupDate && ['envoyee','relance'].includes(q.status)).sort((a,b) => a.followupDate.localeCompare(b.followupDate)).slice(0,6);
  $('#followupList').innerHTML = followups.length ? followups.map(q => `<div class="list-item"><div><strong>${esc(q.client)}</strong><span>${esc(q.project)} · ${esc(q.number)}</span></div><div><strong>${dueLabel(q.followupDate)}</strong><span>${money(q.total)}</span></div></div>`).join('') : '<div class="empty">Aucune relance planifiée.</div>';

  const recent = [...quotes].sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,6);
  $('#recentList').innerHTML = recent.length ? recent.map(q => `<div class="list-item"><div><strong>${esc(q.client)}</strong><span>${esc(q.project)} · ${esc(q.number)}</span></div><div><span class="status-pill status-${esc(q.status)}">${esc(q.status)}</span><span>${money(q.total)}</span></div></div>`).join('') : '<div class="empty">Créez votre première soumission.</div>';
}

function renderQuotesTable() {
  const query = ($('#searchQuotes').value || '').trim().toLowerCase();
  const filter = $('#filterStatus').value;
  const filtered = quotes.filter(q => {
    const text = `${q.number} ${q.client} ${q.project} ${q.contact || ''}`.toLowerCase();
    return (!query || text.includes(query)) && (filter === 'all' || q.status === filter);
  });
  if (!filtered.length) { $('#quotesTable').innerHTML = '<div class="empty">Aucune soumission trouvée.</div>'; return; }
  $('#quotesTable').innerHTML = `<table><thead><tr><th>Numéro</th><th>Client</th><th>Projet</th><th>Total</th><th>Relance</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${filtered.map(q => `<tr>
    <td>${esc(q.number)}</td><td><strong>${esc(q.client)}</strong></td><td>${esc(q.project)}</td><td>${money(q.total)}</td><td>${esc(dueLabel(q.followupDate))}</td>
    <td><select data-status-id="${q.id}"><option value="brouillon" ${q.status==='brouillon'?'selected':''}>Brouillon</option><option value="envoyee" ${q.status==='envoyee'?'selected':''}>Envoyée</option><option value="relance" ${q.status==='relance'?'selected':''}>Relance</option><option value="acceptee" ${q.status==='acceptee'?'selected':''}>Acceptée</option><option value="refusee" ${q.status==='refusee'?'selected':''}>Refusée</option></select></td>
    <td><div class="row-actions"><button class="small-btn" data-edit="${q.id}">Modifier</button><button class="small-btn" data-print="${q.id}">PDF</button><button class="small-btn" data-duplicate="${q.id}">Dupliquer</button><button class="small-btn danger" data-delete="${q.id}">Supprimer</button></div></td></tr>`).join('')}</tbody></table>`;

  $$('[data-status-id]').forEach(el => el.addEventListener('change', () => updateStatus(Number(el.dataset.statusId), el.value)));
  $$('[data-edit]').forEach(el => el.addEventListener('click', () => editQuote(Number(el.dataset.edit))));
  $$('[data-print]').forEach(el => el.addEventListener('click', () => printQuote(Number(el.dataset.print))));
  $$('[data-duplicate]').forEach(el => el.addEventListener('click', () => duplicateQuote(Number(el.dataset.duplicate))));
  $$('[data-delete]').forEach(el => el.addEventListener('click', () => deleteQuote(Number(el.dataset.delete))));
}

function printQuote(id) {
  const q = quotes.find(x => x.id === id);
  if (!q) return;
  const business = settings.businessName || 'Votre entreprise';
  const expiry = new Date(new Date(q.createdAt).getTime() + (Number(q.validDays || 14) * 86400000)).toLocaleDateString('fr-CA');
  const rows = (q.items || []).map(i => `<tr><td>${esc(i.description)}</td><td>${i.qty} ${esc(i.unit || '')}</td><td>${money(i.price)}</td><td>${money(i.qty * i.price)}</td></tr>`).join('');
  const w = window.open('', '_blank');
  if (!w) { toast('Autorisez les fenêtres contextuelles pour imprimer.'); return; }
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(q.number)}</title><style>body{font-family:Arial,sans-serif;color:#14213d;padding:42px;max-width:900px;margin:auto}header{display:flex;justify-content:space-between;gap:30px;border-bottom:2px solid #14213d;padding-bottom:20px}h1{margin:0}small,p{color:#667085;line-height:1.5}table{width:100%;border-collapse:collapse;margin-top:28px}th,td{text-align:left;border-bottom:1px solid #e3e7ef;padding:10px 7px}.totals{margin:24px 0 0 auto;max-width:340px}.totals div{display:flex;justify-content:space-between;padding:7px}.grand{border-top:2px solid #14213d;font-size:20px;font-weight:bold}.meta{margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:20px}@media print{button{display:none}}</style></head><body><header><div><h1>${esc(business)}</h1><small>${esc(settings.businessRef || '')}</small></div><div><strong>Soumission ${esc(q.number)}</strong><br><small>Créée le ${new Date(q.createdAt).toLocaleDateString('fr-CA')} · valide jusqu’au ${expiry}</small></div></header><div class="meta"><div><strong>Client</strong><p>${esc(q.client)}<br>${esc(q.contact || '')}<br>${esc(q.email || '')}<br>${esc(q.phone || '')}</p></div><div><strong>Projet</strong><p>${esc(q.project)}<br>${esc(q.projectAddress || '')}</p></div></div><p>${esc(q.description || '')}</p><table><thead><tr><th>Description</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Sous-total</span><strong>${money(q.subtotal)}</strong></div><div><span>Rabais</span><strong>− ${money(q.discount)}</strong></div><div><span>Taxes</span><strong>${money(q.tax)}</strong></div><div class="grand"><span>Total</span><strong>${money(q.total)}</strong></div></div><p><small>${esc(settings.businessAddress || '')}<br>${esc(settings.businessPhone || '')} ${esc(settings.businessEmail || '')}</small></p><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></body></html>`);
  w.document.close();
}

function loadSettingsForm() {
  $('#businessName').value = settings.businessName || '';
  $('#businessPhone').value = settings.businessPhone || '';
  $('#businessEmail').value = settings.businessEmail || '';
  $('#businessRef').value = settings.businessRef || '';
  $('#businessAddress').value = settings.businessAddress || '';
}

function saveSettings() {
  settings = {
    businessName: $('#businessName').value.trim(), businessPhone: $('#businessPhone').value.trim(), businessEmail: $('#businessEmail').value.trim(), businessRef: $('#businessRef').value.trim(), businessAddress: $('#businessAddress').value.trim()
  };
  persistSettings(); toast('Réglages enregistrés');
}

function exportData() {
  const payload = JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), settings, quotes }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `soumission-express-${new Date().toISOString().slice(0,10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importData(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.quotes)) throw new Error('Format invalide');
    quotes = parsed.quotes; settings = parsed.settings || {};
    persistQuotes(); persistSettings(); renderDashboard(); loadSettingsForm(); toast('Sauvegarde importée');
  } catch (error) { console.error(error); toast('Import impossible : fichier invalide'); }
}

function clearData() {
  if (!confirm('Effacer toutes les soumissions et les réglages de cette démo?')) return;
  quotes = []; settings = {}; localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(SETTINGS_KEY); resetQuoteForm(); renderDashboard(); loadSettingsForm(); toast('Données effacées');
}

function init() {
  $$('[data-open-app]').forEach(btn => btn.addEventListener('click', openApp));
  $('#backToSite').addEventListener('click', closeApp);
  $$('.nav-btn').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
  $$('[data-go-quotes]').forEach(btn => btn.addEventListener('click', () => setView('quotes')));
  $('#quickNew').addEventListener('click', () => { resetQuoteForm(); setView('editor'); });
  $('#addLine').addEventListener('click', () => addLine());
  ['discount','tax1','tax2'].forEach(id => $(`#${id}`).addEventListener('input', calculateTotals));
  $('#resetQuote').addEventListener('click', resetQuoteForm);
  $('#quoteForm').addEventListener('submit', event => {
    event.preventDefault();
    const q = collectQuote();
    if (!q.items.length) { toast('Ajoutez au moins une ligne de travaux ou matériaux.'); return; }
    const idx = quotes.findIndex(x => x.id === q.id);
    if (idx >= 0) quotes[idx] = q; else quotes.unshift(q);
    persistQuotes(); resetQuoteForm(); renderDashboard(); setView('quotes'); toast('Soumission enregistrée');
  });
  $('#searchQuotes').addEventListener('input', renderQuotesTable);
  $('#filterStatus').addEventListener('change', renderQuotesTable);
  $('#saveSettings').addEventListener('click', saveSettings);
  $('#exportData').addEventListener('click', exportData);
  $('#importData').addEventListener('change', event => { const file = event.target.files?.[0]; if (file) importData(file); event.target.value = ''; });
  $('#clearData').addEventListener('click', clearData);
  addLine(); renderDashboard();
  window.addEventListener('error', event => console.error('Soumission Express error', event.error || event.message));
}

document.addEventListener('DOMContentLoaded', init);
