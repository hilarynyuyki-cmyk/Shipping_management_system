/* ═══════════════════════════════════════════════════════════════
   ROLE DEFINITIONS  — mirrors PostgreSQL GRANT statements exactly
   ───────────────────────────────────────────────────────────────
   admin            : ALL PRIVILEGES on all tables + sequences
   port_officer     : SELECT,INSERT,UPDATE on Vessel, Voyage, Port,
                      Port_Call, Shipment, Container, TrackingEvent,
                      Vessel_Position, Warehouse
   warehouse_manager: SELECT,INSERT,UPDATE on Warehouse, Container,
                      Shipment, TrackingEvent
   analyst          : SELECT on ALL tables (read-only everywhere)
   customs_agent    : SELECT,INSERT,UPDATE on Customs_Clearance;
                      SELECT on Shipment, Port, Employee
═══════════════════════════════════════════════════════════════ */
const ROLES = {
  admin: {
    label:'Admin', icon:'⚙️',
    canView:['dashboard','vessels','voyages','ports','portcalls','gps','shipments',
             'containers','warehouses','manifests','bol','invoices','customs',
             'tracking','customers','employees'],
    canWrite:['vessels','voyages','ports','shipments','containers','warehouses',
              'manifests','bol','invoices','customs','tracking','customers','employees','gps'],
    canDelete:['vessels'],
    readOnly:false
  },
  port_officer: {
    label:'Port Officer', icon:'🚢',
    canView:['dashboard','vessels','voyages','ports','portcalls','gps',
             'shipments','containers','warehouses','tracking'],
    canWrite:['vessels','voyages','ports','shipments','containers','warehouses','tracking','gps'],
    canDelete:[],
    readOnly:false
  },
  analyst: {
    label:'Analyst', icon:'📊',
    canView:['dashboard','vessels','voyages','ports','portcalls','gps','shipments',
             'containers','warehouses','manifests','bol','invoices','customs',
             'tracking','customers','employees'],
    canWrite:[],
    canDelete:[],
    readOnly:true
  },
  customs_agent: {
    label:'Customs Agent', icon:'🛃',
    canView:['dashboard','customs','shipments','ports','employees'],
    canWrite:['customs'],
    canDelete:[],
    readOnly:false
  },
  warehouse_manager: {
    label:'Warehouse Manager', icon:'🏭',
    canView:['dashboard','warehouses','containers','shipments','tracking'],
    canWrite:['warehouses','containers','shipments','tracking'],
    canDelete:[],
    readOnly:false
  }
};

const CREDS = {
  admin:'AdminSecure123!', port_officer:'OfficerSecure123!',
  analyst:'AnalystSecure123!', customs_agent:'CustomsSecure123!',
  warehouse_manager:'WarehouseSecure123!'
};

/* ── State ─────────────────────────────────────────────────── */
let currentRole = null;
let currentView = 'dashboard';
let modalContext = null;
let editingId = null;
let _ports=[], _vessels=[], _customers=[], _employees=[];
let _warehouses=[], _voyages=[], _shipments=[], _containers=[];

/* ═══════════════════════════════════════════════════════════
   LOGIN / LOGOUT
═══════════════════════════════════════════════════════════ */
function copyCode(el, code) {
  navigator.clipboard?.writeText(code).catch(()=>{});
  const orig = el.textContent;
  el.textContent = '✓ Copied!';
  setTimeout(()=>{ el.textContent = orig; }, 1400);
}

function doLogin() {
  const role = document.getElementById('login-role').value;
  const code = document.getElementById('login-code').value;
  const err  = document.getElementById('login-err');
  if (!role) { err.textContent = 'Please select a role.'; return; }
  if (!code) { err.textContent = 'Please enter your access code.'; return; }
  if (CREDS[role] !== code) { err.textContent = 'Incorrect access code. Try again.'; return; }
  err.textContent = '';
  currentRole = role;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').classList.add('visible');
  applyRole();
  testConnection();
}

function doLogout() {
  currentRole = null; editingId = null; modalContext = null;
  _ports=[]; _vessels=[]; _customers=[]; _employees=[];
  _warehouses=[]; _voyages=[]; _shipments=[]; _containers=[];
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-shell').classList.remove('visible');
  document.getElementById('login-code').value = '';
  document.getElementById('login-role').value = '';
  document.getElementById('login-err').textContent = '';
  document.getElementById('api-dot').className = 'api-dot';
  document.getElementById('api-status-text').textContent = 'Not connected';
}

document.getElementById('login-code')
  .addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); });

/* ═══════════════════════════════════════════════════════════
   ROLE APPLICATION
═══════════════════════════════════════════════════════════ */
function applyRole() {
  const r = ROLES[currentRole];
  document.getElementById('rb-icon').textContent  = r.icon;
  document.getElementById('rb-name').textContent  = r.label;
  document.getElementById('rb-label').textContent = currentRole.replace(/_/g,' ').toUpperCase();

  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    const v = btn.dataset.view;
    if (r.canView.includes(v)) {
      btn.classList.remove('locked');
      btn.onclick = null;   // allow normal click
    } else {
      btn.classList.add('locked');
      btn.onclick = e => { e.stopPropagation(); toast('Access denied for your role','error'); };
    }
  });
  navigateTo('dashboard');
}

function can(action, scope) {
  if (!currentRole) return false;
  const r = ROLES[currentRole];
  if (action==='view')   return r.canView.includes(scope);
  if (action==='write')  return r.canWrite.includes(scope);
  if (action==='delete') return r.canDelete.includes(scope);
  return false;
}

/* ═══════════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════════ */
const API = () => (document.getElementById('api-url').value||'http://localhost:3000').replace(/\/$/,'');

async function apiFetch(path, opts={}) {
  const res = await fetch(`${API()}/api${path}`, {
    headers:{'Content-Type':'application/json'}, ...opts
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || json.errors?.join(', ') || 'API error');
  return json.data;
}

async function testConnection() {
  const dot=document.getElementById('api-dot');
  const txt=document.getElementById('api-status-text');
  dot.className='api-dot'; txt.textContent='Connecting…';
  try {
    await apiFetch('/dashboard/health');
    dot.className='api-dot connected'; txt.textContent='Connected';
    loadView(currentView);
  } catch {
    dot.className='api-dot error'; txt.textContent='Connection failed';
    toast('Cannot reach backend — check URL','error');
  }
}

/* ═══════════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('locked')) return;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    navigateTo(btn.dataset.view);
  });
});

const PAGE_TITLES = {
  dashboard:'Dashboard', vessels:'Vessels', voyages:'Voyages', ports:'Ports',
  portcalls:'Port Calls', gps:'Vessel Positions', shipments:'Shipments',
  containers:'Containers', warehouses:'Warehouses', manifests:'Cargo Manifests',
  bol:'Bills of Lading', invoices:'Freight Invoices', customs:'Customs Clearance',
  tracking:'Tracking Events', customers:'Customers', employees:'Employees'
};

/* Map: view → {modalType, label} for the Add button */
const ADD_BTN = {
  vessels:   {type:'vessel',    label:'+ Add Vessel'},
  voyages:   {type:'voyage',    label:'+ Add Voyage'},
  ports:     {type:'port',      label:'+ Add Port'},
  shipments: {type:'shipment',  label:'+ Book Shipment'},
  containers:{type:'container', label:'+ Add Container'},
  warehouses:{type:'warehouse', label:'+ Add Warehouse'},
  customers: {type:'customer',  label:'+ Add Customer'},
  employees: {type:'employee',  label:'+ Add Employee'},
  bol:       {type:'bol',       label:'+ Create BOL'},
  customs:   {type:'customs',   label:'+ New Clearance'},
  tracking:  {type:'tracking',  label:'+ Log Event'},
  manifests: {type:'manifest',  label:'+ Add to Manifest'},
};

function navigateTo(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-'+view)?.classList.add('active');
  currentView = view;
  document.getElementById('page-title').textContent = PAGE_TITLES[view]||view;

  const acts = document.getElementById('topbar-actions');
  acts.innerHTML = '';

  const r = ROLES[currentRole];
  if (r?.readOnly) {
    acts.innerHTML = `<span style="font-size:12px;color:var(--warning);background:var(--warning-bg);padding:5px 12px;border-radius:var(--radius-sm);border:1px solid #fcd34d">📊 Read-Only — Analyst</span>`;
  } else if (ADD_BTN[view] && can('write', view)) {
    const {type,label} = ADD_BTN[view];
    acts.innerHTML = `<button class="btn btn-primary" onclick="openModal('${type}')">${label}</button>`;
  }

  /* GPS add button lives inside the panel header */
  const gpsBtn = document.getElementById('gps-add-btn');
  if (gpsBtn) {
    gpsBtn.innerHTML = can('write','gps')
      ? `<button class="btn btn-primary btn-sm" onclick="openModal('gps')">+ Log Position</button>` : '';
  }

  loadView(view);
}

async function loadView(view) {
  switch(view) {
    case 'dashboard':  loadDashboard(); break;
    case 'vessels':    loadVessels(); break;
    case 'voyages':    loadVoyages(); break;
    case 'ports':      loadPorts(); break;
    case 'portcalls':  loadPortCalls(); break;
    case 'gps':        loadGPS(); break;
    case 'shipments':  loadShipments(); break;
    case 'containers': loadContainers(); break;
    case 'warehouses': loadWarehouses(); break;
    case 'manifests':  loadManifests(); break;
    case 'bol':        loadBOL(); break;
    case 'invoices':   loadInvoices(); break;
    case 'customs':    loadCustoms(); break;
    case 'tracking':   loadTracking(); break;
    case 'customers':  loadCustomers(); break;
    case 'employees':  loadEmployees(); break;
  }
}

/* ═══════════════════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════════════════ */
function statusBadge(s) {
  const m = {
    'At Sea':'badge-blue','In Port':'badge-green','Under Maintenance':'badge-yellow','Docked':'badge-gray',
    'Scheduled':'badge-blue','Departed':'badge-orange','In Transit':'badge-purple','Arrived':'badge-green','Cancelled':'badge-red',
    'Booked':'badge-blue','Loading':'badge-orange','In Warehouse':'badge-yellow','Customs':'badge-purple','Delivered':'badge-green',
    'Available':'badge-green','At Port':'badge-blue','Under Inspection':'badge-yellow',
    'Draft':'badge-gray','Issued':'badge-blue','Signed':'badge-purple','Locked':'badge-navy','Disputed':'badge-red',
    'Unpaid':'badge-yellow','Paid':'badge-green','Overdue':'badge-red','Refunded':'badge-gray',
    'Pending':'badge-yellow','Under Review':'badge-orange','Cleared':'badge-green','Rejected':'badge-red','Hold':'badge-red',
    'Operational':'badge-green','Full':'badge-red','Closed':'badge-gray',
    'Active':'badge-green','Suspended':'badge-red',
    'Admin':'badge-navy','Port Officer':'badge-blue','Captain':'badge-purple',
    'Customs Agent':'badge-orange','Analyst':'badge-gray','Warehouse Manager':'badge-green',
    'Loading':'badge-orange','Both':'badge-purple','Fuel Stop':'badge-yellow','Emergency':'badge-red',
  };
  return `<span class="badge ${m[s]||'badge-gray'}">${s||'—'}</span>`;
}

const fmt     = v => v ? new Date(v).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '—';
const fmtDate = v => v ? new Date(v).toLocaleDateString('en-GB') : '—';
const num     = v => v!=null ? Number(v).toLocaleString() : '—';

function filterTable(tbodyId, searchId) {
  const term = (document.getElementById(searchId)?.value||'').toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
}

/**
 * Returns action cell HTML: Edit button (if canWrite) and Del button (if canDelete).
 * entity  — the view name used in can() checks  e.g. 'vessels'
 * type    — the modal type string               e.g. 'vessel'
 * data    — the full row object
 * idField — the primary key field name          e.g. 'vessel_id'
 */
function actionCell(entity, type, data, idField) {
  if (!can('write', entity) && !can('delete', entity)) return '';
  const safe = JSON.stringify(data).replace(/'/g, '&apos;');
  let html = '';
  if (can('write', entity))
    html += `<button class="btn btn-secondary btn-sm" onclick='openEditModal("${type}",${safe})'>Edit</button>`;
  if (can('delete', entity))
    html += ` <button class="btn btn-danger btn-sm" onclick="deleteRecord('${entity}',${data[idField]})">Del</button>`;
  return html;
}

/* ═══════════════════════════════════════════════════════════
   DATA LOADERS
═══════════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const s = await apiFetch('/dashboard/stats');
    document.getElementById('s-vessels').textContent   = s.vessels   ?? '—';
    document.getElementById('s-voyages').textContent   = s.voyages   ?? '—';
    document.getElementById('s-shipments').textContent = s.shipments ?? '—';
    document.getElementById('s-customers').textContent = s.customers ?? '—';
    document.getElementById('s-customs').textContent   = s.pending_customs ?? '—';
    document.getElementById('s-warehouses').textContent= s.warehouses ?? '—';
  } catch {}

  try {
    const data = await apiFetch('/dashboard/recent-shipments');
    const div = document.getElementById('dash-shipments');
    div.innerHTML = !data.length
      ? '<div class="empty-state"><p>No shipments yet</p></div>'
      : `<div class="tbl-wrap"><table><thead><tr><th>Customer</th><th>Origin</th><th>Destination</th><th>Warehouse</th><th>Status</th></tr></thead><tbody>
          ${data.map(s=>`<tr><td>${s.customer_name}</td><td>${s.origin}</td><td>${s.destination}</td><td>${s.warehouse_name||'—'}</td><td>${statusBadge(s.status)}</td></tr>`).join('')}
         </tbody></table></div>`;
  } catch {}

  try {
    const events = await apiFetch('/dashboard/recent-tracking');
    const div = document.getElementById('dash-tracking');
    div.innerHTML = !events.length
      ? '<div class="empty-state"><p>No events yet</p></div>'
      : `<ul class="timeline" style="padding:16px 18px">${events.map(e=>`<li>
          <div class="tl-dot" style="background:var(--sky)">${e.event_type?.[0]||'•'}</div>
          <div class="tl-content">
            <div class="tl-title">${e.event_type} — Shipment #${e.shipment_id}</div>
            <div class="tl-meta">${fmt(e.event_datetime)} · ${e.description||''}</div>
          </div></li>`).join('')}</ul>`;
  } catch {}
}

async function loadVessels() {
  const th = document.getElementById('vessel-th-act');
  if (th) th.textContent = (can('write','vessels')||can('delete','vessels')) ? 'Actions' : '';
  try {
    const data = await apiFetch('/vessels'); _vessels = data;
    const tb = document.getElementById('vessel-tbody');
    if (!data.length) { tb.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>No vessels found</p></div></td></tr>'; return; }
    tb.innerHTML = data.map(v=>`<tr>
      <td><strong>${v.vessel_name}</strong></td><td>${v.vessel_type}</td>
      <td class="td-mono">${v.imo_number}</td><td>${v.flag_country}</td>
      <td>${num(v.gross_tonnage)}</td><td>${num(v.max_capacity_teu)}</td>
      <td>${v.build_year||'—'}</td><td>${v.owner_company||'—'}</td>
      <td>${statusBadge(v.current_status)}</td>
      <td>${actionCell('vessels','vessel',v,'vessel_id')}</td>
    </tr>`).join('');
  } catch(e) { document.getElementById('vessel-tbody').innerHTML=`<tr><td colspan="10" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

async function loadVoyages() {
  const th=document.getElementById('voyage-th-act'); if(th) th.textContent=can('write','voyages')?'Actions':'';
  try {
    const data=await apiFetch('/voyages'); _voyages=data;
    const tb=document.getElementById('voyage-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No voyages</p></div></td></tr>';return;}
    tb.innerHTML=data.map(v=>`<tr>
      <td class="td-mono"><strong>${v.voyage_code}</strong></td>
      <td>${v.vessel_name||v.vessel_id}</td>
      <td>${v.origin_port||v.origin_port_id}</td>
      <td>${v.destination_port||v.destination_port_id}</td>
      <td>${fmt(v.departure_datetime)}</td><td>${fmt(v.estimated_arrival)}</td>
      <td>${v.total_distance_nm?num(v.total_distance_nm)+'&nbsp;nm':'—'}</td>
      <td>${statusBadge(v.status)}</td>
      <td>${actionCell('voyages','voyage',v,'voyage_id')}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('voyage-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadPorts() {
  const th=document.getElementById('port-th-act'); if(th) th.textContent=can('write','ports')?'Actions':'';
  try {
    const data=await apiFetch('/ports'); _ports=data;
    const tb=document.getElementById('port-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No ports</p></div></td></tr>';return;}
    tb.innerHTML=data.map(p=>`<tr>
      <td><strong>${p.port_name}</strong></td><td class="td-mono">${p.port_code}</td>
      <td>${p.city}</td><td>${p.country}</td>
      <td class="td-mono">${p.latitude}, ${p.longitude}</td>
      <td>${p.timezone||'—'}</td><td>${p.max_vessel_capacity||'—'}</td>
      <td>${actionCell('ports','port',p,'port_id')}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('port-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadPortCalls() {
  try {
    const [voyages,ports] = await Promise.all([apiFetch('/voyages'),apiFetch('/ports')]);
    const portMap = Object.fromEntries(ports.map(p=>[p.port_id,p.port_name]));
    const allCalls = [];
    for (const v of voyages.slice(0,25)) {
      try {
        const vd = await apiFetch(`/voyages/${v.voyage_id}`);
        if (vd.port_calls) vd.port_calls.forEach(c=>allCalls.push({...c,voyage_code:v.voyage_code}));
      } catch {}
    }
    const tb=document.getElementById('portcall-tbody');
    if(!allCalls.length){tb.innerHTML='<tr><td colspan="7"><div class="empty-state"><p>No port calls recorded</p></div></td></tr>';return;}
    tb.innerHTML=allCalls.map(c=>`<tr>
      <td class="td-mono">${c.voyage_code||c.voyage_id}</td>
      <td>${portMap[c.port_id]||c.port_id}</td>
      <td>${c.call_sequence}</td>
      <td>${fmt(c.arrival_datetime)}</td><td>${fmt(c.departure_datetime)}</td>
      <td>${statusBadge(c.purpose)}</td><td>${c.berth_number||'—'}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('portcall-tbody').innerHTML=`<tr><td colspan="7" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadGPS() {
  try {
    const data=await apiFetch('/gps');
    const tb=document.getElementById('gps-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="7"><div class="empty-state"><p>No positions logged</p></div></td></tr>';return;}
    tb.innerHTML=data.map(p=>`<tr>
      <td>${p.vessel_name||p.vessel_id}</td><td>${p.voyage_code||p.voyage_id}</td>
      <td class="td-mono">${p.latitude}</td><td class="td-mono">${p.longitude}</td>
      <td>${p.speed_knots??'—'}</td><td>${p.heading_degrees??'—'}</td>
      <td>${fmt(p.recorded_at)}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('gps-tbody').innerHTML=`<tr><td colspan="7" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadShipments() {
  const th=document.getElementById('shipment-th-act'); if(th) th.textContent=can('write','shipments')?'Actions':'';
  try {
    const data=await apiFetch('/shipments'); _shipments=data;
    const tb=document.getElementById('shipment-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>No shipments</p></div></td></tr>';return;}
    tb.innerHTML=data.map(s=>`<tr>
      <td class="td-mono">#${s.shipment_id}</td>
      <td>${s.customer_name||s.customer_id}</td>
      <td class="td-mono">${s.voyage_code||s.voyage_id}</td>
      <td>${s.origin||s.origin_port_id}</td><td>${s.destination||s.destination_port_id}</td>
      <td>${s.cargo_type}</td><td>${num(s.total_weight_kg)}</td>
      <td>${s.warehouse_name||'—'}</td>
      <td>${statusBadge(s.status)}</td>
      <td>${actionCell('shipments','shipment',s,'shipment_id')}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('shipment-tbody').innerHTML=`<tr><td colspan="10" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadContainers() {
  const th=document.getElementById('container-th-act'); if(th) th.textContent=can('write','containers')?'Actions':'';
  try {
    const data=await apiFetch('/containers'); _containers=data;
    const tb=document.getElementById('container-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No containers</p></div></td></tr>';return;}
    tb.innerHTML=data.map(c=>`<tr>
      <td class="td-mono"><strong>${c.container_code}</strong></td>
      <td>${c.container_type}</td><td>${num(c.max_weight_kg)}</td>
      <td>${c.current_weight_kg!=null?num(c.current_weight_kg):'—'}</td>
      <td>${c.shipment_id||'—'}</td><td>${c.vessel_id||'—'}</td>
      <td>${c.warehouse_name||c.warehouse_id||'—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${actionCell('containers','container',c,'container_id')}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('container-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadWarehouses() {
  const th=document.getElementById('warehouse-th-act'); if(th) th.textContent=can('write','warehouses')?'Actions':'';
  try {
    const data=await apiFetch('/warehouses'); _warehouses=data;
    /* capacity cards */
    document.getElementById('warehouse-cards').innerHTML = data.map(w=>{
      const pct = Math.min(100, Math.round((w.current_load_tonnes/w.capacity_tonnes)*100)||0);
      const cls = pct>=90?'danger':pct>=70?'warn':'';
      return `<div class="panel" style="margin:0"><div class="panel-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-weight:600;font-size:14px;color:var(--navy)">${w.warehouse_name}</div>
            <div style="font-size:11px;color:var(--gray-500);margin-top:2px">${w.warehouse_code} · ${w.warehouse_type}</div>
          </div>${statusBadge(w.status)}
        </div>
        <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--gray-500)">
          <span>${num(w.current_load_tonnes)} t</span><span>${pct}% of ${num(w.capacity_tonnes)} t</span>
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--gray-500)">${w.city}, ${w.country}</div>
      </div></div>`;
    }).join('');
    /* table */
    const tb=document.getElementById('warehouse-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>No warehouses</p></div></td></tr>';return;}
    tb.innerHTML=data.map(w=>`<tr>
      <td><strong>${w.warehouse_name}</strong></td><td class="td-mono">${w.warehouse_code}</td>
      <td>${w.port_name||w.port_id}</td><td>${w.city}</td><td>${w.warehouse_type}</td>
      <td>${num(w.capacity_tonnes)} t</td><td>${num(w.current_load_tonnes)} t</td>
      <td>${w.manager_name||w.manager_employee_id||'—'}</td>
      <td>${statusBadge(w.status)}</td>
      <td>${actionCell('warehouses','warehouse',w,'warehouse_id')}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('warehouse-tbody').innerHTML=`<tr><td colspan="10" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadManifests() {
  try {
    const data=await apiFetch('/manifests');
    const tb=document.getElementById('manifest-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No manifests</p></div></td></tr>';return;}
    tb.innerHTML=data.map(m=>`<tr>
      <td>#${m.manifest_id}</td>
      <td>${m.voyage_code||m.voyage_id}</td><td>${m.container_code||m.container_id}</td>
      <td>#${m.shipment_id}</td><td>${m.cargo_description}</td><td>${num(m.weight_kg)}</td>
      <td>${m.hazmat_flag?'<span class="badge badge-red">Yes</span>':'<span class="badge badge-gray">No</span>'}</td>
      <td>${m.hazmat_class||'—'}</td><td>${fmt(m.created_at)}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('manifest-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadBOL() {
  const canEdit = can('write','bol');
  const th=document.getElementById('bol-th-act'); if(th) th.textContent=canEdit?'Update Status':'';
  try {
    const data=await apiFetch('/bol');
    const tb=document.getElementById('bol-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No bills of lading</p></div></td></tr>';return;}
    const ss=['Draft','Issued','Signed','Locked','Disputed'];
    tb.innerHTML=data.map(b=>`<tr>
      <td class="td-mono"><strong>${b.bol_number}</strong></td>
      <td>#${b.shipment_id}</td><td>${b.voyage_code||b.voyage_id}</td>
      <td>${b.shipper_name||b.shipper_customer_id}</td>
      <td>${fmtDate(b.issue_date)}</td><td>${num(b.total_weight_kg)}</td>
      <td>$${num(b.declared_value_usd)}</td>
      <td>${statusBadge(b.status)}</td>
      <td>${canEdit?`<select class="btn btn-secondary btn-sm" style="padding:4px 6px" onchange="updateBOLStatus(${b.bol_id},this.value)">
        ${ss.map(s=>`<option value="${s}"${s===b.status?' selected':''}>${s}</option>`).join('')}
      </select>`:'—'}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('bol-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function updateBOLStatus(id,status) {
  try { await apiFetch(`/bol/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}); toast('BOL status updated','success'); }
  catch(e){ toast(e.message,'error'); loadBOL(); }
}

async function loadInvoices() {
  const canEdit = can('write','invoices');
  const th=document.getElementById('invoice-th-act'); if(th) th.textContent=canEdit?'Update Payment':'';
  try {
    const data=await apiFetch('/invoices');
    const tb=document.getElementById('invoice-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>No invoices</p></div></td></tr>';return;}
    const pss=['Unpaid','Paid','Overdue','Disputed','Refunded'];
    const pms=['Bank Transfer','Credit Card','Letter of Credit'];
    tb.innerHTML=data.map(i=>`<tr>
      <td>#${i.invoice_id}</td><td>#${i.shipment_id}</td>
      <td>${i.customer_name||i.customer_id}</td>
      <td><strong>$${num(i.amount_usd)}</strong></td>
      <td>${i.currency||'USD'}</td><td>${fmtDate(i.due_date)}</td>
      <td>${statusBadge(i.payment_status)}</td>
      <td>${fmt(i.payment_date)}</td><td>${i.payment_method||'—'}</td>
      <td>${canEdit?`<div style="display:flex;gap:4px;align-items:center">
        <select style="font-size:11px;padding:3px 6px;border-radius:4px;border:1px solid var(--gray-200)" id="inv-s-${i.invoice_id}">
          ${pss.map(s=>`<option value="${s}"${s===i.payment_status?' selected':''}>${s}</option>`).join('')}
        </select>
        <select style="font-size:11px;padding:3px 6px;border-radius:4px;border:1px solid var(--gray-200)" id="inv-m-${i.invoice_id}">
          <option value="">Method</option>${pms.map(m=>`<option value="${m}"${m===i.payment_method?' selected':''}>${m}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="updateInvoice(${i.invoice_id})">✓</button>
      </div>`:'—'}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('invoice-tbody').innerHTML=`<tr><td colspan="10" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function updateInvoice(id) {
  const status=document.getElementById(`inv-s-${id}`)?.value;
  const method=document.getElementById(`inv-m-${id}`)?.value||undefined;
  try {
    await apiFetch(`/invoices/${id}/payment`,{method:'PATCH',body:JSON.stringify({payment_status:status,payment_method:method})});
    toast('Invoice updated','success'); loadInvoices();
  } catch(e){ toast(e.message,'error'); }
}

/* Customs — notes column REMOVED per requirements */
async function loadCustoms() {
  const canEdit = can('write','customs');
  const th=document.getElementById('customs-th-act'); if(th) th.textContent=canEdit?'Update Status':'';
  try {
    const data=await apiFetch('/customs');
    const tb=document.getElementById('customs-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No customs records</p></div></td></tr>';return;}
    const ss=['Pending','Under Review','Cleared','Rejected','Hold'];
    tb.innerHTML=data.map(c=>`<tr>
      <td>#${c.clearance_id}</td><td>#${c.shipment_id}</td>
      <td>${c.port_name||c.port_id}</td>
      <td>${c.officer_name||c.officer_id||'—'}</td>
      <td>${fmt(c.submission_date)}</td><td>${fmt(c.clearance_date)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${canEdit?`<select class="btn btn-secondary btn-sm" style="padding:4px 6px" onchange="updateCustomsStatus(${c.clearance_id},this.value)">
        ${ss.map(s=>`<option value="${s}"${s===c.status?' selected':''}>${s}</option>`).join('')}
      </select>`:'—'}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('customs-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function updateCustomsStatus(id,status) {
  try { await apiFetch(`/customs/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}); toast('Customs status updated','success'); }
  catch(e){ toast(e.message,'error'); loadCustoms(); }
}

async function loadTracking() {
  try {
    const data=await apiFetch('/tracking');
    const tb=document.getElementById('tracking-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No tracking events</p></div></td></tr>';return;}
    tb.innerHTML=data.map(e=>`<tr>
      <td>#${e.event_id}</td><td>#${e.shipment_id}</td>
      <td>${statusBadge(e.event_type)}</td>
      <td>${e.port_name||e.location_port_id||'—'}</td>
      <td>${e.warehouse_name||e.location_warehouse_id||'—'}</td>
      <td>${e.employee_name||e.recorded_by_employee_id||'—'}</td>
      <td>${fmt(e.event_datetime)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.description||'—'}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('tracking-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadCustomers() {
  const th=document.getElementById('customer-th-act'); if(th) th.textContent=can('write','customers')?'Actions':'';
  try {
    const data=await apiFetch('/customers'); _customers=data;
    const tb=document.getElementById('customer-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No customers</p></div></td></tr>';return;}
    tb.innerHTML=data.map(c=>`<tr>
      <td><strong>${c.full_name}</strong></td><td>${c.company_name||'—'}</td>
      <td>${c.email}</td><td>${c.phone_number||'—'}</td>
      <td>${c.country}</td><td>${statusBadge(c.account_status)}</td>
      <td>${fmtDate(c.created_at)}</td>
      <td>${actionCell('customers','customer',c,'customer_id')}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('customer-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

async function loadEmployees() {
  const th=document.getElementById('employee-th-act'); if(th) th.textContent=can('write','employees')?'Actions':'';
  try {
    const data=await apiFetch('/employees'); _employees=data;
    const tb=document.getElementById('employee-tbody');
    if(!data.length){tb.innerHTML='<tr><td colspan="7"><div class="empty-state"><p>No employees</p></div></td></tr>';return;}
    tb.innerHTML=data.map(e=>`<tr>
      <td><strong>${e.full_name}</strong></td><td>${statusBadge(e.role)}</td>
      <td>${e.email}</td><td>${e.port_name||e.port_id||'—'}</td>
      <td>${fmtDate(e.hire_date)}</td>
      <td>${e.is_active?'<span class="badge badge-green">Active</span>':'<span class="badge badge-red">Inactive</span>'}</td>
      <td>${actionCell('employees','employee',e,'employee_id')}</td>
    </tr>`).join('');
  } catch(e){document.getElementById('employee-tbody').innerHTML=`<tr><td colspan="7" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;}
}

/* ═══════════════════════════════════════════════════════════
   DELETE
═══════════════════════════════════════════════════════════ */
async function deleteRecord(endpoint, id) {
  if (!confirm('Delete this record? This cannot be undone.')) return;
  try {
    await apiFetch(`/${endpoint}/${id}`, {method:'DELETE'});
    toast('Deleted successfully','success');
    loadView(currentView);
  } catch(e){ toast(e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════ */
async function ensureCaches() {
  if (!_ports.length)      try{_ports=await apiFetch('/ports');}catch{}
  if (!_vessels.length)    try{_vessels=await apiFetch('/vessels');}catch{}
  if (!_customers.length)  try{_customers=await apiFetch('/customers');}catch{}
  if (!_employees.length)  try{_employees=await apiFetch('/employees');}catch{}
  if (!_warehouses.length) try{_warehouses=await apiFetch('/warehouses');}catch{}
  if (!_voyages.length)    try{_voyages=await apiFetch('/voyages');}catch{}
  if (!_shipments.length)  try{_shipments=await apiFetch('/shipments');}catch{}
  if (!_containers.length) try{_containers=await apiFetch('/containers');}catch{}
}

/* dropdown helpers */
const portOpts     = sel => _ports.map(p=>`<option value="${p.port_id}"${p.port_id==sel?' selected':''}>${p.port_name} (${p.port_code})</option>`).join('');
const vesselOpts   = sel => _vessels.map(v=>`<option value="${v.vessel_id}"${v.vessel_id==sel?' selected':''}>${v.vessel_name}</option>`).join('');
const customerOpts = sel => _customers.map(c=>`<option value="${c.customer_id}"${c.customer_id==sel?' selected':''}>${c.full_name}${c.company_name?' — '+c.company_name:''}</option>`).join('');
const warehouseOpts= sel => `<option value="">— None —</option>`+_warehouses.map(w=>`<option value="${w.warehouse_id}"${w.warehouse_id==sel?' selected':''}>${w.warehouse_name}</option>`).join('');
const voyageOpts   = sel => _voyages.map(v=>`<option value="${v.voyage_id}"${v.voyage_id==sel?' selected':''}>${v.voyage_code} — ${v.vessel_name||''}</option>`).join('');
const shipmentOpts = sel => `<option value="">— None —</option>`+_shipments.map(s=>`<option value="${s.shipment_id}"${s.shipment_id==sel?' selected':''}>#${s.shipment_id} ${s.cargo_type} (${s.customer_name||''})</option>`).join('');
const containerOpts= sel => _containers.map(c=>`<option value="${c.container_id}"${c.container_id==sel?' selected':''}>${c.container_code} (${c.container_type})</option>`).join('');
const employeeOpts = (sel,roleF) => `<option value="">— None —</option>`+_employees.filter(e=>!roleF||e.role===roleF).map(e=>`<option value="${e.employee_id}"${e.employee_id==sel?' selected':''}>${e.full_name} (${e.role})</option>`).join('');

const MODAL_LABELS = {
  vessel:'Vessel', voyage:'Voyage', port:'Port', shipment:'Shipment',
  container:'Container', warehouse:'Warehouse', customer:'Customer', employee:'Employee',
  bol:'Bill of Lading', customs:'Customs Clearance', tracking:'Tracking Event',
  manifest:'Cargo Manifest Entry', gps:'Vessel Position'
};

async function openModal(type, data=null) {
  await ensureCaches();
  editingId = data
    ? (data.vessel_id||data.voyage_id||data.shipment_id||data.container_id||
       data.warehouse_id||data.customer_id||data.employee_id||data.port_id||
       data.clearance_id||data.bol_id||data.manifest_id||data.event_id)
    : null;
  modalContext = type;
  document.getElementById('modal-title').textContent = (editingId?'Edit ':'Add ') + (MODAL_LABELS[type]||type);
  document.getElementById('modal-body').innerHTML = buildForm(type, data||{});
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditModal(type, data) { openModal(type, data); }
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  modalContext = null; editingId = null;
}

/* ── FORM BUILDER ───────────────────────────────────────────── */
function buildForm(type, d) {
  d = d||{};
  const sel  = (name,opts,val) => `<select name="${name}"><option value="">Select…</option>${opts}</select>`;
  const sOpt = (list,cur) => list.map(v=>`<option${v===cur?' selected':''}>${v}</option>`).join('');

  switch(type) {

    case 'vessel': return `<div class="form-grid">
      <div class="field"><label>Vessel Name *</label><input name="vessel_name" value="${d.vessel_name||''}"></div>
      <div class="field"><label>Vessel Type *</label><select name="vessel_type">
        ${sOpt(['Container Ship','Bulk Carrier','Tanker','Ro-Ro'],d.vessel_type)}</select></div>
      <div class="field"><label>IMO Number *</label><input name="IMO_number" placeholder="IMO1234567" value="${d.imo_number||d.IMO_number||''}"></div>
      <div class="field"><label>Flag Country *</label><input name="flag_country" value="${d.flag_country||''}"></div>
      <div class="field"><label>Gross Tonnage *</label><input type="number" name="gross_tonnage" value="${d.gross_tonnage||''}"></div>
      <div class="field"><label>Max Capacity (TEU) *</label><input type="number" name="max_capacity_TEU" value="${d.max_capacity_teu||d.max_capacity_TEU||''}"></div>
      <div class="field"><label>Status *</label><select name="current_status">
        ${sOpt(['At Sea','In Port','Under Maintenance','Docked'],d.current_status)}</select></div>
      <div class="field"><label>Build Year</label><input type="number" name="build_year" placeholder="2015" value="${d.build_year||''}"></div>
      <div class="field span-2"><label>Owner Company</label><input name="owner_company" value="${d.owner_company||''}"></div>
    </div>`;

    case 'port': return `<div class="form-grid">
      <div class="field span-2"><label>Port Name *</label><input name="port_name" value="${d.port_name||''}"></div>
      <div class="field"><label>Port Code * (e.g. ZADUR)</label><input name="port_code" maxlength="10" value="${d.port_code||''}"></div>
      <div class="field"><label>Country *</label><input name="country" value="${d.country||''}"></div>
      <div class="field"><label>City *</label><input name="city" value="${d.city||''}"></div>
      <div class="field"><label>Timezone</label><input name="timezone" placeholder="Africa/Johannesburg" value="${d.timezone||''}"></div>
      <div class="field"><label>Latitude *</label><input type="number" step="0.000001" name="latitude" value="${d.latitude||''}"></div>
      <div class="field"><label>Longitude *</label><input type="number" step="0.000001" name="longitude" value="${d.longitude||''}"></div>
      <div class="field"><label>Max Vessel Capacity</label><input type="number" name="max_vessel_capacity" value="${d.max_vessel_capacity||''}"></div>
      <div class="field"><label>Port Authority Contact</label><input name="port_authority_contact" value="${d.port_authority_contact||''}"></div>
    </div>`;

    case 'voyage': return `<div class="form-grid">
      <div class="field"><label>Voyage Code *</label><input name="voyage_code" placeholder="VOY-2026-003" value="${d.voyage_code||''}"></div>
      <div class="field"><label>Status</label><select name="status">
        ${sOpt(['Scheduled','Departed','In Transit','Arrived','Cancelled'],d.status)}</select></div>
      <div class="field span-2"><label>Vessel *</label><select name="vessel_id"><option value="">Select vessel…</option>${vesselOpts(d.vessel_id)}</select></div>
      <div class="field"><label>Origin Port *</label><select name="origin_port_id"><option value="">Select port…</option>${portOpts(d.origin_port_id)}</select></div>
      <div class="field"><label>Destination Port *</label><select name="destination_port_id"><option value="">Select port…</option>${portOpts(d.destination_port_id)}</select></div>
      <div class="field"><label>Departure Date/Time *</label><input type="datetime-local" name="departure_datetime" value="${d.departure_datetime?d.departure_datetime.slice(0,16):''}"></div>
      <div class="field"><label>Estimated Arrival</label><input type="datetime-local" name="estimated_arrival" value="${d.estimated_arrival?d.estimated_arrival.slice(0,16):''}"></div>
      <div class="field"><label>Total Distance (nm)</label><input type="number" step="0.01" name="total_distance_nm" value="${d.total_distance_nm||''}"></div>
    </div>`;

    case 'shipment': return `<div class="form-grid">
      <div class="field"><label>Customer *</label><select name="customer_id"><option value="">Select customer…</option>${customerOpts(d.customer_id)}</select></div>
      <div class="field"><label>Voyage *</label><select name="voyage_id"><option value="">Select voyage…</option>${voyageOpts(d.voyage_id)}</select></div>
      <div class="field"><label>Origin Port *</label><select name="origin_port_id"><option value="">Select port…</option>${portOpts(d.origin_port_id)}</select></div>
      <div class="field"><label>Destination Port *</label><select name="destination_port_id"><option value="">Select port…</option>${portOpts(d.destination_port_id)}</select></div>
      <div class="field"><label>Cargo Type *</label><select name="cargo_type">
        ${sOpt(['Electronics','Textiles','Food','Chemicals','Machinery','Vehicles','Raw Materials','Consumer Goods','Other'],d.cargo_type)}</select></div>
      <div class="field"><label>Total Weight (kg) *</label><input type="number" step="0.01" name="total_weight_kg" value="${d.total_weight_kg||''}"></div>
      <div class="field"><label>Warehouse (optional)</label><select name="warehouse_id">${warehouseOpts(d.warehouse_id)}</select></div>
      <div class="field"><label>Status</label><select name="status">
        ${sOpt(['Booked','Loading','In Transit','In Warehouse','Customs','Delivered','Cancelled'],d.status)}</select></div>
      ${!editingId?`
      <div class="field span-2" style="border-top:1px solid var(--gray-100);padding-top:12px">
        <p style="font-size:12px;color:var(--gray-500)">📋 A Freight Invoice is created automatically with this shipment</p>
      </div>
      <div class="field"><label>Invoice Amount (USD) *</label><input type="number" step="0.01" name="invoice_amount" placeholder="0.00"></div>
      <div class="field"><label>Invoice Due Date *</label><input type="date" name="invoice_due_date"></div>`:''}
      <div class="field span-2"><label>Special Instructions</label><textarea name="special_instructions">${d.special_instructions||''}</textarea></div>
    </div>`;

    case 'container': return `<div class="form-grid">
      <div class="field"><label>Container Code *</label><input name="container_code" placeholder="MSCU1234567" value="${d.container_code||''}"></div>
      <div class="field"><label>Container Type *</label><select name="container_type">
        ${sOpt(['20ft','40ft','Refrigerated','Open Top','Flat Rack'],d.container_type)}</select></div>
      <div class="field"><label>Max Weight (kg) *</label><input type="number" step="0.01" name="max_weight_kg" value="${d.max_weight_kg||''}"></div>
      <div class="field"><label>Current Weight (kg)</label><input type="number" step="0.01" name="current_weight_kg" value="${d.current_weight_kg||''}"></div>
      <div class="field"><label>Status *</label><select name="status">
        ${sOpt(['Available','In Transit','At Port','In Warehouse','Under Inspection'],d.status)}</select></div>
      <div class="field"><label>Shipment</label><select name="shipment_id">${shipmentOpts(d.shipment_id)}</select></div>
      <div class="field"><label>Vessel</label><select name="vessel_id"><option value="">— None —</option>${vesselOpts(d.vessel_id)}</select></div>
      <div class="field"><label>Warehouse</label><select name="warehouse_id">${warehouseOpts(d.warehouse_id)}</select></div>
    </div>`;

    case 'warehouse': return `<div class="form-grid">
      <div class="field span-2"><label>Warehouse Name *</label><input name="warehouse_name" value="${d.warehouse_name||''}"></div>
      <div class="field"><label>Warehouse Code *</label><input name="warehouse_code" placeholder="DUR-WH-003" value="${d.warehouse_code||''}"></div>
      <div class="field"><label>Port *</label><select name="port_id"><option value="">Select port…</option>${portOpts(d.port_id)}</select></div>
      <div class="field span-2"><label>Address *</label><input name="address" value="${d.address||''}"></div>
      <div class="field"><label>City *</label><input name="city" value="${d.city||''}"></div>
      <div class="field"><label>Country *</label><input name="country" value="${d.country||''}"></div>
      <div class="field"><label>Warehouse Type *</label><select name="warehouse_type">
        ${sOpt(['General','Refrigerated','Hazmat','Bonded','Open Yard'],d.warehouse_type)}</select></div>
      <div class="field"><label>Status *</label><select name="status">
        ${sOpt(['Operational','Full','Under Maintenance','Closed'],d.status)}</select></div>
      <div class="field"><label>Capacity (tonnes) *</label><input type="number" step="0.01" name="capacity_tonnes" value="${d.capacity_tonnes||''}"></div>
      <div class="field"><label>Current Load (tonnes)</label><input type="number" step="0.01" name="current_load_tonnes" value="${d.current_load_tonnes||0}"></div>
      <div class="field"><label>Manager (Warehouse Manager role only)</label><select name="manager_employee_id">${employeeOpts(d.manager_employee_id,'Warehouse Manager')}</select></div>
      <div class="field"><label>Contact Number</label><input name="contact_number" value="${d.contact_number||''}"></div>
      <div class="field span-2"><label>Email</label><input type="email" name="email" value="${d.email||''}"></div>
    </div>`;

    case 'customer': return `<div class="form-grid">
      <div class="field"><label>Full Name *</label><input name="full_name" value="${d.full_name||''}"></div>
      <div class="field"><label>Company Name</label><input name="company_name" value="${d.company_name||''}"></div>
      <div class="field"><label>Email *</label><input type="email" name="email" value="${d.email||''}"></div>
      <div class="field"><label>Phone Number</label><input name="phone_number" value="${d.phone_number||''}"></div>
      <div class="field"><label>Country *</label><input name="country" value="${d.country||''}"></div>
      <div class="field"><label>Account Status</label><select name="account_status">
        ${sOpt(['Active','Suspended','Pending'],d.account_status)}</select></div>
      ${!editingId?`<div class="field span-2"><label>Password *</label><input type="password" name="password" placeholder="Minimum 8 characters"></div>`:''}
      <div class="field span-2"><label>Address</label><textarea name="address">${d.address||''}</textarea></div>
    </div>`;

    case 'employee': return `<div class="form-grid">
      <div class="field"><label>Full Name *</label><input name="full_name" value="${d.full_name||''}"></div>
      <div class="field"><label>Role *</label><select name="role">
        ${sOpt(['Admin','Port Officer','Captain','Customs Agent','Analyst','Warehouse Manager'],d.role)}</select></div>
      <div class="field"><label>Email *</label><input type="email" name="email" value="${d.email||''}"></div>
      <div class="field"><label>Port Assignment</label><select name="port_id"><option value="">— None —</option>${portOpts(d.port_id)}</select></div>
      <div class="field"><label>Hire Date</label><input type="date" name="hire_date" value="${d.hire_date?d.hire_date.slice(0,10):''}"></div>
      <div class="field"><label>Active</label><select name="is_active">
        <option value="true"${d.is_active!==false?' selected':''}>Active</option>
        <option value="false"${d.is_active===false?' selected':''}>Inactive</option>
      </select></div>
      ${!editingId?`<div class="field span-2"><label>Password *</label><input type="password" name="password" placeholder="Minimum 8 characters"></div>`:''}
    </div>`;

    case 'bol': return `<div class="form-grid">
      <div class="field"><label>BOL Number *</label><input name="bol_number" placeholder="BOL-2026-00003" value="${d.bol_number||''}"></div>
      <div class="field"><label>Issue Date *</label><input type="date" name="issue_date" value="${d.issue_date?d.issue_date.slice(0,10):''}"></div>
      <div class="field"><label>Shipment *</label><select name="shipment_id"><option value="">Select shipment…</option>${shipmentOpts(d.shipment_id)}</select></div>
      <div class="field"><label>Voyage *</label><select name="voyage_id"><option value="">Select voyage…</option>${voyageOpts(d.voyage_id)}</select></div>
      <div class="field span-2"><label>Shipper (Customer) *</label><select name="shipper_customer_id"><option value="">Select customer…</option>${customerOpts(d.shipper_customer_id)}</select></div>
      <div class="field"><label>Total Weight (kg) *</label><input type="number" step="0.01" name="total_weight_kg" value="${d.total_weight_kg||''}"></div>
      <div class="field"><label>Declared Value (USD)</label><input type="number" step="0.01" name="declared_value_usd" value="${d.declared_value_usd||''}"></div>
      <div class="field"><label>Status</label><select name="status">
        ${sOpt(['Draft','Issued','Signed','Locked','Disputed'],d.status)}</select></div>
      <div class="field span-2"><label>Cargo Description *</label><textarea name="cargo_description">${d.cargo_description||''}</textarea></div>
    </div>`;

    /* customs — notes field intentionally excluded */
    case 'customs': return `<div class="form-grid">
      <div class="field"><label>Shipment *</label><select name="shipment_id"><option value="">Select shipment…</option>${shipmentOpts(d.shipment_id)}</select></div>
      <div class="field"><label>Port *</label><select name="port_id"><option value="">Select port…</option>${portOpts(d.port_id)}</select></div>
      <div class="field span-2"><label>Customs Officer</label><select name="officer_id">${employeeOpts(d.officer_id,'Customs Agent')}</select></div>
      <div class="field"><label>Status</label><select name="status">
        ${sOpt(['Pending','Under Review','Cleared','Rejected','Hold'],d.status)}</select></div>
      <div class="field"><label>Clearance Date</label><input type="datetime-local" name="clearance_date" value="${d.clearance_date?d.clearance_date.slice(0,16):''}"></div>
    </div>`;

    case 'tracking': return `<div class="form-grid">
      <div class="field"><label>Shipment *</label><select name="shipment_id"><option value="">Select shipment…</option>${shipmentOpts(d.shipment_id)}</select></div>
      <div class="field"><label>Event Type *</label><select name="event_type">
        ${sOpt(['Booked','Departed','Arrived','Moved to Warehouse','Released from Warehouse','Customs Hold','Cleared','Delivered'],d.event_type)}</select></div>
      <div class="field"><label>Port Location</label><select name="location_port_id"><option value="">— None —</option>${portOpts(d.location_port_id)}</select></div>
      <div class="field"><label>Warehouse Location</label><select name="location_warehouse_id">${warehouseOpts(d.location_warehouse_id)}</select></div>
      <div class="field span-2"><label>Recorded By (Employee)</label><select name="recorded_by_employee_id">${employeeOpts(d.recorded_by_employee_id)}</select></div>
      <div class="field span-2"><label>Description</label><textarea name="description">${d.description||''}</textarea></div>
    </div>`;

    case 'manifest': return `<div class="form-grid">
      <div class="field"><label>Voyage *</label><select name="voyage_id"><option value="">Select voyage…</option>${voyageOpts(d.voyage_id)}</select></div>
      <div class="field"><label>Container *</label><select name="container_id"><option value="">Select container…</option>${containerOpts(d.container_id)}</select></div>
      <div class="field span-2"><label>Shipment *</label><select name="shipment_id"><option value="">Select shipment…</option>${shipmentOpts(d.shipment_id)}</select></div>
      <div class="field"><label>Weight (kg) *</label><input type="number" step="0.01" name="weight_kg" value="${d.weight_kg||''}"></div>
      <div class="field"><label>Hazmat?</label><select name="hazmat_flag">
        <option value="false"${!d.hazmat_flag?' selected':''}>No</option>
        <option value="true"${d.hazmat_flag?' selected':''}>Yes</option>
      </select></div>
      <div class="field span-2"><label>Hazmat Class (if applicable)</label><input name="hazmat_class" placeholder="e.g. Class 3 Flammable" value="${d.hazmat_class||''}"></div>
      <div class="field span-2"><label>Cargo Description *</label><textarea name="cargo_description">${d.cargo_description||''}</textarea></div>
    </div>`;

    case 'gps': return `<div class="form-grid">
      <div class="field"><label>Vessel *</label><select name="vessel_id"><option value="">Select vessel…</option>${vesselOpts(d.vessel_id)}</select></div>
      <div class="field"><label>Voyage *</label><select name="voyage_id"><option value="">Select voyage…</option>${voyageOpts(d.voyage_id)}</select></div>
      <div class="field"><label>Latitude *</label><input type="number" step="0.000001" name="latitude" placeholder="-29.858680" value="${d.latitude||''}"></div>
      <div class="field"><label>Longitude *</label><input type="number" step="0.000001" name="longitude" placeholder="31.021840" value="${d.longitude||''}"></div>
      <div class="field"><label>Speed (knots)</label><input type="number" step="0.01" name="speed_knots" value="${d.speed_knots||''}"></div>
      <div class="field"><label>Heading (°)</label><input type="number" step="0.01" name="heading_degrees" value="${d.heading_degrees||''}"></div>
    </div>`;

    default: return '<p style="color:var(--danger)">Unknown form type.</p>';
  }
}

/* ── SUBMIT ───────────────────────────────────────────────── */
async function submitModal() {
  const inputs = document.getElementById('modal-body').querySelectorAll('input,select,textarea');
  const data = {};
  inputs.forEach(el => {
    if (!el.name) return;
    let v = el.value.trim();
    if (v === '')     v = null;
    if (v === 'true') v = true;
    if (v === 'false') v = false;
    data[el.name] = v;
  });

  const EP = {
    vessel:'vessels', voyage:'voyages', port:'ports', shipment:'shipments',
    container:'containers', warehouse:'warehouses', customer:'customers', employee:'employees',
    bol:'bol', customs:'customs', tracking:'tracking', manifest:'manifests', gps:'gps'
  };
  const ep = EP[modalContext];
  if (!ep) return;

  const btn = document.getElementById('modal-submit-btn');
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    if (editingId) {
      await apiFetch(`/${ep}/${editingId}`, {method:'PUT', body:JSON.stringify(data)});
      toast('Updated successfully','success');
    } else {
      await apiFetch(`/${ep}`, {method:'POST', body:JSON.stringify(data)});
      toast('Created successfully','success');
    }
    closeModal();
    loadView(currentView);
  } catch(e) {
    toast(e.message,'error');
  } finally {
    btn.textContent = 'Save'; btn.disabled = false;
  }
}

/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type==='success'?'✓':type==='error'?'✕':'ℹ'}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}