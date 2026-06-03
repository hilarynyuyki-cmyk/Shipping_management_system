// src/routes/invoice.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/invoice.controller');
const router = Router();
router.get('/',               ctrl.getAll);
router.get('/:id',            ctrl.getOne);
router.patch('/:id/payment',  ctrl.updatePayment);
module.exports = router;
