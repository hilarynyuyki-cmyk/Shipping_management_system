// src/routes/customer.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/customer.controller');
const router = Router();
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   ctrl.create);
router.put('/:id', ctrl.update);
module.exports = router;
