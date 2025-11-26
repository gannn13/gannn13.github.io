// ========================================
// CHARGER EFFICIENCY DASHBOARD – FULL JS
// ========================================

let rawData = [];        // semua dataset dari semua upload
let filteredData = [];
let socChart, rateChart;
const colors = ['#3b82f6','ef4444','10b981','f59e0b','8b5cf6','ec4899','06b6d4','f97316'];

// Dark mode toggle
document.getElementById('themeBtn').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  document.getElementById('themeBtn').innerHTML = document.documentElement.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
});
if (localStorage.theme === 'dark') document.documentElement.classList.add('dark');

// Mobile menu
document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Inisialisasi slider
noUiSlider.create(document.getElementById('priceSlider'), {
  start: [0, 1000000],
  connect: true,
  step: 10000,
  range: { min: 0, max: 1000000 },
  format: { to: v => Math.round(v).toLocaleString('id-ID'), from: v => Number(v) }
});
document.getElementById('priceSlider').noUiSlider.on('update', (values) => {
  document.getElementById('priceText').textContent = values[0] + ' – ' + values[1];
});

noUiSlider.create(document.getElementById('timeSlider'), {
  start: [0, 120],
  connect: true,
  step: 1,
  range: { min: 0, max: 120 }
});

// Sample data (langsung muncul saat pertama buka)
const sampleCSV = `charger,time_min,soc_percent,hp_brand,charger_type,charger_price,uploader
Anker PowerPort,0,10,Xiaomi 13,PD 65W,350000,Budi
Anker PowerPort,5,28,Xiaomi 13,PD 65W,350000,Budi
Anker PowerPort,10,51,Xiaomi 13,PD 65W,350000,Budi
Anker PowerPort,15,72,Xiaomi 13,PD 65W,350000,Budi
Baseus GaN,0,15,Samsung S23,QC 4.0 25W,180000,Citra
Baseus GaN,10,38,Samsung S23,QC 4.0 25W,180000,Citra
Baseus GaN,20,65,Samsung S23,QC 4.0 25W,180000,Citra
Original Apple,0,20,iPhone 14,Lightning 20W,450000,Dewi
Original Apple,15,55,iPhone 14,Lightning 20W,450000,Dewi
Original Apple,30,82,iPhone 14,Lightning 20W,450000,Dewi
`;

Papa.parse(sampleCSV, {
  header: true,
  complete: (res) => {
    rawData = groupAndProcess(res.data);
    updateEverything();
  }
});

// Upload CSV
document.getElementById('csvInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      if (!validateHeaders(result.meta.fields)) {
        alert('Header CSV salah! Wajib: charger,time_min,soc_percent,hp_brand,charger_type,charger_price,uploader');
        return;
      }
      const needsName = result.data.some(row => !row.uploader || row.uploader.trim() === '');
      if (needsName) {
        currentParseResult = result.data;
        document.getElementById('nameModal').classList.remove('hidden');
      } else {
        addNewData(result.data);
      }
    }
  });
});

let currentParseResult = null;
function closeNameModal() { document.getElementById('nameModal').classList.add('hidden'); }
function processUpload() {
  const name = document.getElementById('uploaderName').value.trim() || 'Anonymous';
  currentParseResult.forEach(row => row.uploader = name);
  addNewData(currentParseResult);
  closeNameModal();
}

function validateHeaders(fields) {
  const req = ['charger','time_min','soc_percent','hp_brand','charger_type','charger_price'];
  return req.every(h => fields.map(f=>f.toLowerCase()).includes(h.toLowerCase()));
}

function addNewData(newRows) {
  newRows.forEach(r => {
    r.time_min = Number(r.time_min);
    r.soc_percent = Number(r.soc_percent);
    r.charger_price = Number(r.charger_price) || 0;
  });
  const grouped = groupAndProcess(newRows);
  rawData.push(...Object.values(grouped));
  updateEverything();
  alert('Upload berhasil! Data sudah ditambahkan ke dashboard publik');
}

// Grouping + Turunan Numerik
function groupAndProcess(rows) {
  const map = {};
  rows.forEach(row => {
    const key = `${row.charger}|${row.hp_brand}|${row.charger_type}|${row.charger_price}|${row.uploader}`;
    if (!map[key]) map[key] = [];
    map[key].push(row);
  });

  const result = [];
  Object.values(map).forEach(arr => {
    arr.sort((a,b) => a.time_min - b.time_min);
    // Hapus duplikat waktu
    const clean = [];
    arr.forEach(p => {
      const existing = clean.find(x => x.time_min === p.time_min);
      if (existing) existing.soc_percent = (existing.soc_percent + p.soc_percent)/2;
      else clean.push(p);
    });

    // Hitung turunan central difference
    const points = clean.map(p => ({t: p.time_min, s: p.soc_percent}));
    const derivative = [];
    for (let i = 0; i < points.length; i++) {
      if (i === 0) derivative.push((points[1].s - points[0].s)/(points[1].t - points[0].t));
      else if (i === points.length-1) derivative.push((points[i].s - points[i-1].s)/(points[i].t - points[i-1].t));
      else derivative.push((points[i+1].s - points[i-1].s)/(points[i+1].t - points[i-1].t));
    }

    result.push({
      key: key,
      label: `${arr[0].charger} – ${arr[0].hp_brand} (${arr[0].charger_type})`,
      price: arr[0].charger_price,
      uploader: arr[0].uploader,
      points: points,
      derivative: derivative,
      color: '#'+colors[result.length % colors.length]
    });
  });
  return result;
}

// Update semua komponen
function updateEverything() {
  updateFilters();
  applyFilters();
  renderSummary();
}

// Filter
function applyFilters() {
  const brand = document.getElementById('filterBrand').value;
  const type = document.getElementById('filterType').value;
  const [minP, maxP] = document.getElementById('priceSlider').noUiSlider.get();
  const uploader = document.getElementById('filterUploader').value;
  const [minT, maxT] = document.getElementById('timeSlider').noUiSlider.get();

  filteredData = rawData.filter(d => {
    if (brand !== 'Semua HP' && !d.label.includes(brand)) return false;
    if (type !== 'Semua Tipe Charger' && !d.label.includes(type)) return false;
    if (d.price < minP || d.price > maxP) return false;
    if (uploader !== 'Semua Uploader' && d.uploader !== uploader) return false;
    return true;
  });

  renderCharts();
}

function updateFilters() {
  const brands = [...new Set(rawData.map(d => d.label.split(' – ')[1].split(' (')[0]))];
  const types = [...new Set(rawData.map(d => d.label.split('(')[1].slice(0,-1)))];
  const uploaders = [...new Set(rawData.map(d => d.uploader))];

  const brandSel = document.getElementById('filterBrand');
  brandSel.innerHTML = '<option>Semua HP</option>';
  brands.forEach(b => { const opt = document.createElement('option'); opt.textContent = b; brandSel.append(opt); });

  const typeSel = document.getElementById('filterType');
  typeSel.innerHTML = '<option>Semua Tipe Charger</option>';
  types.forEach(t => { const opt = document.createElement('option'); opt.textContent = t; typeSel.append(opt); });

  const upSel = document.getElementById('filterUploader');
  upSel.innerHTML = '<option>Semua Uploader</option>';
  uploaders.forEach(u => { const opt = document.createElement('option'); opt.textContent = u; upSel.append(opt); });
}

// Render Summary Cards
function renderSummary() {
  const container = document.getElementById('summaryContainer');
  container.innerHTML = '';
  filteredData.forEach(d => {
    const avgRate = d.derivative.reduce((a,b)=>a+b,0)/d.derivative.length).toFixed(2);
    const status = avgRate > 1.8 ? 'Fast' : avgRate > 1 ? 'Moderate' : 'Slow';
    const colorClass = status === 'Fast' ? 'text-green-600' : status === 'Moderate' ? 'text-yellow-600' : 'text-red-600';

    const card = document.createElement('div');
    card.className = 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-xl shadow';
    card.innerHTML = `
      <p class="font-bold text-lg">${d.label}</p>
      <p class="text-sm">Uploader: ${d.uploader}</p>
      <p class="text-3xl font-black mt-3 ${colorClass}">${avgRate} %/min</p>
      <p class="text-sm">Status: <span class="font-bold">${status}</span></p>
      <p class="text-sm">Harga: Rp ${d.price.toLocaleString('id-ID')}</p>
    `;
    container.appendChild(card);
  });
}

// Render Charts
function renderCharts() {
  const ctx1 = document.getElementById('socChart').getContext('2d');
  const ctx2 = document.getElementById('rateChart').getContext('2d');
  const [minT, maxT] = document.getElementById('timeSlider').noUiSlider.get();
  const smoothing = document.getElementById('smoothing').checked;

  const datasetsSoc = [];
  const datasetsRate = [];

  filteredData.forEach((d, i) => {
    let t = d.points.map(p => p.t);
    let s = d.points.map(p => p.s);
    let r = [...d.derivative];

    // Smoothing optional
    if (smoothing) {
      s = movingAverage(s, 3);
      r = movingAverage(r, 3);
    }

    // Filter waktu
    const filtered = t.map((time, idx) => ({t: time, s: s[idx], r: r[idx]})).filter(p => p.t >= minT && p.t <= maxT);

    datasetsSoc.push({
      label: d.label,
      data: filtered.map(p => ({x: p.t, y: p.s})),
      borderColor: d.color,
      backgroundColor: d.color + '20',
      tension: 0.3,
      fill: false
    });

    datasetsRate.push({
      label: d.label,
      data: filtered.map(p => ({x: p.t, y: p.r})),
      borderColor: d.color,
      backgroundColor: d.color + '40',
      tension: 0.2,
      fill: false
    });
  });

  if (socChart) socChart.destroy();
  if (rateChart) rateChart.destroy();

  socChart = new Chart(ctx1, { type: 'line', data: {datasets: datasetsSoc}, options: chartOptions('Waktu (menit)', 'SoC (%)') });
  rateChart = new Chart(ctx2, { type: 'line', data: {datasets: datasetsRate}, options: chartOptions('Waktu (menit)', 'dSoC/dt (%/menit)') });
}

function chartOptions(xlabel, ylabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false }},
    scales: {
      x: { title: { display: true, text: xlabel }},
      y: { title: { display: true, text: ylabel }}
    }
  };
}

function movingAverage(arr, window) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i-window+1); j <= Math.min(arr.length-1, i+window-1); j++) {
      sum += arr[j]; count++;
    }
    result.push(sum/count);
  }
  return result;
}

// Download CSV
document.getElementById('downloadBtn').addEventListener('click', () => {
  let csv = 'charger,hp_brand,charger_type,charger_price,uploader,time_min,soc_percent,dSoC_dt\n';
  filteredData.forEach(d => {
    d.points.forEach((p, i) => {
      csv += `${d.label.split(' – ')[0]},${d.label.split(' – ')[1].split(' (')[0]},${d.label.split('(')[1].slice(0,-1)},${d.price},${d.uploader},${p.t},${p.s},${d.derivative[i].toFixed(3)}\n`;
    });
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'charger_analysis_with_derivative.csv';
  a.click();
});

// Event listener filter
document.getElementById('refreshBtn').addEventListener('click', applyFilters);
document.getElementById('smoothing').addEventListener('change', renderCharts);
document.getElementById('filterBrand').addEventListener('change', applyFilters);
document.getElementById('filterType').addEventListener('change', applyFilters);
document.getElementById('filterUploader').addEventListener('change', applyFilters);
document.getElementById('priceSlider').noUiSlider.on('change', applyFilters);
document.getElementById('timeSlider').noUiSlider.on('change', renderCharts);

// Jalankan pertama kali
updateEverything();
