// src/routes/dashboard.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/dashboard.controller');
const router = Router();

router.get('/health',            ctrl.healthCheck);
router.get('/stats',             ctrl.getStats);
router.get('/recent-shipments',  ctrl.getRecentShipments);
router.get('/recent-tracking',   ctrl.getRecentTracking);

module.exports = router;
