// src/routes/index.js
// ─────────────────────────────────────────────────────────────
//  Central router — mounts every resource under /api
// ─────────────────────────────────────────────────────────────
const { Router } = require('express');
const router = Router();

router.use('/dashboard',  require('./dashboard.routes'));
router.use('/vessels',    require('./vessel.routes'));
router.use('/voyages',    require('./voyage.routes'));
router.use('/shipments',  require('./shipment.routes'));
router.use('/warehouses', require('./warehouse.routes'));
router.use('/ports',      require('./port.routes'));
router.use('/customers',  require('./customer.routes'));
router.use('/employees',  require('./employee.routes'));
router.use('/gps',        require('./gps.routes'));
router.use('/tracking',   require('./tracking.routes'));
router.use('/bol',        require('./bol.routes'));
router.use('/invoices',   require('./invoice.routes'));
router.use('/customs',    require('./customs.routes'));
router.use('/containers', require('./container.routes'));
router.use('/manifests',  require('./manifest.routes'));

module.exports = router;
