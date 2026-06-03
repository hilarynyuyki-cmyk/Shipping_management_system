// src/routes/warehouse.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/warehouse.controller');
const router = Router();

router.get('/stats', ctrl.getStats);
router.get('/',      ctrl.getAll);
router.get('/:id',   ctrl.getOne);
router.post('/',     ctrl.create);
router.put('/:id',   ctrl.update);

module.exports = router;
