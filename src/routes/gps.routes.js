// src/routes/gps.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/gps.controller');
const router = Router();
router.get('/',        ctrl.getAll);
router.get('/latest',  ctrl.getLatest);
router.post('/',       ctrl.create);
module.exports = router;
