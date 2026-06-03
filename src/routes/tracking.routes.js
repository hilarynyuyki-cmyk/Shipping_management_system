// src/routes/tracking.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/tracking.controller');
const router = Router();
router.get('/',                          ctrl.getAll);
router.get('/recent',                    ctrl.getRecent);
router.get('/shipment/:shipmentId',      ctrl.getByShipment);
router.post('/',                         ctrl.create);
module.exports = router;
