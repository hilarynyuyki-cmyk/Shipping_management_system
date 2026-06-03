// src/routes/bol.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/bol.controller');
const router = Router();
router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getOne);
router.post('/',             ctrl.create);
router.patch('/:id/status',  ctrl.updateStatus);
module.exports = router;
