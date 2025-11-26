// assets/js/app.js
// Bahasa Indonesia UI, static-only, siap di GitHub Pages
// Fitur:
// - Input data CSV time(s),SoC(%)
// - Hitung turunan numerik (dSoC/dt) menggunakan central difference
// - Tampilkan grafik SoC vs waktu & dSoC/dt vs waktu (Chart.js)
// - Simpan hasil ke localStorage, export/import CSV, shareable link (encoded in URL hash)

(function () {
  // util
  function qs(id){ return document.getElementById(id); }
  function parseCSVText(txt){
    // parse simple CSV: lines of "time,SoC"
    const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
    const data = [];
    for(const line of lines){
      const parts = line.split(',').map(p=>p.trim());
      if(parts.length < 2) continue;
      const t = Number(parts[0]);
      const soc = Number(parts[1]);
      if(Number.isFinite(t) && Number.isFinite(soc)) data.push({t, soc});
    }
    // sort by time ascending
    data.sort((a,b)=>a.t - b.t);
    return data;
  }

  // numerical derivative using central differences
  function computeDerivative(samples){
    // samples: [{t: , soc: }, ...], t in seconds, soc in percent
    // returns array of {t_mid, dSoCdt} aligned per midpoint or per sample index (we'll align to original samples using central diff)
    const n = samples.length;
    if(n < 2) return [];
    const deriv = new Array(n).fill(null);
    for(let i=0;i<n;i++){
      if(i===0){
        // forward difference
        const dt = samples[i+1].t - samples[i].t;
        deriv[i] = (samples[i+1].soc - samples[i].soc)/dt;
      } else if(i===n-1){
        // backward difference
        const dt = samples[i].t - samples[i-1].t;
        deriv[i] = (samples[i].soc - samples[i-1].soc)/dt;
      } else {
        // central difference
        const dt = samples[i+1].t - samples[i-1].t;
        deriv[i] = (samples[i+1].soc - samples[i-1].soc)/dt;
      }
    }
    // return as percent-per-second
    return deriv;
  }

  function formatNumber(x, dp=3){
    return (Math.round(x * Math.pow(10, dp))/Math.pow(10, dp)).toString();
  }

  // storage
  const STORAGE_KEY = 'mr_dsoc_results_v1';
  function loadAll(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      return JSON.parse(raw);
    } catch(e){ return []; }
  }
  function saveAll(arr){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  // Charts
  let socChart = null;
  let derivChart = null;
  function ensureCharts(){
    const socCtx = qs('socChart').getContext('2d');
    const derivCtx = qs('derivChart').getContext('2d');
    if(!socChart){
      socChart = new Chart(socCtx, {
        type: 'line',
        data: { labels: [], datasets: [{
          label: 'SoC (%)',
          data: [],
          borderWidth: 2,
          tension: 0.25,
          fill: false,
        }]},
        options: { responsive:true, plugins:{legend:{display:true}}, scales:{x:{title:{display:true,text:'Waktu (s)'}}, y:{title:{display:true,text:'SoC (%)'}}} }
      });
    }
    if(!derivChart){
      derivChart = new Chart(derivCtx, {
        type: 'line',
        data: { labels: [], datasets: [{
          label: 'dSoC/dt (%/s)',
          data: [],
          borderWidth: 2,
          tension: 0.25,
          fill: false
        }]},
        options: { responsive:true, plugins:{legend:{display:true}}, scales:{x:{title:{display:true,text:'Waktu (s)'}}, y:{title:{display:true,text:'dSoC/dt (%/s)'}}} }
      });
    }
  }

  function updateCharts(samples, derivs){
    ensureCharts();
    const labels = samples.map(s=>s.t);
    socChart.data.labels = labels;
    socChart.data.datasets[0].data = samples.map(s=>s.soc);
    socChart.update();

    derivChart.data.labels = labels;
    derivChart.data.datasets[0].data = derivs;
    derivChart.update();
  }

  // UI rendering
  function renderTable(){
    const all = loadAll();
    const tbody = qs('resultsTable').querySelector('tbody');
    tbody.innerHTML = '';
    all.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const avgDeriv = item.deriv && item.deriv.length ? (item.deriv.reduce((a,b)=>a+b,0)/item.deriv.length) : 0;
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.charger)}</td>
        <td>${escapeHtml(item.phone)}</td>
        <td>${item.samples.length} titik</td>
        <td>${formatNumber(avgDeriv,5)}</td>
        <td>
          <button data-idx="${idx}" class="btn small view">Lihat</button>
          <button data-idx="${idx}" class="btn small link">🔗</button>
          <button data-idx="${idx}" class="btn small export">CSV</button>
          <button data-idx="${idx}" class="btn small del warn">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    // attach handlers
    tbody.querySelectorAll('button.view').forEach(b=>{
      b.addEventListener('click', e=>{
        const i = Number(e.currentTarget.dataset.idx); showItem(i);
      });
    });
    tbody.querySelectorAll('button.del').forEach(b=>{
      b.addEventListener('click', e=>{
        const i = Number(e.currentTarget.dataset.idx);
        if(confirm('Hapus item #' + (i+1) + ' secara permanen?')) {
          const all = loadAll(); all.splice(i,1); saveAll(all); renderTable();
        }
      });
    });
    tbody.querySelectorAll('button.link').forEach(b=>{
      b.addEventListener('click', e=>{
        const i = Number(e.currentTarget.dataset.idx);
        const all = loadAll();
        const item = all[i];
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(item))));
        const url = location.origin + location.pathname + '#' + encoded;
        prompt('Salin link ini untuk dibagikan (buka di browser lain untuk melihat hasil):', url);
      });
    });
    tbody.querySelectorAll('button.export').forEach(b=>{
      b.addEventListener('click', e=>{
        const i = Number(e.currentTarget.dataset.idx);
        const all = loadAll();
        downloadSingleCSV(all[i]);
      });
    });
  }

  function escapeHtml(s){
    return (s+'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

  function showItem(idx){
    const all = loadAll();
    const it = all[idx];
    if(!it) return;
    // update summary
    const avg = it.deriv.reduce((a,b)=>a+b,0)/it.deriv.length;
    qs('summary').innerHTML = `
      <div>
        <strong>${escapeHtml(it.name)}</strong> — Charger: ${escapeHtml(it.charger)}, HP: ${escapeHtml(it.phone)}
        <p class="muted">${escapeHtml(it.desc || '')}</p>
        <p>Rata-rata dSoC/dt: <strong>${formatNumber(avg,5)}</strong> %/s</p>
        <p>Jumlah titik sampel: ${it.samples.length}</p>
      </div>
    `;
    updateCharts(it.samples, it.deriv);
    // set hash so URL reflects current?
    // no — only share via link button.
  }

  // CSV export helpers
  function downloadCSV(filename, text){
    const blob = new Blob([text], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function allToCsv(all){
    // We'll export each item as a block with header line
    let out = 'name,charger,phone,desc,point_index,time_s,soc_percent\n';
    all.forEach(item=>{
      item.samples.forEach((s, idx)=>{
        out += `"${item.name}","${item.charger}","${item.phone}","${(item.desc||'').replace(/"/g,'""')}",${idx+1},${s.t},${s.soc}\n`;
      });
    });
    return out;
  }
  function downloadSingleCSV(item){
    let out = 'time_s,soc_percent\n';
    item.samples.forEach(s=>{
      out += `${s.t},${s.soc}\n`;
    });
    downloadCSV(`${sanitizeFilename(item.name||'exp')}.csv`, out);
  }
  function sanitizeFilename(s){
    return (s||'export').replace(/[^\w\-]/g,'_');
  }

  // import CSV (expects same export format or simple time,soc lines)
  function importCsvFile(file){
    const reader = new FileReader();
    reader.onload = function(e){
      const text = String(e.target.result || '');
      // try detect full multi-item format: has header "name,charger,phone,desc,point_index,time_s,soc_percent"
      if(/time_s\s*,\s*soc_percent/i.test(text) && !/name,charger,phone/i.test(text)){
        // treat as single series
        const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
        const samples = [];
        for(const line of lines){
          if(/time_s/i.test(line) && /soc_percent/i.test(line)) continue;
          const parts = line.split(',');
          if(parts.length<2) continue;
          const t = Number(parts[0].trim()), soc = Number(parts[1].trim());
          if(Number.isFinite(t) && Number.isFinite(soc)) samples.push({t,soc});
        }
        if(samples.length<2){ alert('File tidak berisi data yang valid.'); return; }
        const name = prompt('Nama percobaan untuk data import?','Imported Experiment');
        const charger = prompt('Merk charger?','Unknown');
        const phone = prompt('Merk & model HP?','Unknown');
        processAndSave({name, charger, phone, desc:'Diimport dari file', samples});
      } else {
        // try full export format: parse lines with time_s
        // we'll group by name
        const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
        const map = {};
        for(const line of lines){
          if(/time_s/i.test(line) && /soc_percent/i.test(line)) continue;
          const parts = splitCsvLine(line);
          // expected length 7 in our export: name,charger,phone,desc,point_index,time_s,soc_percent
          if(parts.length < 7) continue;
          const name = parts[0], charger = parts[1], phone = parts[2], desc = parts[3], time_s = Number(parts[5]), soc = Number(parts[6]);
          if(!map[name]) map[name] = {name, charger, phone, desc, samples:[]};
          if(Number.isFinite(time_s) && Number.isFinite(soc)) map[name].samples.push({t:time_s, soc});
        }
        const arr = Object.values(map);
        if(arr.length === 0){ alert('Tidak menemukan data dalam file. Pastikan format CSV sesuai.'); return; }
        arr.forEach(item => {
          if(item.samples.length >= 2) processAndSave(item); // save and compute
        });
      }
    };
    reader.readAsText(file);
  }

  function splitCsvLine(line){
    // simple CSV splitter handling quoted fields
    const result = [];
    let cur = ''; let inQuote = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"' ) { inQuote = !inQuote; continue; }
      if(ch === ',' && !inQuote){ result.push(cur); cur=''; continue; }
      cur += ch;
    }
    if(cur !== '') result.push(cur);
    return result.map(s=>s.trim());
  }

  // process samples, compute derivative, save to storage
  function processAndSave(item){
    // ensure samples sorted
    item.samples.sort((a,b)=>a.t - b.t);
    if(item.samples.length < 2){ alert('Minimal 2 titik data diperlukan.'); return; }
    const deriv = computeDerivative(item.samples);
    item.deriv = deriv;
    // save
    const all = loadAll();
    all.push(item);
    saveAll(all);
    renderTable();
    // show last item
    showItem(all.length - 1);
    // center to results
    window.scrollTo({top: document.querySelector('.results').offsetTop - 20, behavior:'smooth'});
  }

  // handle form submit
  function attachHandlers(){
    const form = qs('experimentForm');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const name = qs('expName').value.trim();
      const charger = qs('chargerBrand').value.trim();
      const phone = qs('phoneBrand').value.trim();
      const desc = qs('desc').value.trim();
      const csv = qs('csvData').value.trim();
      if(!name || !charger || !phone || !csv){
        alert('Lengkapi nama, merk charger, merk HP, dan data CSV.');
        return;
      }
      const samples = parseCSVText(csv);
      if(samples.length < 2){ alert('Minimal 2 titik data valid diperlukan. Periksa format CSV.'); return; }
      processAndSave({name, charger, phone, desc, samples});
      form.reset();
    });

    qs('loadExample').addEventListener('click', function(){
      qs('expName').value = 'Contoh - Charger Fast 33W + HP X';
      qs('chargerBrand').value = 'ContohCharger 33W';
      qs('phoneBrand').value = 'ContohPhone X';
      qs('desc').value = 'Contoh data pengisian (screen-off)';
      qs('csvData').value = '0,18\n60,20\n120,23\n180,27\n240,32\n300,36';
    });

    qs('exportCsv').addEventListener('click', function(){
      const all = loadAll();
      if(!all.length){ alert('Belum ada data untuk diexport.'); return; }
      const csv = allToCsv(all);
      downloadCSV('mr_dsoc_all.csv', csv);
    });

    qs('clearAll').addEventListener('click', function(){
      if(confirm('Hapus semua hasil tersimpan di browser ini?')){ localStorage.removeItem(STORAGE_KEY); renderTable(); qs('summary').innerHTML = '<p class="muted">Belum ada data.</p>'; if(socChart) socChart.destroy(); if(derivChart) derivChart.destroy(); socChart=null; derivChart=null; }
    });

    qs('importCsvFile').addEventListener('change', function(e){
      const f = e.target.files[0];
      if(f) importCsvFile(f);
      e.target.value = '';
    });

    // hash handling: if url has hash that encodes an item, show it
    if(location.hash && location.hash.length > 1){
      try {
        const decoded = decodeURIComponent(escape(atob(location.hash.substring(1))));
        const item = JSON.parse(decoded);
        // show item temporarily (not saving)
        qs('summary').innerHTML = `<div><strong>${escapeHtml(item.name||'Shared')}</strong><p class="muted">${escapeHtml(item.desc||'')}</p></div>`;
        updateCharts(item.samples, item.deriv);
        // and offer to save
        if(confirm('Tampilkan hasil dari link. Simpan hasil ini ke perangkat Anda? (OK = Simpan)')) processAndSave(item);
      } catch(e){
        console.warn('Tidak dapat decode hash:', e);
      }
    }
  }

  // initial render
  function init(){
    attachHandlers();
    renderTable();
    ensureCharts();
  }

  // start
  document.addEventListener('DOMContentLoaded', init);
})();
