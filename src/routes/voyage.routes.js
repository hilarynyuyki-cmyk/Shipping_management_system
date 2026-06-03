// src/routes/voyage.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/voyage.controller');
const router = Router();

router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getOne);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);

module.exports = router;
