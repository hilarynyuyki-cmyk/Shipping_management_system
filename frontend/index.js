/* ════════════════════════════════════════════════════════════
   CONFIG & STATE
════════════════════════════════════════════════════════════ */
const API = () => (document.getElementById('api-url').value || 'http://localhost:3000').replace(/\/$/, '');

let currentView = 'dashboard';
let modalContext = null;
let editingId = null;

// caches for dropdowns
let _ports = [], _vessels = [], _customers = [], _employees = [], _warehouses = [], _voyages = [], _shipments = [], _containers = [];

/* ════════════════════════════════════════════════════════════
   API HELPERS
════════════════════════════════════════════════════════════ */
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API()}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || json.errors?.join(', ') || 'API error');
  return json.data;
}

async function testConnection() {
  const dot = document.getElementById('api-dot');
  const txt = document.getElementById('api-status-text');
  dot.className = 'api-dot'; txt.textContent = 'Connecting…';
  try {
    await apiFetch('/dashboard/health');
    dot.className = 'api-dot connected'; txt.textContent = 'Connected';
    toast('Connected to MarineOS backend', 'success');
    loadView(currentView);
  } catch {
    dot.className = 'api-dot error'; txt.textContent = 'Connection failed';
    toast('Cannot reach backend — check URL', 'error');
  }
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════════════════════ */
document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    navigateTo(view);
  });
});

function navigateTo(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  currentView = view;
  const titles = {
    dashboard:'Dashboard', vessels:'Vessels', voyages:'Voyages', ports:'Ports',
    portcalls:'Port Calls', gps:'Vessel Positions', shipments:'Shipments',
    containers:'Containers', warehouses:'Warehouses', manifests:'Cargo Manifests',
    bol:'Bills of Lading', invoices:'Freight Invoices', customs:'Customs Clearance',
    tracking:'Tracking Events', customers:'Customers', employees:'Employees'
  };
  document.getElementById('page-title').textContent = titles[view] || view;

  const addBtns = {
    vessels:    () => '<button class="btn btn-primary" onclick="openModal(\'vessel\')">+ Add Vessel</button>',
    voyages:    () => '<button class="btn btn-primary" onclick="openModal(\'voyage\')">+ Add Voyage</button>',
    ports:      () => '<button class="btn btn-primary" onclick="openModal(\'port\')">+ Add Port</button>',
    shipments:  () => '<button class="btn btn-primary" onclick="openModal(\'shipment\')">+ Book Shipment</button>',
    containers: () => '<button class="btn btn-primary" onclick="openModal(\'container\')">+ Add Container</button>',
    warehouses: () => '<button class="btn btn-primary" onclick="openModal(\'warehouse\')">+ Add Warehouse</button>',
    bol:        () => '<button class="btn btn-primary" onclick="openModal(\'bol\')">+ Create BOL</button>',
    customs:    () => '<button class="btn btn-primary" onclick="openModal(\'customs\')">+ New Clearance</button>',
    tracking:   () => '<button class="btn btn-primary" onclick="openModal(\'tracking\')">+ Log Event</button>',
    customers:  () => '<button class="btn btn-primary" onclick="openModal(\'customer\')">+ Add Customer</button>',
    employees:  () => '<button class="btn btn-primary" onclick="openModal(\'employee\')">+ Add Employee</button>',
    manifests:  () => '<button class="btn btn-primary" onclick="openModal(\'manifest\')">+ Add to Manifest</button>',
  };
  document.getElementById('topbar-actions').innerHTML = addBtns[view] ? addBtns[view]() : '';

  loadView(view);
}

async function loadView(view) {
  switch(view) {
    case 'dashboard':   loadDashboard(); break;
    case 'vessels':     loadVessels(); break;
    case 'voyages':     loadVoyages(); break;
    case 'ports':       loadPorts(); break;
    case 'portcalls':   loadPortCalls(); break;
    case 'gps':         loadGPS(); break;
    case 'shipments':   loadShipments(); break;
    case 'containers':  loadContainers(); break;
    case 'warehouses':  loadWarehouses(); break;
    case 'manifests':   loadManifests(); break;
    case 'bol':         loadBOL(); break;
    case 'invoices':    loadInvoices(); break;
    case 'customs':     loadCustoms(); break;
    case 'tracking':    loadTracking(); break;
    case 'customers':   loadCustomers(); break;
    case 'employees':   loadEmployees(); break;
  }
}

/* ════════════════════════════════════════════════════════════
   STATUS BADGE HELPERS
════════════════════════════════════════════════════════════ */
function statusBadge(status) {
  const map = {
    'At Sea': 'badge-blue', 'In Port': 'badge-green', 'Under Maintenance': 'badge-yellow',
    'Docked': 'badge-gray', 'Scheduled': 'badge-blue', 'Departed': 'badge-orange',
    'In Transit': 'badge-purple', 'Arrived': 'badge-green', 'Cancelled': 'badge-red',
    'Booked': 'badge-blue', 'Loading': 'badge-orange', 'In Warehouse': 'badge-yellow',
    'Customs': 'badge-purple', 'Delivered': 'badge-green',
    'Available': 'badge-green', 'At Port': 'badge-blue', 'Under Inspection': 'badge-yellow',
    'Draft': 'badge-gray', 'Issued': 'badge-blue', 'Signed': 'badge-purple',
    'Locked': 'badge-navy', 'Disputed': 'badge-red',
    'Unpaid': 'badge-yellow', 'Paid': 'badge-green', 'Overdue': 'badge-red',
    'Refunded': 'badge-gray',
    'Pending': 'badge-yellow', 'Under Review': 'badge-orange', 'Cleared': 'badge-green',
    'Rejected': 'badge-red', 'Hold': 'badge-red',
    'Operational': 'badge-green', 'Full': 'badge-red', 'Closed': 'badge-gray',
    'Active': 'badge-green', 'Suspended': 'badge-red',
  };
  return `<span class="badge ${map[status]||'badge-gray'}">${status||'—'}</span>`;
}

function fmt(v) { return v ? new Date(v).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '—'; }
function fmtDate(v) { return v ? new Date(v).toLocaleDateString('en-GB') : '—'; }
function num(v) { return v != null ? Number(v).toLocaleString() : '—'; }

/* ════════════════════════════════════════════════════════════
   TABLE FILTER
════════════════════════════════════════════════════════════ */
function filterTable(tbodyId, searchId) {
  const term = document.getElementById(searchId)?.value.toLowerCase() || '';
  const rows = document.querySelectorAll(`#${tbodyId} tr`);
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = text.includes(term) ? '' : 'none';
  });
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const stats = await apiFetch('/dashboard/stats');
    document.getElementById('s-vessels').textContent   = stats.vessels   ?? '—';
    document.getElementById('s-voyages').textContent   = stats.voyages   ?? '—';
    document.getElementById('s-shipments').textContent = stats.shipments ?? '—';
    document.getElementById('s-customers').textContent = stats.customers ?? '—';
    document.getElementById('s-customs').textContent   = stats.pending_customs ?? '—';
    document.getElementById('s-warehouses').textContent= stats.warehouses ?? '—';
  } catch(e) { /* silent */ }

  try {
    const recent = await apiFetch('/dashboard/recent-shipments');
    const div = document.getElementById('dash-shipments');
    if (!recent.length) { div.innerHTML='<div class="empty-state"><p>No shipments yet</p></div>'; return; }
    div.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>Customer</th><th>Origin</th><th>Destination</th><th>Warehouse</th><th>Status</th></tr></thead><tbody>
      ${recent.map(s=>`<tr>
        <td>${s.customer_name}</td><td>${s.origin}</td><td>${s.destination}</td>
        <td>${s.warehouse_name||'—'}</td><td>${statusBadge(s.status)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
  } catch {}

  try {
    const tracking = await apiFetch('/dashboard/recent-tracking');
    const div = document.getElementById('dash-tracking');
    if (!tracking.length) { div.innerHTML='<div class="empty-state"><p>No events yet</p></div>'; return; }
    div.innerHTML = `<ul class="timeline" style="padding:16px 18px">
      ${tracking.map(e=>`<li>
        <div class="tl-dot" style="background:var(--sky)">${e.event_type?.[0]||'•'}</div>
        <div class="tl-content">
          <div class="tl-title">${e.event_type} — Shipment #${e.shipment_id}</div>
          <div class="tl-meta">${fmt(e.event_datetime)} · ${e.description||''}</div>
        </div>
      </li>`).join('')}
    </ul>`;
  } catch {}
}

/* ════════════════════════════════════════════════════════════
   VESSELS
════════════════════════════════════════════════════════════ */
async function loadVessels() {
  try {
    const data = await apiFetch('/vessels');
    _vessels = data;
    const tbody = document.getElementById('vessel-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No vessels found</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(v=>`<tr>
      <td><strong>${v.vessel_name}</strong></td>
      <td>${v.vessel_type}</td>
      <td class="td-mono">${v.imo_number}</td>
      <td>${v.flag_country}</td>
      <td>${num(v.gross_tonnage)}</td>
      <td>${num(v.max_capacity_teu)}</td>
      <td>${statusBadge(v.current_status)}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("vessel",${JSON.stringify(v)})'>Edit</button>
          <button class="btn btn-danger btn-sm" style="margin-left:4px" onclick="deleteRecord('vessels',${v.vessel_id},'vessel-')">Del</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('vessel-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   VOYAGES
════════════════════════════════════════════════════════════ */
async function loadVoyages() {
  try {
    const data = await apiFetch('/voyages');
    _voyages = data;
    const tbody = document.getElementById('voyage-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No voyages</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(v=>`<tr>
      <td class="td-mono"><strong>${v.voyage_code}</strong></td>
      <td>${v.vessel_name||v.vessel_id}</td>
      <td>${v.origin_port||v.origin_port_id}</td>
      <td>${v.destination_port||v.destination_port_id}</td>
      <td>${fmt(v.departure_datetime)}</td>
      <td>${fmt(v.estimated_arrival)}</td>
      <td>${v.total_distance_nm ? num(v.total_distance_nm)+'nm' : '—'}</td>
      <td>${statusBadge(v.status)}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("voyage",${JSON.stringify(v)})'>Edit</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('voyage-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   PORTS
════════════════════════════════════════════════════════════ */
async function loadPorts() {
  try {
    const data = await apiFetch('/ports');
    _ports = data;
    const tbody = document.getElementById('port-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No ports</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(p=>`<tr>
      <td><strong>${p.port_name}</strong></td>
      <td class="td-mono">${p.port_code}</td>
      <td>${p.city}</td><td>${p.country}</td>
      <td class="td-mono">${p.latitude}, ${p.longitude}</td>
      <td>${p.timezone||'—'}</td>
      <td>${p.max_vessel_capacity||'—'}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("port",${JSON.stringify(p)})'>Edit</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('port-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   PORT CALLS
════════════════════════════════════════════════════════════ */
async function loadPortCalls() {
  try {
    const [voyages, ports] = await Promise.all([apiFetch('/voyages'), apiFetch('/ports')]);
    const portMap = Object.fromEntries(ports.map(p=>[p.port_id, p.port_name]));
    const voyageMap = Object.fromEntries(voyages.map(v=>[v.voyage_id, v.voyage_code]));
    const tbody = document.getElementById('portcall-tbody');
    // Port calls are embedded in voyages or fetched from each voyage
    // Fetch all voyages then get port_calls
    const allCalls = [];
    for (const v of voyages.slice(0,20)) {
      try {
        const vd = await apiFetch(`/voyages/${v.voyage_id}`);
        if (vd.port_calls) vd.port_calls.forEach(c=>allCalls.push({...c, voyage_code:v.voyage_code}));
      } catch {}
    }
    if (!allCalls.length) { tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><p>No port calls recorded</p></div></td></tr>'; return; }
    tbody.innerHTML = allCalls.map(c=>`<tr>
      <td class="td-mono">${c.voyage_code||c.voyage_id}</td>
      <td>${portMap[c.port_id]||c.port_id}</td>
      <td>${c.call_sequence}</td>
      <td>${fmt(c.arrival_datetime)}</td>
      <td>${fmt(c.departure_datetime)}</td>
      <td>${statusBadge(c.purpose)}</td>
      <td>${c.berth_number||'—'}</td>
    </tr>`).join('');
  } catch(e) { document.getElementById('portcall-tbody').innerHTML=`<tr><td colspan="7" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   GPS POSITIONS
════════════════════════════════════════════════════════════ */
async function loadGPS() {
  try {
    const data = await apiFetch('/gps');
    const tbody = document.getElementById('gps-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><p>No positions logged</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(p=>`<tr>
      <td>${p.vessel_name||p.vessel_id}</td>
      <td>${p.voyage_code||p.voyage_id}</td>
      <td class="td-mono">${p.latitude}</td>
      <td class="td-mono">${p.longitude}</td>
      <td>${p.speed_knots??'—'}</td>
      <td>${p.heading_degrees??'—'}</td>
      <td>${fmt(p.recorded_at)}</td>
    </tr>`).join('');
  } catch(e) { document.getElementById('gps-tbody').innerHTML=`<tr><td colspan="7" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   SHIPMENTS
════════════════════════════════════════════════════════════ */
async function loadShipments() {
  try {
    const data = await apiFetch('/shipments');
    _shipments = data;
    const tbody = document.getElementById('shipment-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>No shipments</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(s=>`<tr>
      <td class="td-mono">#${s.shipment_id}</td>
      <td>${s.customer_name||s.customer_id}</td>
      <td class="td-mono">${s.voyage_code||s.voyage_id}</td>
      <td>${s.origin||s.origin_port_id}</td>
      <td>${s.destination||s.destination_port_id}</td>
      <td>${s.cargo_type}</td>
      <td>${num(s.total_weight_kg)}</td>
      <td>${s.warehouse_name||'—'}</td>
      <td>${statusBadge(s.status)}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("shipment",${JSON.stringify(s)})'>Edit</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('shipment-tbody').innerHTML=`<tr><td colspan="10" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   CONTAINERS
════════════════════════════════════════════════════════════ */
async function loadContainers() {
  try {
    const data = await apiFetch('/containers');
    _containers = data;
    const tbody = document.getElementById('container-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No containers</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(c=>`<tr>
      <td class="td-mono"><strong>${c.container_code}</strong></td>
      <td>${c.container_type}</td>
      <td>${num(c.max_weight_kg)}</td>
      <td>${c.current_weight_kg!=null?num(c.current_weight_kg):'—'}</td>
      <td>${c.shipment_id||'—'}</td>
      <td>${c.vessel_id||'—'}</td>
      <td>${c.warehouse_name||c.warehouse_id||'—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("container",${JSON.stringify(c)})'>Edit</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('container-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   WAREHOUSES
════════════════════════════════════════════════════════════ */
async function loadWarehouses() {
  try {
    const data = await apiFetch('/warehouses');
    _warehouses = data;
    // Capacity cards
    const cards = document.getElementById('warehouse-cards');
    cards.innerHTML = data.map(w=>{
      const pct = Math.round((w.current_load_tonnes/w.capacity_tonnes)*100)||0;
      const cls = pct>=90?'danger':pct>=70?'warn':'';
      return `<div class="panel" style="margin:0">
        <div class="panel-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <div style="font-weight:600;font-size:14px;color:var(--navy)">${w.warehouse_name}</div>
              <div style="font-size:11px;color:var(--gray-500);margin-top:2px">${w.warehouse_code} · ${w.warehouse_type}</div>
            </div>
            ${statusBadge(w.status)}
          </div>
          <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--gray-500)">
            <span>${num(w.current_load_tonnes)} t loaded</span>
            <span>${pct}% · ${num(w.capacity_tonnes)} t cap.</span>
          </div>
          <div style="margin-top:8px;font-size:12px;color:var(--gray-500)">${w.city}, ${w.country}</div>
        </div>
      </div>`;
    }).join('');

    const tbody = document.getElementById('warehouse-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>No warehouses</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(w=>`<tr>
      <td><strong>${w.warehouse_name}</strong></td>
      <td class="td-mono">${w.warehouse_code}</td>
      <td>${w.port_name||w.port_id}</td>
      <td>${w.city}</td>
      <td>${w.warehouse_type}</td>
      <td>${num(w.capacity_tonnes)} t</td>
      <td>${num(w.current_load_tonnes)} t</td>
      <td>${w.manager_name||w.manager_employee_id||'—'}</td>
      <td>${statusBadge(w.status)}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("warehouse",${JSON.stringify(w)})'>Edit</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('warehouse-tbody').innerHTML=`<tr><td colspan="10" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   MANIFESTS
════════════════════════════════════════════════════════════ */
async function loadManifests() {
  try {
    const data = await apiFetch('/manifests');
    const tbody = document.getElementById('manifest-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No manifests</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(m=>`<tr>
      <td>#${m.manifest_id}</td>
      <td>${m.voyage_code||m.voyage_id}</td>
      <td>${m.container_code||m.container_id}</td>
      <td>#${m.shipment_id}</td>
      <td>${m.cargo_description}</td>
      <td>${num(m.weight_kg)}</td>
      <td>${m.hazmat_flag?'<span class="badge badge-red">Yes</span>':'<span class="badge badge-gray">No</span>'}</td>
      <td>${m.hazmat_class||'—'}</td>
      <td>${fmt(m.created_at)}</td>
    </tr>`).join('');
  } catch(e) { document.getElementById('manifest-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   BILLS OF LADING
════════════════════════════════════════════════════════════ */
async function loadBOL() {
  try {
    const data = await apiFetch('/bol');
    const tbody = document.getElementById('bol-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No bills of lading</p></div></td></tr>'; return; }
    const statuses = ['Draft','Issued','Signed','Locked','Disputed'];
    tbody.innerHTML = data.map(b=>`<tr>
      <td class="td-mono"><strong>${b.bol_number}</strong></td>
      <td>#${b.shipment_id}</td>
      <td>${b.voyage_code||b.voyage_id}</td>
      <td>${b.shipper_name||b.shipper_customer_id}</td>
      <td>${fmtDate(b.issue_date)}</td>
      <td>${num(b.total_weight_kg)}</td>
      <td>$${num(b.declared_value_usd)}</td>
      <td>${statusBadge(b.status)}</td>
      <td>
        <select class="btn btn-secondary btn-sm" style="padding:4px 6px" onchange="updateBOLStatus(${b.bol_id},this.value)">
          ${statuses.map(s=>`<option value="${s}"${s===b.status?' selected':''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('');
  } catch(e) { document.getElementById('bol-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

async function updateBOLStatus(id, status) {
  try {
    await apiFetch(`/bol/${id}/status`, { method:'PATCH', body:JSON.stringify({status}) });
    toast('BOL status updated', 'success');
  } catch(e) { toast(e.message, 'error'); loadBOL(); }
}

/* ════════════════════════════════════════════════════════════
   FREIGHT INVOICES
════════════════════════════════════════════════════════════ */
async function loadInvoices() {
  try {
    const data = await apiFetch('/invoices');
    const tbody = document.getElementById('invoice-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>No invoices</p></div></td></tr>'; return; }
    const pmethods = ['Bank Transfer','Credit Card','Letter of Credit'];
    const pstatuses = ['Unpaid','Paid','Overdue','Disputed','Refunded'];
    tbody.innerHTML = data.map(i=>`<tr>
      <td>#${i.invoice_id}</td>
      <td>#${i.shipment_id}</td>
      <td>${i.customer_name||i.customer_id}</td>
      <td><strong>$${num(i.amount_usd)}</strong></td>
      <td>${i.currency||'USD'}</td>
      <td>${fmtDate(i.due_date)}</td>
      <td>${statusBadge(i.payment_status)}</td>
      <td>${fmt(i.payment_date)}</td>
      <td>${i.payment_method||'—'}</td>
      <td style="display:flex;gap:4px;align-items:center">
        <select style="font-size:11px;padding:3px 5px;border-radius:4px;border:1px solid var(--gray-200)" id="inv-status-${i.invoice_id}">
          ${pstatuses.map(s=>`<option value="${s}"${s===i.payment_status?' selected':''}>${s}</option>`).join('')}
        </select>
        <select style="font-size:11px;padding:3px 5px;border-radius:4px;border:1px solid var(--gray-200)" id="inv-method-${i.invoice_id}">
          <option value="">Method</option>
          ${pmethods.map(m=>`<option value="${m}"${m===i.payment_method?' selected':''}>${m}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="updateInvoice(${i.invoice_id})">✓</button>
      </td>
    </tr>`).join('');
  } catch(e) { document.getElementById('invoice-tbody').innerHTML=`<tr><td colspan="10" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

async function updateInvoice(id) {
  const status = document.getElementById(`inv-status-${id}`)?.value;
  const method = document.getElementById(`inv-method-${id}`)?.value;
  try {
    await apiFetch(`/invoices/${id}/payment`, { method:'PATCH', body:JSON.stringify({payment_status:status, payment_method:method||undefined}) });
    toast('Invoice updated', 'success'); loadInvoices();
  } catch(e) { toast(e.message,'error'); }
}

/* ════════════════════════════════════════════════════════════
   CUSTOMS CLEARANCE
════════════════════════════════════════════════════════════ */
async function loadCustoms() {
  try {
    const data = await apiFetch('/customs');
    const tbody = document.getElementById('customs-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="9"><div class="empty-state"><p>No customs records</p></div></td></tr>'; return; }
    const statuses = ['Pending','Under Review','Cleared','Rejected','Hold'];
    tbody.innerHTML = data.map(c=>`<tr>
      <td>#${c.clearance_id}</td>
      <td>#${c.shipment_id}</td>
      <td>${c.port_name||c.port_id}</td>
      <td>${c.officer_name||c.officer_id||'—'}</td>
      <td>${fmt(c.submission_date)}</td>
      <td>${fmt(c.clearance_date)}</td>
      <td>${statusBadge(c.status)}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.notes||'—'}</td>
      <td>
        <select class="btn btn-secondary btn-sm" style="padding:4px 6px" onchange="updateCustomsStatus(${c.clearance_id},this.value)">
          ${statuses.map(s=>`<option value="${s}"${s===c.status?' selected':''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('');
  } catch(e) { document.getElementById('customs-tbody').innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

async function updateCustomsStatus(id, status) {
  try {
    await apiFetch(`/customs/${id}/status`, { method:'PATCH', body:JSON.stringify({status}) });
    toast('Customs status updated', 'success');
  } catch(e) { toast(e.message,'error'); loadCustoms(); }
}

/* ════════════════════════════════════════════════════════════
   TRACKING EVENTS
════════════════════════════════════════════════════════════ */
async function loadTracking() {
  try {
    const data = await apiFetch('/tracking');
    const tbody = document.getElementById('tracking-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No tracking events</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(e=>`<tr>
      <td>#${e.event_id}</td>
      <td>#${e.shipment_id}</td>
      <td>${statusBadge(e.event_type)}</td>
      <td>${e.port_name||e.location_port_id||'—'}</td>
      <td>${e.warehouse_name||e.location_warehouse_id||'—'}</td>
      <td>${e.employee_name||e.recorded_by_employee_id||'—'}</td>
      <td>${fmt(e.event_datetime)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.description||'—'}</td>
    </tr>`).join('');
  } catch(e) { document.getElementById('tracking-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   CUSTOMERS
════════════════════════════════════════════════════════════ */
async function loadCustomers() {
  try {
    const data = await apiFetch('/customers');
    _customers = data;
    const tbody = document.getElementById('customer-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="8"><div class="empty-state"><p>No customers</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(c=>`<tr>
      <td><strong>${c.full_name}</strong></td>
      <td>${c.company_name||'—'}</td>
      <td>${c.email}</td>
      <td>${c.phone_number||'—'}</td>
      <td>${c.country}</td>
      <td>${statusBadge(c.account_status)}</td>
      <td>${fmtDate(c.created_at)}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("customer",${JSON.stringify(c)})'>Edit</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('customer-tbody').innerHTML=`<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   EMPLOYEES
════════════════════════════════════════════════════════════ */
async function loadEmployees() {
  try {
    const data = await apiFetch('/employees');
    _employees = data;
    const tbody = document.getElementById('employee-tbody');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><p>No employees</p></div></td></tr>'; return; }
    tbody.innerHTML = data.map(e=>`<tr>
      <td><strong>${e.full_name}</strong></td>
      <td>${statusBadge(e.role)}</td>
      <td>${e.email}</td>
      <td>${e.port_name||e.port_id||'—'}</td>
      <td>${fmtDate(e.hire_date)}</td>
      <td>${e.is_active?'<span class="badge badge-green">Active</span>':'<span class="badge badge-red">Inactive</span>'}</td>
      <td><button class="btn btn-secondary btn-sm" onclick='openEditModal("employee",${JSON.stringify(e)})'>Edit</button></td>
    </tr>`).join('');
  } catch(e) { document.getElementById('employee-tbody').innerHTML=`<tr><td colspan="7" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

/* ════════════════════════════════════════════════════════════
   DELETE RECORDS
════════════════════════════════════════════════════════════ */
async function deleteRecord(endpoint, id, prefix) {
  if (!confirm('Delete this record?')) return;
  try {
    await apiFetch(`/${endpoint}/${id}`, { method:'DELETE' });
    toast('Deleted successfully', 'success');
    loadView(currentView);
  } catch(e) { toast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════════
   MODAL SYSTEM
════════════════════════════════════════════════════════════ */
async function ensureCaches() {
  if (!_ports.length)     try { _ports = await apiFetch('/ports'); } catch {}
  if (!_vessels.length)   try { _vessels = await apiFetch('/vessels'); } catch {}
  if (!_customers.length) try { _customers = await apiFetch('/customers'); } catch {}
  if (!_employees.length) try { _employees = await apiFetch('/employees'); } catch {}
  if (!_warehouses.length)try { _warehouses = await apiFetch('/warehouses'); } catch {}
  if (!_voyages.length)   try { _voyages = await apiFetch('/voyages'); } catch {}
  if (!_shipments.length) try { _shipments = await apiFetch('/shipments'); } catch {}
  if (!_containers.length)try { _containers = await apiFetch('/containers'); } catch {}
}

function portOpts(sel) { return _ports.map(p=>`<option value="${p.port_id}"${p.port_id==sel?' selected':''}>${p.port_name} (${p.port_code})</option>`).join(''); }
function vesselOpts(sel) { return _vessels.map(v=>`<option value="${v.vessel_id}"${v.vessel_id==sel?' selected':''}>${v.vessel_name}</option>`).join(''); }
function customerOpts(sel) { return _customers.map(c=>`<option value="${c.customer_id}"${c.customer_id==sel?' selected':''}>${c.full_name}${c.company_name?' — '+c.company_name:''}</option>`).join(''); }
function employeeOpts(sel, roleFilter) {
  let list = _employees;
  if (roleFilter) list = list.filter(e=>e.role===roleFilter);
  return `<option value="">— None —</option>` + list.map(e=>`<option value="${e.employee_id}"${e.employee_id==sel?' selected':''}>${e.full_name} (${e.role})</option>`).join('');
}
function warehouseOpts(sel) { return `<option value="">— None —</option>` + _warehouses.map(w=>`<option value="${w.warehouse_id}"${w.warehouse_id==sel?' selected':''}>${w.warehouse_name}</option>`).join(''); }
function voyageOpts(sel) { return _voyages.map(v=>`<option value="${v.voyage_id}"${v.voyage_id==sel?' selected':''}>${v.voyage_code} — ${v.vessel_name||''}</option>`).join(''); }
function shipmentOpts(sel) { return `<option value="">— None —</option>` + _shipments.map(s=>`<option value="${s.shipment_id}"${s.shipment_id==sel?' selected':''}>#${s.shipment_id} ${s.cargo_type} (${s.customer_name||''})</option>`).join(''); }
function containerOpts(sel) { return _containers.map(c=>`<option value="${c.container_id}"${c.container_id==sel?' selected':''}>${c.container_code} (${c.container_type})</option>`).join(''); }

async function openModal(type, data = null) {
  await ensureCaches();
  editingId = data ? (data.vessel_id||data.voyage_id||data.shipment_id||data.container_id||
    data.warehouse_id||data.customer_id||data.employee_id||data.port_id||data.clearance_id||
    data.bol_id||data.manifest_id||data.event_id) : null;
  modalContext = type;
  document.getElementById('modal-title').textContent = (editingId ? 'Edit ' : 'Add ') + {
    vessel:'Vessel', voyage:'Voyage', port:'Port', shipment:'Shipment',
    container:'Container', warehouse:'Warehouse', customer:'Customer',
    employee:'Employee', bol:'Bill of Lading', customs:'Customs Clearance',
    tracking:'Tracking Event', manifest:'Cargo Manifest Entry', gps:'Vessel Position'
  }[type];
  document.getElementById('modal-body').innerHTML = buildForm(type, data);
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditModal(type, data) { openModal(type, data); }

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  modalContext = null; editingId = null;
}

function buildForm(type, d={}) {
  d = d || {};
  const sel = (opts, val) => opts; // opts already build selection
  switch(type) {
    case 'vessel': return `<div class="form-grid">
      <div class="field"><label>Vessel Name *</label><input name="vessel_name" value="${d.vessel_name||''}"></div>
      <div class="field"><label>Vessel Type *</label><select name="vessel_type">
        ${['Container Ship','Bulk Carrier','Tanker','Ro-Ro'].map(t=>`<option${t===d.vessel_type?' selected':''}>${t}</option>`).join('')}
      </select></div>
      <div class="field"><label>IMO Number *</label><input name="IMO_number" placeholder="IMO1234567" value="${d.imo_number||d.IMO_number||''}"></div>
      <div class="field"><label>Flag Country *</label><input name="flag_country" value="${d.flag_country||''}"></div>
      <div class="field"><label>Gross Tonnage *</label><input type="number" name="gross_tonnage" value="${d.gross_tonnage||''}"></div>
      <div class="field"><label>Max Capacity (TEU) *</label><input type="number" name="max_capacity_TEU" value="${d.max_capacity_teu||d.max_capacity_TEU||''}"></div>
      <div class="field"><label>Status *</label><select name="current_status">
        ${['At Sea','In Port','Under Maintenance','Docked'].map(s=>`<option${s===d.current_status?' selected':''}>${s}</option>`).join('')}
      </select></div>
      <div class="field"><label>Build Year</label><input type="number" name="build_year" placeholder="2015" value="${d.build_year||''}"></div>
      <div class="field span-2"><label>Owner Company</label><input name="owner_company" value="${d.owner_company||''}"></div>
    </div>`;

    case 'port': return `<div class="form-grid">
      <div class="field span-2"><label>Port Name *</label><input name="port_name" value="${d.port_name||''}"></div>
      <div class="field"><label>Port Code * (e.g. ZADUR)</label><input name="port_code" placeholder="XXXXX" maxlength="10" value="${d.port_code||''}"></div>
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
        ${['Scheduled','Departed','In Transit','Arrived','Cancelled'].map(s=>`<option${s===d.status?' selected':''}>${s}</option>`).join('')}
      </select></div>
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
        ${['Electronics','Textiles','Food','Chemicals','Machinery','Vehicles','Raw Materials','Consumer Goods','Other'].map(t=>`<option${t===d.cargo_type?' selected':''}>${t}</option>`).join('')}
      </select></div>
      <div class="field"><label>Total Weight (kg) *</label><input type="number" step="0.01" name="total_weight_kg" value="${d.total_weight_kg||''}"></div>
      <div class="field"><label>Warehouse (optional)</label><select name="warehouse_id">${warehouseOpts(d.warehouse_id)}</select></div>
      <div class="field"><label>Status</label><select name="status">
        ${['Booked','Loading','In Transit','In Warehouse','Customs','Delivered','Cancelled'].map(s=>`<option${s===d.status?' selected':''}>${s}</option>`).join('')}
      </select></div>
      ${!editingId ? `
      <div class="field" style="grid-column:span 2;border-top:1px solid var(--gray-100);padding-top:12px;margin-top:4px">
        <p style="font-size:12px;color:var(--gray-500);margin-bottom:8px">📋 A Freight Invoice will be created automatically (ACID transaction)</p>
      </div>
      <div class="field"><label>Invoice Amount (USD) *</label><input type="number" step="0.01" name="invoice_amount" placeholder="0.00"></div>
      <div class="field"><label>Invoice Due Date *</label><input type="date" name="invoice_due_date"></div>` : ''}
      <div class="field span-2"><label>Special Instructions</label><textarea name="special_instructions">${d.special_instructions||''}</textarea></div>
    </div>`;

    case 'container': return `<div class="form-grid">
      <div class="field"><label>Container Code *</label><input name="container_code" placeholder="MSCU1234567" value="${d.container_code||''}"></div>
      <div class="field"><label>Container Type *</label><select name="container_type">
        ${['20ft','40ft','Refrigerated','Open Top','Flat Rack'].map(t=>`<option${t===d.container_type?' selected':''}>${t}</option>`).join('')}
      </select></div>
      <div class="field"><label>Max Weight (kg) *</label><input type="number" step="0.01" name="max_weight_kg" value="${d.max_weight_kg||''}"></div>
      <div class="field"><label>Current Weight (kg)</label><input type="number" step="0.01" name="current_weight_kg" value="${d.current_weight_kg||''}"></div>
      <div class="field"><label>Status *</label><select name="status">
        ${['Available','In Transit','At Port','In Warehouse','Under Inspection'].map(s=>`<option${s===d.status?' selected':''}>${s}</option>`).join('')}
      </select></div>
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
        ${['General','Refrigerated','Hazmat','Bonded','Open Yard'].map(t=>`<option${t===d.warehouse_type?' selected':''}>${t}</option>`).join('')}
      </select></div>
      <div class="field"><label>Status *</label><select name="status">
        ${['Operational','Full','Under Maintenance','Closed'].map(s=>`<option${s===d.status?' selected':''}>${s}</option>`).join('')}
      </select></div>
      <div class="field"><label>Capacity (tonnes) *</label><input type="number" step="0.01" name="capacity_tonnes" value="${d.capacity_tonnes||''}"></div>
      <div class="field"><label>Current Load (tonnes)</label><input type="number" step="0.01" name="current_load_tonnes" value="${d.current_load_tonnes||0}"></div>
      <div class="field"><label>Manager (Warehouse Manager)</label><select name="manager_employee_id">${employeeOpts(d.manager_employee_id,'Warehouse Manager')}</select></div>
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
        ${['Active','Suspended','Pending'].map(s=>`<option${s===d.account_status?' selected':''}>${s}</option>`).join('')}
      </select></div>
      ${!editingId?`<div class="field span-2"><label>Password *</label><input type="password" name="password" placeholder="Minimum 8 characters"></div>`:''}
      <div class="field span-2"><label>Address</label><textarea name="address">${d.address||''}</textarea></div>
    </div>`;

    case 'employee': return `<div class="form-grid">
      <div class="field"><label>Full Name *</label><input name="full_name" value="${d.full_name||''}"></div>
      <div class="field"><label>Role *</label><select name="role">
        ${['Admin','Port Officer','Captain','Customs Agent','Analyst','Warehouse Manager'].map(r=>`<option${r===d.role?' selected':''}>${r}</option>`).join('')}
      </select></div>
      <div class="field"><label>Email *</label><input type="email" name="email" value="${d.email||''}"></div>
      <div class="field"><label>Port Assignment</label><select name="port_id"><option value="">— None —</option>${portOpts(d.port_id)}</select></div>
      <div class="field"><label>Hire Date</label><input type="date" name="hire_date" value="${d.hire_date?d.hire_date.slice(0,10):''}"></div>
      <div class="field"><label>Active</label><select name="is_active"><option value="true"${d.is_active!==false?' selected':''}>Active</option><option value="false"${d.is_active===false?' selected':''}>Inactive</option></select></div>
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
        ${['Draft','Issued','Signed','Locked','Disputed'].map(s=>`<option${s===d.status?' selected':''}>${s}</option>`).join('')}
      </select></div>
      <div class="field span-2"><label>Cargo Description *</label><textarea name="cargo_description">${d.cargo_description||''}</textarea></div>
    </div>`;

    case 'customs': return `<div class="form-grid">
      <div class="field"><label>Shipment *</label><select name="shipment_id"><option value="">Select shipment…</option>${shipmentOpts(d.shipment_id)}</select></div>
      <div class="field"><label>Port *</label><select name="port_id"><option value="">Select port…</option>${portOpts(d.port_id)}</select></div>
      <div class="field span-2"><label>Customs Officer</label><select name="officer_id">${employeeOpts(d.officer_id,'Customs Agent')}</select></div>
      <div class="field"><label>Status</label><select name="status">
        ${['Pending','Under Review','Cleared','Rejected','Hold'].map(s=>`<option${s===d.status?' selected':''}>${s}</option>`).join('')}
      </select></div>
      <div class="field"><label>Clearance Date</label><input type="datetime-local" name="clearance_date" value="${d.clearance_date?d.clearance_date.slice(0,16):''}"></div>
      <div class="field span-2"><label>Notes</label><textarea name="notes">${d.notes||''}</textarea></div>
    </div>`;

    case 'tracking': return `<div class="form-grid">
      <div class="field"><label>Shipment *</label><select name="shipment_id"><option value="">Select shipment…</option>${shipmentOpts(d.shipment_id)}</select></div>
      <div class="field"><label>Event Type *</label><select name="event_type">
        ${['Booked','Departed','Arrived','Moved to Warehouse','Released from Warehouse','Customs Hold','Cleared','Delivered'].map(t=>`<option${t===d.event_type?' selected':''}>${t}</option>`).join('')}
      </select></div>
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
      <div class="field span-2"><label>Hazmat Class (required if hazmat)</label><input name="hazmat_class" placeholder="e.g. Class 3 Flammable" value="${d.hazmat_class||''}"></div>
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
  }
  return '<p>Unknown form type</p>';
}

async function submitModal() {
  const body = document.getElementById('modal-body');
  const inputs = body.querySelectorAll('input,select,textarea');
  const data = {};
  inputs.forEach(el => {
    if (!el.name) return;
    let val = el.value.trim();
    if (val === '') val = null;
    // coerce booleans
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    data[el.name] = val;
  });

  const endpoints = {
    vessel:'vessels', voyage:'voyages', port:'ports', shipment:'shipments',
    container:'containers', warehouse:'warehouses', customer:'customers',
    employee:'employees', bol:'bol', customs:'customs',
    tracking:'tracking', manifest:'manifests', gps:'gps'
  };
  const endpoint = endpoints[modalContext];
  if (!endpoint) return;

  const btn = document.getElementById('modal-submit-btn');
  btn.textContent = 'Saving…'; btn.disabled = true;

  try {
    if (editingId) {
      await apiFetch(`/${endpoint}/${editingId}`, { method:'PUT', body:JSON.stringify(data) });
      toast('Updated successfully', 'success');
    } else {
      await apiFetch(`/${endpoint}`, { method:'POST', body:JSON.stringify(data) });
      toast('Created successfully', 'success');
    }
    closeModal();
    loadView(currentView);
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    btn.textContent = 'Save'; btn.disabled = false;
  }
}

/* ════════════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════════════ */
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type==='success'?'✓':type==='error'?'✕':'ℹ'}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  testConnection();
});


