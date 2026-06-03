// src/routes/shipment.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/shipment.controller');
const router = Router();

router.get('/',              ctrl.getAll);
router.get('/in-warehouse',  ctrl.getInWarehouse);
router.get('/:id',           ctrl.getOne);
router.post('/',             ctrl.create);
router.put('/:id',           ctrl.update);

module.exports = router;
