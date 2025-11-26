/* app.js
   Frontend mandiri yang bisa berjalan lokal tanpa backend.
   - Menggunakan PapaParse untuk parse CSV
   - Menghitung dSoC/dt sesuai spesifikasi (central difference + forward/backward)
   - Smoothing optional (moving average window=3)
   - Menyimpan grup ke localStorage sebagai fallback (agar berjalan lokal)
   - Menghasilkan group_id, menampilkan grafik (Chart.js), ringkasan, unduh CSV processed
   - Semua pesan & tooltip dalam Bahasa Indonesia
*/

/* ---------- Konfigurasi ---------- */
// Nama key di localStorage untuk menyimpan grup jika tidak ada backend
const LOCALSTORAGE_KEY = 'efisiensi_charger_groups_v1';

/* ---------- Elemen DOM ---------- */
const csvInput = document.getElementById('csvFile');
const btnPreview = document.getElementById('btnPreview');
const previewArea = document.getElementById('previewArea');
const previewText = document.getElementById('previewText');
const uploaderNameWrap = document.getElementById('uploaderNameWrap');
const uploaderNameInput = document.getElementById('uploaderName');
const btnUpload = document.getElementById('btnUpload');
const uploadStatus = document.getElementById('uploadStatus');
const toggleSmoothing = document.getElementById('toggleSmoothing');

const filterBrand = document.getElementById('filterBrand');
const filterChgType = document.getElementById('filterChgType');
const filterUploader = document.getElementById('filterUploader');
const filterPriceMin = document.getElementById('filterPriceMin');
const filterPriceMax = document.getElementById('filterPriceMax');
const selectGroup = document.getElementById('selectGroup');
const summaryBody = document.getElementById('summaryBody');

let lastParsed = null;
let groupsCache = []; // array grup ter-load
let chartSoC = null, chartD = null;

/* ---------- Helper: localStorage (fallback) ---------- */
function loadGroupsFromLocal(){
  const raw = localStorage.getItem(LOCALSTORAGE_KEY);
  if(!raw) return [];
  try { return JSON.parse(raw); } catch(e){ return []; }
}
function saveGroupsToLocal(groups){
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(groups));
}

/* ---------- CSV Preview & Validasi ---------- */
btnPreview.addEventListener('click', () => {
  const file = csvInput.files[0];
  if(!file){ alert('Pilih file CSV terlebih dahulu.'); return; }
  if(file.size > 10 * 1024 * 1024){ alert('Ukuran file melebihi 10 MB.'); return; }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    preview: 10,
    complete: (results) => {
      const fields = results.meta.fields || [];
      previewArea.classList.remove('hidden');
      previewText.textContent = JSON.stringify(results.data, null, 2);

      const required = ['charger','time_min','soc_percent','hp_brand','charger_type','charger_price','uploader'];
      const hasAll = required.every(h => fields.includes(h));
      if(!hasAll){
        const altRequired = ['charger','time_min','soc_percent','hp_brand','charger_type','charger_price'];
        const hasAlt = altRequired.every(h => fields.includes(h));
        if(hasAlt){
          uploaderNameWrap.classList.remove('hidden');
        } else {
          alert('Format CSV tidak valid. Pastikan header: charger,time_min,soc_percent,hp_brand,charger_type,charger_price,uploader');
        }
      } else {
        uploaderNameWrap.classList.add('hidden');
      }

      lastParsed = { results, fields };
    }
  });
});

/* ---------- Perhitungan derivative sesuai spesifikasi ---------- */
function computeDerivative(points){
  // points: array objek {time_min: Number, soc_percent: Number} sudah terurut naik
  const n = points.length;
  const res = [];
  if(n === 0) return res;
  if(n === 1){
    res.push(Object.assign({}, points[0], { dSoC_dt: 0 }));
    return res;
  }
  for(let i=0;i<n;i++){
    const s = Number(points[i].soc_percent);
    const t = Number(points[i].time_min);
    if(i === 0){
      const s1 = Number(points[1].soc_percent);
      const t1 = Number(points[1].time_min);
      const d = (s1 - s) / (t1 - t);
      res.push(Object.assign({}, points[i], { dSoC_dt: d }));
    } else if(i === n-1){
      const s0 = Number(points[n-2].soc_percent);
      const t0 = Number(points[n-2].time_min);
      const d = (s - s0) / (t - t0);
      res.push(Object.assign({}, points[i], { dSoC_dt: d }));
    } else {
      const s0 = Number(points[i-1].soc_percent);
      const t0 = Number(points[i-1].time_min);
      const s1 = Number(points[i+1].soc_percent);
      const t1 = Number(points[i+1].time_min);
      const d = (s1 - s0) / (t1 - t0);
      res.push(Object.assign({}, points[i], { dSoC_dt: d }));
    }
  }
  return res;
}

/* ---------- Moving average window=3 ---------- */
function movingAverageValues(arr){
  const n = arr.length;
  if(n < 3) return arr.slice();
  const out = arr.slice();
  for(let i=1;i<n-1;i++){
    out[i] = (arr[i-1] + arr[i] + arr[i+1]) / 3;
  }
  return out;
}

/* ---------- Upload handler (simpan ke localStorage) ---------- */
btnUpload.addEventListener('click', async () => {
  if(!lastParsed){ alert('Silakan lakukan preview terlebih dahulu.'); return; }
  uploadStatus.textContent = 'Mengunggah… mohon tunggu.';

  // baca file penuh sebagai teks (jika ada file)
  const file = csvInput.files[0];
  let csvText = '';
  if(file){
    csvText = await file.text();
  } else {
    alert('File tidak ditemukan. Pilih file CSV terlebih dahulu.'); uploadStatus.textContent=''; return;
  }

  // parse full csv
  const parsed = Papa.parse(csvText, {header:true, skipEmptyLines:true});
  const fields = parsed.meta.fields || [];
  const required = ['charger','time_min','soc_percent','hp_brand','charger_type','charger_price'];
  const hasRequired = required.every(h => fields.includes(h));
  if(!hasRequired){
    alert('Format CSV tidak valid. Pastikan header: charger,time_min,soc_percent,hp_brand,charger_type,charger_price,uploader');
    uploadStatus.textContent = '';
    return;
  }

  // jika kolom uploader tidak ada, gunakan input uploaderName
  let uploaderName = '';
  if(!fields.includes('uploader')){
    uploaderName = (uploaderNameInput.value || '').trim();
    if(!uploaderName){ alert('Masukkan nama Anda pada kolom uploader'); uploadStatus.textContent = ''; return; }
    parsed.data.forEach(r => r.uploader = uploaderName);
  } else {
    uploaderName = parsed.data[0] && parsed.data[0].uploader ? parsed.data[0].uploader : 'Anonim';
  }

  // buat points (time_min numeric, soc_percent numeric)
  const rawRows = parsed.data.map(r => {
    return {
      charger: String(r.charger || '').trim(),
      time_min: Number(r.time_min),
      soc_percent: Number(r.soc_percent),
      hp_brand: String(r.hp_brand || '').trim(),
      charger_type: String(r.charger_type || '').trim(),
      charger_price: Number(r.charger_price || 0),
      uploader: String(r.uploader || uploaderName).trim()
    };
  });

  // kelompokkan berdasarkan (charger, hp_brand, charger_type, charger_price, uploader, timestamp)
  // Per instruksi setiap unggahan menjadi satu group time-series
  const timestamp = Date.now();
  const group_id = 'grp_' + timestamp + '_' + Math.random().toString(36).slice(2,9);

  // points hanya fields time_min & soc_percent, urutkan berdasarkan time_min
  const points = rawRows.map(r => ({ time_min: r.time_min, soc_percent: r.soc_percent }))
                        .sort((a,b) => a.time_min - b.time_min);

  // optional smoothing di frontend jika pengguna centang toggle
  let processedPoints = points.map(p => ({ ...p })); // salin
  if(toggleSmoothing.checked){
    const socs = processedPoints.map(p => p.soc_percent);
    const smoothed = movingAverageValues(socs);
    processedPoints.forEach((p,i) => p.soc_percent = smoothed[i]);
  }

  // hitung derivative sesuai spesifikasi
  const withD = computeDerivative(processedPoints);

  // hitung avg_rate (abaikan non-finite)
  const validDs = withD.map(p => p.dSoC_dt).filter(d => Number.isFinite(d));
  const avg_rate = validDs.length ? (validDs.reduce((a,b)=>a+b,0) / validDs.length) : 0;
  const estimate_20_80 = (avg_rate > 0) ? Math.round(60 / avg_rate) : null; // menit

  // metadata grup
  const groupMeta = {
    group_id,
    charger: rawRows[0].charger || '',
    hp_brand: rawRows[0].hp_brand || '',
    charger_type: rawRows[0].charger_type || '',
    charger_price: rawRows[0].charger_price || 0,
    uploader: rawRows[0].uploader || uploaderName,
    timestamp,
    avg_rate,
    estimate_20_80,
    points: withD // setiap point: {time_min, soc_percent, dSoC_dt}
  };

  // simpan ke localStorage (append)
  const groups = loadGroupsFromLocal();
  groups.unshift(groupMeta); // tambah di awal
  saveGroupsToLocal(groups);
  groupsCache = groups;

  uploadStatus.textContent = `Unggah berhasil — data disimpan sebagai group: ${group_id}`;
  // reset preview UI sedikit
  setTimeout(()=>{ uploadStatus.textContent = ''; }, 4000);

  // refresh tampilan
  populateFilters(groups);
  populateTable(groups);
  populateGroupSelect(groups);
  renderCharts(groups);

  // otomatis scroll ke tabel
  document.getElementById('tableSection').scrollIntoView({behavior:'smooth'});
});

/* ---------- Render & UI helpers ---------- */
function populateFilters(groups){
  const brands = new Set();
  const types = new Set();
  const uploaders = new Set();
  groups.forEach(g => { brands.add(g.hp_brand); types.add(g.charger_type); uploaders.add(g.uploader); });

  fillSelect(filterBrand, [''].concat([...brands]));
  fillSelect(filterChgType, [''].concat([...types]));
  fillSelect(filterUploader, [''].concat([...uploaders]));
}

function fillSelect(selectEl, items){
  const cur = selectEl.value;
  selectEl.innerHTML = '';
  items.forEach(it => {
    const opt = document.createElement('option'); opt.value = it; opt.textContent = it || '(Semua)'; selectEl.appendChild(opt);
  });
  selectEl.value = cur || '';
}

function populateTable(groups){
  summaryBody.innerHTML = '';
  if(!groups || groups.length === 0){
    summaryBody.innerHTML = `<tr><td class="p-3 empty-state" colspan="9">Belum ada data — unggah CSV untuk memulai</td></tr>`;
    return;
  }

  groups.forEach(g => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${escapeHtml(g.charger)}</td>
      <td class="p-2">${escapeHtml(g.hp_brand)}</td>
      <td class="p-2">${escapeHtml(g.charger_type)}</td>
      <td class="p-2">${Number(g.charger_price).toLocaleString('id-ID')}</td>
      <td class="p-2">${escapeHtml(g.uploader)}</td>
      <td class="p-2">${new Date(g.timestamp).toLocaleString('id-ID')}</td>
      <td class="p-2">${(g.avg_rate||0).toFixed(3)}</td>
      <td class="p-2">${g.estimate_20_80 || '-'}</td>
      <td class="p-2">
        <button data-id="${g.group_id}" class="btnShare px-2 py-1 bg-blue-500 text-white rounded">Bagikan</button>
        <button data-id="${g.group_id}" class="btnDownload px-2 py-1 bg-gray-700 text-white rounded ml-2">Unduh CSV</button>
      </td>
    `;
    summaryBody.appendChild(tr);
  });

  // aksi tombol
  document.querySelectorAll('.btnShare').forEach(b => b.addEventListener('click', (e)=>{
    const id = e.target.dataset.id;
    const url = location.origin + location.pathname + '?group=' + encodeURIComponent(id);
    // salin ke clipboard jika tersedia
    if(navigator.clipboard){
      navigator.clipboard.writeText(url).then(()=>{ alert('URL grup disalin ke clipboard'); }).catch(()=>{ prompt('Salin URL ini:', url); });
    } else {
      prompt('Salin URL ini:', url);
    }
  }));

  document.querySelectorAll('.btnDownload').forEach(b => b.addEventListener('click', (e)=>{
    const id = e.target.dataset.id;
    const group = groupsCache.find(x => x.group_id === id);
    if(!group){ alert('Group tidak ditemukan'); return; }
    const csv = processedPointsToCSV(group.points);
    downloadTextFile(csv, `${id}_processed.csv`);
  }));
}

function populateGroupSelect(groups){
  selectGroup.innerHTML = '';
  const optAll = document.createElement('option'); optAll.value='all'; optAll.textContent='Tampilkan semua'; selectGroup.appendChild(optAll);
  groups.forEach(g => {
    const opt = document.createElement('option'); opt.value = g.group_id; opt.textContent = `${g.charger} — ${g.hp_brand} — ${g.uploader}`;
    selectGroup.appendChild(opt);
  });
}

/* ---------- Chart rendering ---------- */
function renderCharts(groups){
  // apply filters
  const filtered = applyFilters(groups);
  const datasetsSoC = [];
  const datasetsD = [];

  filtered.forEach((g, idx) => {
    const times = g.points.map(p => Number(p.time_min));
    const socs = g.points.map(p => Number(p.soc_percent));
    const ds = g.points.map(p => Number(p.dSoC_dt || 0));

    datasetsSoC.push({
      label: `${g.charger} | ${g.hp_brand} | ${g.uploader}`,
      data: times.map((t,i)=>({x:t,y:socs[i]})),
      tension: 0.2,
      borderWidth: 2,
      // color otomatis oleh Chart.js default pallete
    });
    datasetsD.push({
      label: `${g.charger} | ${g.hp_brand} | ${g.uploader}`,
      data: times.map((t,i)=>({x:t,y:ds[i]})),
      tension: 0.2,
      borderWidth: 2,
    });
  });

  const ctxSoC = document.getElementById('chartSoC').getContext('2d');
  const ctxD = document.getElementById('chartD').getContext('2d');

  if(chartSoC) chartSoC.destroy();
  if(chartD) chartD.destroy();

  chartSoC = new Chart(ctxSoC, {
    type: 'line',
    data: { datasets: datasetsSoC },
    options: {
      parsing: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context){
              const x = context.parsed.x; const y = context.parsed.y;
              return `SoC: ${y}% (t=${x} menit)`;
            }
          }
        }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'waktu (menit)' } },
        y: { title: { display: true, text: 'SoC (%)' } }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });

  chartD = new Chart(ctxD, {
    type: 'line',
    data: { datasets: datasetsD },
    options: {
      parsing: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context){
              const x = context.parsed.x; const y = context.parsed.y;
              return `Laju: ${Number(y).toFixed(3)} %/menit (t=${x} menit)`;
            }
          }
        }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'waktu (menit)' } },
        y: { title: { display: true, text: 'Laju (%/menit)' } }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
}

/* ---------- Utilities ---------- */
function processedPointsToCSV(points){
  const header = ['time_min','soc_percent','dSoC_dt'];
  const lines = [header.join(',')];
  points.forEach(p => {
    const row = [p.time_min, p.soc_percent, p.dSoC_dt];
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

function downloadTextFile(text, filename){
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function escapeHtml(s){
  if(!s && s !== 0) return '';
  return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
}

/* ---------- Filter logic ---------- */
function applyFilters(groups){
  if(!groups) return [];
  let out = groups.slice();

  const brand = filterBrand.value;
  const type = filterChgType.value;
  const uploader = filterUploader.value;
  const minP = filterPriceMin.value ? Number(filterPriceMin.value) : null;
  const maxP = filterPriceMax.value ? Number(filterPriceMax.value) : null;
  const selGroup = selectGroup.value;

  if(brand) out = out.filter(g => g.hp_brand === brand);
  if(type) out = out.filter(g => g.charger_type === type);
  if(uploader) out = out.filter(g => g.uploader === uploader);
  if(minP !== null) out = out.filter(g => Number(g.charger_price) >= minP);
  if(maxP !== null) out = out.filter(g => Number(g.charger_price) <= maxP);
  if(selGroup && selGroup !== 'all') out = out.filter(g => g.group_id === selGroup);

  return out;
}

/* ---------- Init: load saved groups dan handlers ---------- */
async function init(){
  groupsCache = loadGroupsFromLocal();
  populateFilters(groupsCache);
  populateTable(groupsCache);
  populateGroupSelect(groupsCache);
  renderCharts(groupsCache);

  // attach filter change listeners
  [filterBrand, filterChgType, filterUploader, filterPriceMin, filterPriceMax, selectGroup].forEach(el => {
    el.addEventListener('change', () => renderCharts(groupsCache));
  });

  // Jika URL memiliki ?group=ID, fokus ke grup tersebut
  const params = new URLSearchParams(location.search);
  const gid = params.get('group');
  if(gid){
    selectGroup.value = gid;
    renderCharts(groupsCache);
    // highlight row jika ada
  }
}
window.addEventListener('load', init);
