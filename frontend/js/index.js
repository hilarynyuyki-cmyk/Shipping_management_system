
/* ═══════════════════════════════════════════════════════════════
   MARINEOS v2 — MARITIME SHIPPING MANAGEMENT SYSTEM
   app.js — Complete Frontend Application Logic
   Group 4 · Database Design & Implementation · May 2026

   HOW TO CONNECT TO YOUR POSTGRESQL DATABASE:
   ─────────────────────────────────────────────
   1. Make sure your backend server is running (node server.js)
   2. The API_BASE_URL below must match your server address
   3. Open index.html in your browser
   4. The status pill top-right shows connection status
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════
   CONFIGURATION
══════════════════════════════════════════════ */
const API_BASE_URL  = 'http://localhost:3000/api';
const USE_MOCK_ONLY = false;   // set true to always use mock data

/* ══════════════════════════════════════════════
   MOCK DATA
   Mirrors exactly what PostgreSQL returns.
   Used when backend is not running.
══════════════════════════════════════════════ */
const MOCK = {

  vessels: [
    { vessel_id:1, IMO_number:'IMO1234567', vessel_name:'MSC Aurora',   vessel_type:'Container Ship', flag_country:'Panama',           gross_tonnage:85000,  max_capacity_TEU:8000,  current_status:'At Sea',  build_year:2018, owner_company:'MSC Group' },
    { vessel_id:2, IMO_number:'IMO2345678', vessel_name:'Cape Eagle',   vessel_type:'Bulk Carrier',   flag_country:'Liberia',          gross_tonnage:62000,  max_capacity_TEU:4500,  current_status:'In Port', build_year:2015, owner_company:'Cape Shipping Ltd' },
    { vessel_id:3, IMO_number:'IMO3456789', vessel_name:'Atlantic Sun', vessel_type:'Container Ship', flag_country:'Marshall Islands', gross_tonnage:95000,  max_capacity_TEU:10000, current_status:'Docked',  build_year:2020, owner_company:'Atlantic Lines' }
  ],

  voyages: [
    { voyage_id:1, voyage_code:'VOY-2026-001', vessel_name:'MSC Aurora', origin:'Durban', destination:'Rotterdam', departure_datetime:'2026-06-01T08:00', estimated_arrival:'2026-06-17T14:00', total_distance_nm:6842.5, status:'Scheduled' },
    { voyage_id:2, voyage_code:'VOY-2026-002', vessel_name:'Cape Eagle',  origin:'Lagos',  destination:'Singapore', departure_datetime:'2026-06-05T06:00', estimated_arrival:'2026-06-25T10:00', total_distance_nm:9200,   status:'Scheduled' }
  ],

  warehouses: [
    { warehouse_id:1, warehouse_code:'DUR-WH-001', warehouse_name:'Durban Gateway Warehouse A', port_name:'Port of Durban',    port_id:1, city:'Durban',     country:'South Africa', warehouse_type:'General',      capacity_tonnes:15000, current_load_tonnes:4200,  status:'Operational', manager_name:'Nomsa Dube',    contact_number:'+27 31 000 0001', email:'wh-a@durban-port.co.za' },
    { warehouse_id:2, warehouse_code:'DUR-WH-002', warehouse_name:'Durban Cold Store B',        port_name:'Port of Durban',    port_id:1, city:'Durban',     country:'South Africa', warehouse_type:'Refrigerated', capacity_tonnes:5000,  current_load_tonnes:1800,  status:'Operational', manager_name:'Nomsa Dube',    contact_number:'+27 31 000 0002', email:'wh-b@durban-port.co.za' },
    { warehouse_id:3, warehouse_code:'RTM-WH-001', warehouse_name:'Rotterdam Bonded Warehouse', port_name:'Port of Rotterdam', port_id:2, city:'Rotterdam',  country:'Netherlands',  warehouse_type:'Bonded',       capacity_tonnes:25000, current_load_tonnes:12000, status:'Operational', manager_name:'Pieter de Boer', contact_number:'+31 10 000 0001', email:'wh@rotterdam-port.nl' },
    { warehouse_id:4, warehouse_code:'LGS-WH-001', warehouse_name:'Lagos Hazmat Store',         port_name:'Port of Lagos',     port_id:3, city:'Lagos',      country:'Nigeria',       warehouse_type:'Hazmat',       capacity_tonnes:3000,  current_load_tonnes:500,   status:'Operational', manager_name:null,             contact_number:'+234 1 000 0001', email:'hazmat@lagos-port.ng' }
  ],

  shipments: [
    { shipment_id:1, customer_name:'John Mokoena',   voyage_code:'VOY-2026-001', cargo_type:'Electronics', total_weight_kg:5000, booking_date:'2026-05-28', status:'Booked',       origin:'Durban',    destination:'Rotterdam', warehouse_id:1, warehouse_name:'Durban Gateway Warehouse A' },
    { shipment_id:2, customer_name:'Fatima Al-Said', voyage_code:'VOY-2026-001', cargo_type:'Textiles',    total_weight_kg:3200, booking_date:'2026-05-28', status:'In Warehouse', origin:'Durban',    destination:'Rotterdam', warehouse_id:2, warehouse_name:'Durban Cold Store B' }
  ],

  ports: [
    { port_id:1, port_code:'ZADUR', port_name:'Port of Durban',    city:'Durban',    country:'South Africa', latitude:-29.858680, longitude:31.021840,  max_vessel_capacity:45,  warehouse_count:2 },
    { port_id:2, port_code:'NLRTM', port_name:'Port of Rotterdam', city:'Rotterdam', country:'Netherlands',  latitude:51.922500,  longitude:4.479200,   max_vessel_capacity:120, warehouse_count:1 },
    { port_id:3, port_code:'NGLOS', port_name:'Port of Lagos',     city:'Lagos',     country:'Nigeria',      latitude:6.453060,   longitude:3.394690,   max_vessel_capacity:30,  warehouse_count:1 },
    { port_id:4, port_code:'SGSIN', port_name:'Port of Singapore', city:'Singapore', country:'Singapore',    latitude:1.264370,   longitude:103.820570, max_vessel_capacity:200, warehouse_count:0 }
  ],

  customers: [
    { customer_id:1, full_name:'John Mokoena',   company_name:'Mokoena Exports Ltd',  email:'john@mokoena.co.za',    country:'South Africa', account_status:'Active', created_at:'2026-01-15' },
    { customer_id:2, full_name:'Fatima Al-Said',  company_name:'AlSaid Trading Co',    email:'fatima@alsaid.ae',      country:'UAE',          account_status:'Active', created_at:'2026-02-10' },
    { customer_id:3, full_name:'Lars Eriksson',   company_name:'Nordic Freight AB',    email:'lars@nordicfreight.se', country:'Sweden',        account_status:'Active', created_at:'2026-03-05' }
  ],

  employees: [
    { employee_id:1, full_name:'Sipho Dlamini',    role:'Port Officer',      email:'sipho@durban-port.co.za',  port_name:'Port of Durban',    is_active:true, hire_date:'2020-03-15' },
    { employee_id:2, full_name:'Jan van der Berg', role:'Customs Agent',     email:'jan@rotterdam-port.nl',    port_name:'Port of Rotterdam', is_active:true, hire_date:'2019-07-01' },
    { employee_id:3, full_name:'Admin User',        role:'Admin',             email:'admin@maritime.com',       port_name:'Port of Durban',    is_active:true, hire_date:'2018-01-01' },
    { employee_id:4, full_name:'Chidi Okonkwo',    role:'Port Officer',      email:'chidi@lagos-port.ng',      port_name:'Port of Lagos',     is_active:true, hire_date:'2021-06-10' },
    { employee_id:5, full_name:'Nomsa Dube',        role:'Warehouse Manager', email:'nomsa@durban-wh.co.za',    port_name:'Port of Durban',    is_active:true, hire_date:'2022-01-20' },
    { employee_id:6, full_name:'Pieter de Boer',   role:'Warehouse Manager', email:'pieter@rtm-wh.nl',         port_name:'Port of Rotterdam', is_active:true, hire_date:'2020-09-15' }
  ],

  bol: [
    { bol_id:1, bol_number:'BOL-2026-00001', shipment_id:1, shipper:'John Mokoena',   issue_date:'2026-05-28', total_weight_kg:5000, declared_value_usd:250000, status:'Issued' },
    { bol_id:2, bol_number:'BOL-2026-00002', shipment_id:2, shipper:'Fatima Al-Said', issue_date:'2026-05-28', total_weight_kg:3200, declared_value_usd:85000,  status:'Draft' }
  ],

  invoices: [
    { invoice_id:1, shipment_id:1, customer:'John Mokoena',   amount_usd:18500, due_date:'2026-06-30', payment_status:'Unpaid', payment_method:null },
    { invoice_id:2, shipment_id:2, customer:'Fatima Al-Said', amount_usd:12000, due_date:'2026-06-30', payment_status:'Unpaid', payment_method:null }
  ],

  customs: [
    { clearance_id:1, shipment_id:1, port_name:'Port of Rotterdam', officer:'Jan van der Berg', submission_date:'2026-06-17', clearance_date:null, status:'Pending' },
    { clearance_id:2, shipment_id:2, port_name:'Port of Rotterdam', officer:'Jan van der Berg', submission_date:'2026-06-17', clearance_date:null, status:'Pending' }
  ],

  manifests: [
    { manifest_id:1, voyage_code:'VOY-2026-001', container_code:'MSCU1234567', cargo_description:'Consumer electronics — laptops and mobile devices', weight_kg:5000, hazmat_flag:false, hazmat_class:null },
    { manifest_id:2, voyage_code:'VOY-2026-001', container_code:'MSCU7654321', cargo_description:'Woven textiles and garments',                       weight_kg:3200, hazmat_flag:false, hazmat_class:null }
  ],

  containers: [
    { container_id:1, container_code:'MSCU1234567', container_type:'40ft', max_weight_kg:28000, current_weight_kg:5000, shipment_id:1, vessel_name:'MSC Aurora', warehouse_name:null,                        status:'In Transit' },
    { container_id:2, container_code:'MSCU7654321', container_type:'20ft', max_weight_kg:14000, current_weight_kg:3200, shipment_id:2, vessel_name:null,          warehouse_name:'Durban Cold Store B',       status:'In Warehouse' }
  ],

  gps: [
    { position_id:1, vessel_name:'MSC Aurora', voyage_code:'VOY-2026-001', latitude:-29.858680, longitude:31.021840,  speed_knots:0.0,  heading_degrees:0.0,   recorded_at:'2026-06-01T08:00' },
    { position_id:2, vessel_name:'MSC Aurora', voyage_code:'VOY-2026-001', latitude:-27.123456, longitude:29.654321,  speed_knots:18.5, heading_degrees:345.0, recorded_at:'2026-06-02T10:00' },
    { position_id:3, vessel_name:'Cape Eagle',  voyage_code:'VOY-2026-002', latitude:6.453060,   longitude:3.394690,   speed_knots:0.0,  heading_degrees:0.0,   recorded_at:'2026-06-05T06:00' }
  ],

  tracking: [
    { event_id:1, shipment_id:1, event_type:'Booked',             port_name:'Port of Durban',    warehouse_name:null,                      recorded_by:'Sipho Dlamini',  event_datetime:'2026-05-28T09:00', description:'Shipment booked for VOY-2026-001' },
    { event_id:2, shipment_id:2, event_type:'Booked',             port_name:'Port of Durban',    warehouse_name:null,                      recorded_by:'Sipho Dlamini',  event_datetime:'2026-05-28T09:15', description:'Shipment booked for VOY-2026-001' },
    { event_id:3, shipment_id:1, event_type:'Moved to Warehouse', port_name:'Port of Durban',    warehouse_name:'Durban Gateway Warehouse A', recorded_by:'Nomsa Dube', event_datetime:'2026-05-30T07:00', description:'Cargo moved to warehouse pending loading' },
    { event_id:4, shipment_id:1, event_type:'Departed',           port_name:'Port of Durban',    warehouse_name:null,                      recorded_by:'Sipho Dlamini',  event_datetime:'2026-06-01T08:00', description:'Vessel MSC Aurora departed Port of Durban' }
  ]
};

/* ══════════════════════════════════════════════
   API LAYER
   All calls go to Node.js/Express backend
   which queries your PostgreSQL database.
══════════════════════════════════════════════ */

async function apiGet(endpoint) {
  if (USE_MOCK_ONLY) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] GET ${endpoint} — using mock:`, err.message);
    return null;
  }
}

async function apiPost(endpoint, data) {
  if (USE_MOCK_ONLY) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] POST ${endpoint}:`, err.message);
    return null;
  }
}

async function apiPut(endpoint, data) {
  if (USE_MOCK_ONLY) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] PUT ${endpoint}:`, err.message);
    return null;
  }
}

async function apiDelete(endpoint) {
  if (USE_MOCK_ONLY) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] DELETE ${endpoint}:`, err.message);
    return null;
  }
}

async function checkConnection() {
  const el  = document.getElementById('db-status');
  const dot = document.querySelector('.status-dot');
  const pill = document.querySelector('.status-pill');
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      el.textContent = 'PostgreSQL Connected';
    } else throw new Error();
  } catch {
    el.textContent = 'Demo Mode';
    dot.style.background  = '#f59e0b';
    pill.style.background = 'rgba(245,158,11,0.1)';
    pill.style.borderColor= 'rgba(245,158,11,0.3)';
    pill.style.color      = '#92400e';
  }
}

/* ══════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════ */

let currentPage = 'dashboard';

const PAGE_TITLES = {
  dashboard:  'DASHBOARD',
  vessels:    'VESSELS',
  voyages:    'VOYAGES',
  gps:        'GPS TRACKER',
  shipments:  'SHIPMENTS',
  warehouses: 'WAREHOUSES',
  containers: 'CONTAINERS',
  manifests:  'CARGO MANIFEST',
  bol:        'BILLS OF LADING',
  invoices:   'FREIGHT INVOICES',
  customs:    'CUSTOMS CLEARANCE',
  ports:      'PORTS',
  customers:  'CUSTOMERS',
  employees:  'EMPLOYEES'
};

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (!pageEl) return;
  pageEl.classList.add('active');

  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page.toUpperCase();

  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
  }

  currentPage = page;
  loadPageData(page);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function initNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
  });
}

/* ══════════════════════════════════════════════
   DATA LOADERS
══════════════════════════════════════════════ */

function loadPageData(page) {
  const loaders = {
    dashboard:  loadDashboard,
    vessels:    loadVessels,
    voyages:    loadVoyages,
    gps:        loadGPS,
    shipments:  loadShipments,
    warehouses: loadWarehouses,
    containers: loadContainers,
    manifests:  loadManifests,
    bol:        loadBoL,
    invoices:   loadInvoices,
    customs:    loadCustoms,
    ports:      loadPorts,
    customers:  loadCustomers,
    employees:  loadEmployees
  };
  if (loaders[page]) loaders[page]();
}

/* ── DASHBOARD ── */
async function loadDashboard() {
  const [vessels, voyages, shipments, customers, customs, tracking, warehouses] = await Promise.all([
    apiGet('/vessels'),    apiGet('/voyages'),   apiGet('/shipments'),
    apiGet('/customers'),  apiGet('/customs'),   apiGet('/tracking'),
    apiGet('/warehouses')
  ]);

  const V  = vessels    || MOCK.vessels;
  const VO = voyages    || MOCK.voyages;
  const S  = shipments  || MOCK.shipments;
  const C  = customers  || MOCK.customers;
  const CU = customs    || MOCK.customs;
  const T  = tracking   || MOCK.tracking;
  const WH = warehouses || MOCK.warehouses;

  setText('stat-vessels',    V.length);
  setText('stat-voyages',    VO.length);
  setText('stat-shipments',  S.length);
  setText('stat-customers',  C.length);
  setText('stat-customs',    CU.filter(c => c.status === 'Pending').length);
  setText('stat-warehouses', WH.filter(w => w.status === 'Operational').length);
  setText('badge-shipments', S.length);

  /* Recent shipments */
  const sb = document.getElementById('recent-shipments-body');
  if (S.length === 0) {
    sb.innerHTML = emptyRow(5, 'No Shipments Yet', '📦');
  } else {
    sb.innerHTML = S.slice(0, 6).map(s => `
      <tr>
        <td><span class="mono">#${s.shipment_id}</span></td>
        <td style="color:var(--navy);font-weight:500">${s.customer_name}</td>
        <td>
          <div class="route-visual">
            <span class="route-port">${s.origin || '—'}</span>
            <span class="route-arrow">→</span>
            <span class="route-port">${s.destination || '—'}</span>
          </div>
        </td>
        <td>${s.warehouse_name
          ? `<span class="badge badge-warehouse" style="font-size:9px">🏭 ${s.warehouse_name}</span>`
          : '<span style="color:var(--muted);font-size:11px">—</span>'}</td>
        <td>${badge(s.status)}</td>
      </tr>`).join('');
  }

  /* Activity feed */
  const al = document.getElementById('activity-list');
  const DOT = {
    Booked:'#1565c0', Departed:'#0097a7', Arrived:'#2e7d32',
    'Moved to Warehouse':'#6a1b9a', 'Released from Warehouse':'#0097a7',
    'Customs Hold':'#f59e0b', Cleared:'#2e7d32', Delivered:'#2e7d32'
  };
  if (T.length === 0) {
    al.innerHTML = `<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">No Events Yet</div></div>`;
  } else {
    al.innerHTML = T.slice(0, 8).map(t => `
      <div class="activity-item">
        <div class="activity-dot" style="background:${DOT[t.event_type] || '#7a92a8'}"></div>
        <div>
          <div class="activity-text">
            <strong>Shipment #${t.shipment_id}</strong> — ${t.event_type}
            ${t.description ? `<br><span style="color:var(--muted);font-size:11px">${t.description}</span>` : ''}
          </div>
          <div class="activity-time">
            ${t.warehouse_name ? `🏭 ${t.warehouse_name}` : t.port_name || '—'}
            · ${fmtDate(t.event_datetime)} · ${t.recorded_by || '—'}
          </div>
        </div>
      </div>`).join('');
  }
}

/* ── VESSELS ── */
async function loadVessels() {
  const data = await apiGet('/vessels') || MOCK.vessels;
  const body = document.getElementById('vessels-body');
  setText('vessels-count', `${data.length} vessel${data.length !== 1 ? 's' : ''} registered`);
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Vessels Registered', '🚢'); return; }
  body.innerHTML = data.map(v => `
    <tr>
      <td><span class="mono">${v.IMO_number}</span></td>
      <td style="color:var(--navy);font-weight:500">${v.vessel_name}</td>
      <td>${v.vessel_type}</td>
      <td>${v.flag_country}</td>
      <td><span class="mono">${Number(v.max_capacity_TEU).toLocaleString()}</span></td>
      <td>${badge(v.current_status)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewDetail('Vessel',${v.vessel_id},'${v.vessel_name}')">View</button>
        <button class="btn btn-danger btn-sm" style="margin-left:4px" onclick="confirmDelete('vessels',${v.vessel_id},'${v.vessel_name}')">Delete</button>
      </td>
    </tr>`).join('');
}

/* ── VOYAGES ── */
async function loadVoyages() {
  const data = await apiGet('/voyages') || MOCK.voyages;
  const body = document.getElementById('voyages-body');
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Voyages Scheduled', '🗺'); return; }
  body.innerHTML = data.map(v => `
    <tr>
      <td><span class="mono" style="color:var(--navy);font-weight:600">${v.voyage_code}</span></td>
      <td style="color:var(--navy)">${v.vessel_name}</td>
      <td>
        <div class="route-visual">
          <span class="route-port">${v.origin}</span>
          <span class="route-arrow">→</span>
          <span class="route-port">${v.destination}</span>
        </div>
      </td>
      <td><span class="mono" style="font-size:11px">${fmtDate(v.departure_datetime)}</span></td>
      <td><span class="mono" style="font-size:11px">${fmtDate(v.estimated_arrival)}</span></td>
      <td><span class="mono">${Number(v.total_distance_nm).toLocaleString()} nm</span></td>
      <td>${badge(v.status)}</td>
    </tr>`).join('');
}

/* ── GPS ── */
async function loadGPS() {
  const [gpsData, ports] = await Promise.all([apiGet('/gps'), apiGet('/ports')]);
  const data     = gpsData || MOCK.gps;
  const portList = ports   || MOCK.ports;
  const body = document.getElementById('gps-body');
  body.innerHTML = data.map(p => `
    <tr>
      <td style="color:var(--navy);font-weight:500">${p.vessel_name}</td>
      <td><span class="mono">${p.voyage_code}</span></td>
      <td><span class="mono" style="color:var(--blue)">${parseFloat(p.latitude).toFixed(6)}</span></td>
      <td><span class="mono" style="color:var(--blue)">${parseFloat(p.longitude).toFixed(6)}</span></td>
      <td><span class="mono">${p.speed_knots}</span></td>
      <td><span class="mono">${p.heading_degrees}°</span></td>
      <td><span class="mono" style="font-size:10px;color:var(--muted)">${fmtDate(p.recorded_at)}</span></td>
    </tr>`).join('');
  renderGPSMap(data, portList);
  if (data.length > 0) selectVessel(data[data.length - 1]);
}

function renderGPSMap(positions, portList) {
  const map = document.getElementById('gps-map');
  map.querySelectorAll('.vessel-wrapper,.port-diamond,.port-label').forEach(e => e.remove());
  const W = map.offsetWidth  || 800;
  const H = map.offsetHeight || 280;

  portList.forEach(p => {
    const x = clamp(((parseFloat(p.longitude) + 180) / 360) * W, 12, W - 50);
    const y = clamp(((90 - parseFloat(p.latitude)) / 180) * H, 18, H - 14);
    const lbl = mkEl('div', 'port-label', p.port_code);
    lbl.style.cssText = `left:${x}px;top:${y - 16}px;position:absolute;`;
    const dot = mkEl('div', 'port-diamond');
    dot.style.cssText = `left:${x - 4}px;top:${y - 4}px;position:absolute;`;
    map.appendChild(lbl);
    map.appendChild(dot);
  });

  const latest = {};
  positions.forEach(p => { latest[p.vessel_name] = p; });
  Object.values(latest).forEach(pos => {
    const x = clamp(((parseFloat(pos.longitude) + 180) / 360) * W, 18, W - 18);
    const y = clamp(((90 - parseFloat(pos.latitude)) / 180) * H, 26, H - 18);
    const wrapper = mkEl('div', 'vessel-wrapper');
    wrapper.style.cssText = `position:absolute;left:${x}px;top:${y}px;`;
    const lbl = mkEl('div', 'vessel-label', pos.vessel_name);
    const dot = mkEl('div', 'vessel-dot');
    dot.title = pos.vessel_name;
    dot.addEventListener('click', () => selectVessel(pos));
    wrapper.appendChild(lbl);
    wrapper.appendChild(dot);
    map.appendChild(wrapper);
  });
}

function selectVessel(pos) {
  setText('gps-vessel',  pos.vessel_name);
  setText('gps-coords',  `${parseFloat(pos.latitude).toFixed(4)}, ${parseFloat(pos.longitude).toFixed(4)}`);
  setText('gps-speed',   `${pos.speed_knots} kts`);
  setText('gps-heading', `${pos.heading_degrees}°`);
}

/* ── SHIPMENTS ── */
async function loadShipments() {
  const data = await apiGet('/shipments') || MOCK.shipments;
  const body = document.getElementById('shipments-body');
  if (data.length === 0) { body.innerHTML = emptyRow(8, 'No Shipments Yet', '📦'); return; }
  body.innerHTML = data.map(s => `
    <tr>
      <td><span class="mono">#${s.shipment_id}</span></td>
      <td style="color:var(--navy);font-weight:500">${s.customer_name}</td>
      <td><span class="mono">${s.voyage_code}</span></td>
      <td>${s.cargo_type}</td>
      <td><span class="mono">${Number(s.total_weight_kg).toLocaleString()} kg</span></td>
      <td>${s.warehouse_name
        ? `<span class="badge badge-warehouse">🏭 ${s.warehouse_name}</span>`
        : '<span style="color:var(--muted)">—</span>'}</td>
      <td>${badge(s.status)}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="viewDetail('Shipment',${s.shipment_id},'Shipment #${s.shipment_id}')">View</button></td>
    </tr>`).join('');
}

/* ── WAREHOUSES (NEW) ── */
async function loadWarehouses() {
  const [whData, shipData] = await Promise.all([
    apiGet('/warehouses'),
    apiGet('/shipments')
  ]);
  const data    = whData   || MOCK.warehouses;
  const shipments= shipData || MOCK.shipments;

  /* Stats */
  setText('wh-total',       data.length);
  setText('wh-operational', data.filter(w => w.status === 'Operational').length);
  setText('wh-full',        data.filter(w => w.status === 'Full').length);
  const totalCap = data.reduce((a, w) => a + parseFloat(w.capacity_tonnes || 0), 0);
  setText('wh-capacity',    totalCap.toLocaleString());

  /* Main warehouse table */
  const body = document.getElementById('warehouses-body');
  if (data.length === 0) { body.innerHTML = emptyRow(9, 'No Warehouses Registered', '🏭'); }
  else {
    body.innerHTML = data.map(w => {
      const pct = Math.round((parseFloat(w.current_load_tonnes) / parseFloat(w.capacity_tonnes)) * 100);
      const fillClass = pct >= 90 ? 'high' : pct >= 60 ? 'medium' : 'low';
      return `
        <tr>
          <td><span class="mono" style="color:var(--warehouse)">${w.warehouse_code}</span></td>
          <td style="color:var(--navy);font-weight:500">${w.warehouse_name}</td>
          <td>${w.port_name}</td>
          <td><span class="badge ${whTypeBadge(w.warehouse_type)}">${w.warehouse_type}</span></td>
          <td><span class="mono">${Number(w.capacity_tonnes).toLocaleString()} t</span></td>
          <td>
            <div>
              <span class="mono" style="font-size:11px">${Number(w.current_load_tonnes).toLocaleString()} t (${pct}%)</span>
              <div class="capacity-bar"><div class="capacity-fill ${fillClass}" style="width:${pct}%"></div></div>
            </div>
          </td>
          <td>${w.manager_name || '<span style="color:var(--muted)">Unassigned</span>'}</td>
          <td>${badge(w.status)}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="viewWarehouseDetail(${w.warehouse_id},'${w.warehouse_name}')">View</button>
            <button class="btn btn-danger btn-sm" style="margin-left:4px" onclick="confirmDelete('warehouses',${w.warehouse_id},'${w.warehouse_name}')">Delete</button>
          </td>
        </tr>`;
    }).join('');
  }

  /* Shipments in warehouse */
  const whShipments = shipments.filter(s => s.warehouse_id || s.status === 'In Warehouse');
  const wsb = document.getElementById('wh-shipments-body');
  if (whShipments.length === 0) {
    wsb.innerHTML = emptyRow(6, 'No Shipments Currently In Warehouse', '📦');
  } else {
    wsb.innerHTML = whShipments.map(s => `
      <tr>
        <td><span class="mono">#${s.shipment_id}</span></td>
        <td style="color:var(--navy)">${s.customer_name}</td>
        <td>${s.warehouse_name
          ? `<span class="badge badge-warehouse">🏭 ${s.warehouse_name}</span>`
          : '<span style="color:var(--muted)">—</span>'}</td>
        <td>${s.cargo_type}</td>
        <td><span class="mono">${Number(s.total_weight_kg).toLocaleString()} kg</span></td>
        <td>${badge(s.status)}</td>
      </tr>`).join('');
  }
}

function whTypeBadge(type) {
  const map = {
    General:'badge-blue', Refrigerated:'badge-teal',
    Hazmat:'badge-red', Bonded:'badge-amber', 'Open Yard':'badge-grey'
  };
  return map[type] || 'badge-grey';
}

function viewWarehouseDetail(id, name) {
  toast('info', '🏭', `${name} — connect API to view full warehouse details`);
}

/* ── CONTAINERS ── */
async function loadContainers() {
  const data = await apiGet('/containers') || MOCK.containers;
  const body = document.getElementById('containers-body');
  if (data.length === 0) { body.innerHTML = emptyRow(8, 'No Containers Registered', '🗃'); return; }
  body.innerHTML = data.map(c => `
    <tr>
      <td><span class="mono" style="color:var(--blue)">${c.container_code}</span></td>
      <td>${c.container_type}</td>
      <td><span class="mono">${Number(c.max_weight_kg).toLocaleString()} kg</span></td>
      <td><span class="mono">${c.current_weight_kg ? Number(c.current_weight_kg).toLocaleString() + ' kg' : '—'}</span></td>
      <td>${c.shipment_id ? `<span class="mono">#${c.shipment_id}</span>` : '<span style="color:var(--muted)">—</span>'}</td>
      <td>${c.vessel_name || '<span style="color:var(--muted)">—</span>'}</td>
      <td>${c.warehouse_name
        ? `<span class="badge badge-warehouse">🏭 ${c.warehouse_name}</span>`
        : '<span style="color:var(--muted)">—</span>'}</td>
      <td>${badge(c.status)}</td>
    </tr>`).join('');
}

/* ── MANIFESTS ── */
async function loadManifests() {
  const data = await apiGet('/manifests') || MOCK.manifests;
  const body = document.getElementById('manifests-body');
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Manifests Yet', '📋'); return; }
  body.innerHTML = data.map(m => `
    <tr>
      <td><span class="mono">#${m.manifest_id}</span></td>
      <td><span class="mono">${m.voyage_code}</span></td>
      <td><span class="mono" style="color:var(--blue)">${m.container_code}</span></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.cargo_description}</td>
      <td><span class="mono">${Number(m.weight_kg).toLocaleString()} kg</span></td>
      <td>${m.hazmat_flag ? '<span class="badge badge-red">⚠ YES</span>' : '<span class="badge badge-green">No</span>'}</td>
      <td>${m.hazmat_class || '<span style="color:var(--muted)">—</span>'}</td>
    </tr>`).join('');
}

/* ── BILLS OF LADING ── */
async function loadBoL() {
  const data = await apiGet('/bol') || MOCK.bol;
  const body = document.getElementById('bol-body');
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Bills of Lading', '📄'); return; }
  body.innerHTML = data.map(b => `
    <tr>
      <td><span class="mono" style="color:var(--navy);font-weight:600">${b.bol_number}</span></td>
      <td><span class="mono">#${b.shipment_id}</span></td>
      <td>${b.shipper}</td>
      <td><span class="mono" style="font-size:11px">${fmtDate(b.issue_date)}</span></td>
      <td><span class="mono">${Number(b.total_weight_kg).toLocaleString()} kg</span></td>
      <td><span class="mono" style="color:var(--green)">$${Number(b.declared_value_usd).toLocaleString()}</span></td>
      <td>${badge(b.status)}</td>
    </tr>`).join('');
}

/* ── INVOICES ── */
async function loadInvoices() {
  const data = await apiGet('/invoices') || MOCK.invoices;
  const body = document.getElementById('invoices-body');
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Invoices Yet', '💳'); return; }
  body.innerHTML = data.map(i => `
    <tr>
      <td><span class="mono">#${i.invoice_id}</span></td>
      <td><span class="mono">#${i.shipment_id}</span></td>
      <td>${i.customer}</td>
      <td><span class="mono" style="color:var(--green);font-weight:600">$${Number(i.amount_usd).toLocaleString()}</span></td>
      <td><span class="mono" style="font-size:11px">${fmtDate(i.due_date)}</span></td>
      <td>${badge(i.payment_status)}</td>
      <td>${i.payment_method || '<span style="color:var(--muted)">—</span>'}</td>
    </tr>`).join('');
}

/* ── CUSTOMS ── */
async function loadCustoms() {
  const data = await apiGet('/customs') || MOCK.customs;
  const body = document.getElementById('customs-body');
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Clearance Records', '🛃'); return; }
  body.innerHTML = data.map(c => `
    <tr>
      <td><span class="mono">#${c.clearance_id}</span></td>
      <td><span class="mono">#${c.shipment_id}</span></td>
      <td>${c.port_name}</td>
      <td>${c.officer}</td>
      <td><span class="mono" style="font-size:10px">${fmtDate(c.submission_date)}</span></td>
      <td><span class="mono" style="font-size:10px">${c.clearance_date ? fmtDate(c.clearance_date) : '<span style="color:var(--muted)">Pending</span>'}</span></td>
      <td>${badge(c.status)}</td>
    </tr>`).join('');
}

/* ── PORTS ── */
async function loadPorts() {
  const data = await apiGet('/ports') || MOCK.ports;
  const body = document.getElementById('ports-body');
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Ports Registered', '⚓'); return; }
  body.innerHTML = data.map(p => `
    <tr>
      <td><span class="mono" style="color:var(--navy);font-weight:700">${p.port_code}</span></td>
      <td style="color:var(--navy);font-weight:500">${p.port_name}</td>
      <td>${p.city}</td>
      <td>${p.country}</td>
      <td><span class="mono" style="font-size:10px">${parseFloat(p.latitude).toFixed(4)}, ${parseFloat(p.longitude).toFixed(4)}</span></td>
      <td><span class="mono">${p.max_vessel_capacity || '—'}</span></td>
      <td>${p.warehouse_count > 0
        ? `<span class="badge badge-warehouse">🏭 ${p.warehouse_count}</span>`
        : '<span style="color:var(--muted)">0</span>'}</td>
    </tr>`).join('');
}

/* ── CUSTOMERS ── */
async function loadCustomers() {
  const data = await apiGet('/customers') || MOCK.customers;
  const body = document.getElementById('customers-body');
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Customers Yet', '👤'); return; }
  body.innerHTML = data.map(c => `
    <tr>
      <td><span class="mono">#${c.customer_id}</span></td>
      <td style="color:var(--navy);font-weight:500">${c.full_name}</td>
      <td style="color:var(--muted)">${c.company_name || '—'}</td>
      <td><span class="mono" style="font-size:11px">${c.email}</span></td>
      <td>${c.country}</td>
      <td>${badge(c.account_status)}</td>
      <td><span class="mono" style="font-size:10px;color:var(--muted)">${fmtDate(c.created_at)}</span></td>
    </tr>`).join('');
}

/* ── EMPLOYEES ── */
async function loadEmployees() {
  const data = await apiGet('/employees') || MOCK.employees;
  const body = document.getElementById('employees-body');
  const roleMap = {
    Admin:'badge-navy', 'Port Officer':'badge-blue',
    'Customs Agent':'badge-amber', Captain:'badge-teal',
    Analyst:'badge-grey', 'Warehouse Manager':'badge-warehouse'
  };
  if (data.length === 0) { body.innerHTML = emptyRow(7, 'No Employees Yet', '👷'); return; }
  body.innerHTML = data.map(e => `
    <tr>
      <td><span class="mono">#${e.employee_id}</span></td>
      <td style="color:var(--navy);font-weight:500">${e.full_name}</td>
      <td><span class="badge ${roleMap[e.role] || 'badge-grey'}">${e.role}</span></td>
      <td><span class="mono" style="font-size:11px">${e.email}</span></td>
      <td>${e.port_name || '—'}</td>
      <td>${e.is_active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-red">Inactive</span>'}</td>
      <td><span class="mono" style="font-size:10px;color:var(--muted)">${fmtDate(e.hire_date)}</span></td>
    </tr>`).join('');
}

/* ══════════════════════════════════════════════
   MODAL SYSTEM
══════════════════════════════════════════════ */

let currentModalType = null;

const MODAL_FORMS = {

  vessel: {
    title: 'Register New Vessel',
    html: `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Vessel Name *</label><input class="form-input" id="f-vessel_name" placeholder="MSC Aurora" required /></div>
        <div class="form-group"><label class="form-label">IMO Number * (UNIQUE)</label><input class="form-input" id="f-IMO_number" placeholder="IMO1234567" required /></div>
        <div class="form-group"><label class="form-label">Vessel Type *</label>
          <select class="form-select" id="f-vessel_type">
            <option>Container Ship</option><option>Bulk Carrier</option><option>Tanker</option><option>Ro-Ro</option>
          </select></div>
        <div class="form-group"><label class="form-label">Flag Country *</label><input class="form-input" id="f-flag_country" placeholder="Panama" required /></div>
        <div class="form-group"><label class="form-label">Gross Tonnage *</label><input class="form-input" id="f-gross_tonnage" type="number" placeholder="85000" required /></div>
        <div class="form-group"><label class="form-label">Max Capacity TEU *</label><input class="form-input" id="f-max_capacity_TEU" type="number" placeholder="8000" required /></div>
        <div class="form-group"><label class="form-label">Build Year</label><input class="form-input" id="f-build_year" type="number" placeholder="2018" /></div>
        <div class="form-group"><label class="form-label">Owner Company</label><input class="form-input" id="f-owner_company" placeholder="MSC Group" /></div>
      </div>`
  },

  voyage: {
    title: 'Schedule New Voyage',
    html: `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Voyage Code * (UNIQUE)</label><input class="form-input" id="f-voyage_code" placeholder="VOY-2026-003" required /></div>
        <div class="form-group"><label class="form-label">Vessel ID *</label><input class="form-input" id="f-vessel_id" type="number" placeholder="1" required /></div>
        <div class="form-group"><label class="form-label">Origin Port ID * (≠ Destination)</label><input class="form-input" id="f-origin_port_id" type="number" placeholder="1" required /></div>
        <div class="form-group"><label class="form-label">Destination Port ID *</label><input class="form-input" id="f-destination_port_id" type="number" placeholder="2" required /></div>
        <div class="form-group"><label class="form-label">Departure Date & Time *</label><input class="form-input" id="f-departure_datetime" type="datetime-local" required /></div>
        <div class="form-group"><label class="form-label">Distance (nautical miles)</label><input class="form-input" id="f-total_distance_nm" type="number" step="0.01" placeholder="6842.50" /></div>
      </div>`
  },

  shipment: {
    title: 'Book New Shipment',
    html: `
      <div class="form-note">⚡ ACID TRANSACTION — Shipment + Invoice created together or both rolled back (CIA Integrity)</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Customer ID *</label><input class="form-input" id="f-customer_id" type="number" placeholder="1" required /></div>
        <div class="form-group"><label class="form-label">Voyage ID *</label><input class="form-input" id="f-voyage_id" type="number" placeholder="1" required /></div>
        <div class="form-group"><label class="form-label">Origin Port ID *</label><input class="form-input" id="f-origin_port_id" type="number" placeholder="1" required /></div>
        <div class="form-group"><label class="form-label">Destination Port ID *</label><input class="form-input" id="f-destination_port_id" type="number" placeholder="2" required /></div>
        <div class="form-group"><label class="form-label">Warehouse ID (optional)</label><input class="form-input" id="f-warehouse_id" type="number" placeholder="Leave blank if not in warehouse" /></div>
        <div class="form-group"><label class="form-label">Cargo Type *</label><input class="form-input" id="f-cargo_type" placeholder="Electronics" required /></div>
        <div class="form-group"><label class="form-label">Weight (kg) * (CHECK > 0)</label><input class="form-input" id="f-total_weight_kg" type="number" step="0.01" placeholder="5000" required /></div>
        <div class="form-group"><label class="form-label">Invoice Amount USD * (CHECK >= 0)</label><input class="form-input" id="f-amount_usd" type="number" step="0.01" placeholder="18500" required /></div>
        <div class="form-group span2"><label class="form-label">Invoice Due Date *</label><input class="form-input" id="f-due_date" type="date" required /></div>
        <div class="form-group span2"><label class="form-label">Special Instructions</label><textarea class="form-textarea" id="f-special_instructions" placeholder="Refrigeration required, handle with care, etc."></textarea></div>
      </div>`
  },

  warehouse: {
    title: 'Add New Warehouse',
    html: `
      <div class="form-note-warehouse">🏭 NEW ENTITY — Warehouse links to Port and Employee. Tracks cargo location when not at sea. CIA Availability.</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Warehouse Name *</label><input class="form-input" id="f-warehouse_name" placeholder="Durban Gateway Warehouse A" required /></div>
        <div class="form-group"><label class="form-label">Warehouse Code * (UNIQUE)</label><input class="form-input" id="f-warehouse_code" placeholder="DUR-WH-003" required /></div>
        <div class="form-group"><label class="form-label">Port ID * (FK → Port)</label><input class="form-input" id="f-port_id" type="number" placeholder="1" required /></div>
        <div class="form-group"><label class="form-label">Warehouse Type *</label>
          <select class="form-select" id="f-warehouse_type">
            <option>General</option><option>Refrigerated</option><option>Hazmat</option><option>Bonded</option><option>Open Yard</option>
          </select></div>
        <div class="form-group"><label class="form-label">Capacity (tonnes) * (CHECK > 0)</label><input class="form-input" id="f-capacity_tonnes" type="number" step="0.01" placeholder="15000" required /></div>
        <div class="form-group"><label class="form-label">Current Load (tonnes)</label><input class="form-input" id="f-current_load_tonnes" type="number" step="0.01" placeholder="0" /></div>
        <div class="form-group"><label class="form-label">Manager Employee ID</label><input class="form-input" id="f-manager_employee_id" type="number" placeholder="5" /></div>
        <div class="form-group"><label class="form-label">Contact Number</label><input class="form-input" id="f-contact_number" placeholder="+27 31 000 0001" /></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="f-email" type="email" placeholder="warehouse@port.co.za" /></div>
        <div class="form-group"><label class="form-label">City *</label><input class="form-input" id="f-city" placeholder="Durban" required /></div>
        <div class="form-group span2"><label class="form-label">Address *</label><textarea class="form-textarea" id="f-address" placeholder="12 Maydon Wharf Road, Durban Harbour" required></textarea></div>
      </div>`
  },

  port: {
    title: 'Add New Port',
    html: `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Port Name *</label><input class="form-input" id="f-port_name" placeholder="Port of Durban" required /></div>
        <div class="form-group"><label class="form-label">Port Code * (UNIQUE)</label><input class="form-input" id="f-port_code" placeholder="ZADUR" required /></div>
        <div class="form-group"><label class="form-label">Country *</label><input class="form-input" id="f-country" placeholder="South Africa" required /></div>
        <div class="form-group"><label class="form-label">City *</label><input class="form-input" id="f-city" placeholder="Durban" required /></div>
        <div class="form-group"><label class="form-label">Latitude * (-90 to 90)</label><input class="form-input" id="f-latitude" type="number" step="0.000001" placeholder="-29.858680" required /></div>
        <div class="form-group"><label class="form-label">Longitude * (-180 to 180)</label><input class="form-input" id="f-longitude" type="number" step="0.000001" placeholder="31.021840" required /></div>
        <div class="form-group"><label class="form-label">Timezone</label><input class="form-input" id="f-timezone" placeholder="Africa/Johannesburg" /></div>
        <div class="form-group"><label class="form-label">Max Vessel Capacity</label><input class="form-input" id="f-max_vessel_capacity" type="number" placeholder="45" /></div>
      </div>`
  },

  customer: {
    title: 'Add New Customer',
    html: `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" id="f-full_name" placeholder="John Mokoena" required /></div>
        <div class="form-group"><label class="form-label">Company Name</label><input class="form-input" id="f-company_name" placeholder="Mokoena Exports Ltd" /></div>
        <div class="form-group span2"><label class="form-label">Email * (UNIQUE)</label><input class="form-input" id="f-email" type="email" placeholder="john@company.co.za" required /></div>
        <div class="form-group"><label class="form-label">Country *</label><input class="form-input" id="f-country" placeholder="South Africa" required /></div>
        <div class="form-group"><label class="form-label">Phone Number</label><input class="form-input" id="f-phone_number" placeholder="+27 31 000 0000" /></div>
        <div class="form-group span2"><label class="form-label">Address</label><textarea class="form-textarea" id="f-address" placeholder="Full postal address"></textarea></div>
      </div>`
  },

  employee: {
    title: 'Add New Employee',
    html: `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" id="f-full_name" placeholder="Nomsa Dube" required /></div>
        <div class="form-group"><label class="form-label">Role * (Controls access — CIA C)</label>
          <select class="form-select" id="f-role">
            <option>Port Officer</option><option>Customs Agent</option><option>Captain</option>
            <option>Analyst</option><option>Admin</option><option>Warehouse Manager</option>
          </select></div>
        <div class="form-group span2"><label class="form-label">Email * (UNIQUE)</label><input class="form-input" id="f-email" type="email" placeholder="employee@port.co.za" required /></div>
        <div class="form-group"><label class="form-label">Port ID (FK → Port)</label><input class="form-input" id="f-port_id" type="number" placeholder="1" /></div>
        <div class="form-group"><label class="form-label">Hire Date</label><input class="form-input" id="f-hire_date" type="date" /></div>
      </div>`
  }
};

function openModal(type) {
  const config = MODAL_FORMS[type];
  if (!config) { toast('warning', '⚠', `No form configured for: ${type}`); return; }
  currentModalType = type;
  document.getElementById('modal-title').textContent = config.title;
  document.getElementById('modal-body').innerHTML   = config.html;
  document.getElementById('modal-overlay').classList.add('open');
}

function openAddModal() {
  const pageModal = {
    dashboard:'vessel', vessels:'vessel', voyages:'voyage',
    shipments:'shipment', warehouses:'warehouse', ports:'port',
    customers:'customer', employees:'employee', gps:'vessel'
  };
  const type = pageModal[currentPage];
  if (type) openModal(type);
  else toast('info', '◎', 'Navigate to a specific section to add records');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  currentModalType = null;
}

async function submitModal() {
  if (!currentModalType) return;

  const required = document.querySelectorAll('#modal-body [required]');
  for (const field of required) {
    if (!field.value.trim()) {
      field.focus();
      field.style.borderColor = 'var(--red)';
      toast('error', '✕', `Please fill in: ${field.placeholder || 'required field'}`);
      setTimeout(() => { field.style.borderColor = ''; }, 2500);
      return;
    }
  }

  const data = {};
  document.querySelectorAll('#modal-body [id^="f-"]').forEach(input => {
    const key = input.id.replace('f-', '');
    data[key] = input.value.trim();
  });

  const btn = document.getElementById('modal-submit');
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  btn.disabled = true;

  const result = await apiPost(`/${currentModalType}s`, data);
  await sleep(600);

  btn.innerHTML = 'Save Record';
  btn.disabled = false;

  if (result) {
    toast('success', '✓', `${capitalize(currentModalType)} saved to PostgreSQL database`);
  } else {
    toast('info', '◎', 'Demo mode — start server.js to persist to PostgreSQL');
  }

  closeModal();
  loadPageData(currentPage);
}

/* ══════════════════════════════════════════════
   DETAIL VIEW & DELETE
══════════════════════════════════════════════ */

function viewDetail(type, id, name) {
  toast('info', '◎', `${name} — connect API backend to view full record details`);
}

async function confirmDelete(endpoint, id, name) {
  if (!confirm(`Delete "${name}" (ID: ${id})?\n\nON DELETE RESTRICT may block this if other records reference it.`)) return;
  const result = await apiDelete(`/${endpoint}/${id}`);
  if (result) {
    toast('success', '✓', `"${name}" deleted from database`);
    loadPageData(currentPage);
  } else {
    toast('error', '✕', `Could not delete — another record may reference this via FK constraint`);
  }
}

/* ══════════════════════════════════════════════
   TABLE SEARCH
══════════════════════════════════════════════ */

function filterTable(bodyId, query) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  const q = query.toLowerCase().trim();
  body.querySelectorAll('tr').forEach(row => {
    row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ══════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════ */

function toast(type, icon, message) {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.3s, transform 0.3s';
    t.style.opacity    = '0';
    t.style.transform  = 'translateX(110%)';
    setTimeout(() => t.remove(), 320);
  }, 4000);
}

/* ══════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════ */

function badge(status) {
  const map = {
    'At Sea':'badge-blue', 'In Transit':'badge-blue', 'Departed':'badge-blue',
    'In Port':'badge-green', 'Docked':'badge-grey', 'Under Maintenance':'badge-amber',
    'Booked':'badge-teal', 'Scheduled':'badge-teal',
    'In Warehouse':'badge-warehouse',
    'Delivered':'badge-green', 'Arrived':'badge-green',
    'Cleared':'badge-green', 'Active':'badge-green', 'Paid':'badge-green',
    'Available':'badge-green', 'Operational':'badge-green',
    'Pending':'badge-amber', 'Under Review':'badge-amber',
    'Unpaid':'badge-amber', 'Loading':'badge-amber', 'Customs':'badge-amber',
    'Under Inspection':'badge-amber', 'At Port':'badge-teal',
    'Issued':'badge-teal', 'Signed':'badge-blue', 'Draft':'badge-grey',
    'Full':'badge-red', 'Locked':'badge-red', 'Cancelled':'badge-red',
    'Rejected':'badge-red', 'Hold':'badge-red', 'Suspended':'badge-red',
    'Overdue':'badge-red', 'Disputed':'badge-red',
    'Closed':'badge-grey', 'Refunded':'badge-grey'
  };
  return `<span class="badge ${map[status] || 'badge-grey'}">${status}</span>`;
}

/* ══════════════════════════════════════════════
   UTILITY HELPERS
══════════════════════════════════════════════ */

function fmtDate(dateStr) {
  if (!dateStr) return '<span style="color:var(--muted)">—</span>';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day:'2-digit', month:'short', year:'numeric'
    });
  } catch { return dateStr; }
}

function emptyRow(cols, title, icon = '—') {
  return `<tr><td colspan="${cols}">
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-text">No records found in database</div>
    </div></td></tr>`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function mkEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls)  e.className   = cls;
  if (text) e.textContent = text;
  return e;
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function capitalize(s)        { return s.charAt(0).toUpperCase() + s.slice(1); }
function sleep(ms)            { return new Promise(r => setTimeout(r, ms)); }

/* ══════════════════════════════════════════════
   EVENT LISTENERS
══════════════════════════════════════════════ */

function initEventListeners() {
  document.getElementById('modal-close').addEventListener('click',  closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-submit').addEventListener('click', submitModal);

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    if (window.innerWidth <= 900 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initEventListeners();
  checkConnection();
  loadDashboard();
  toast('info', '⚓', 'MarineOS v2 loaded — Group 4 Maritime Shipping System');
});