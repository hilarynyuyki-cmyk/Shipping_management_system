// src/routes/manifest.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/manifest.controller');
const router = Router();
router.get('/',                   ctrl.getAll);
router.get('/voyage/:voyageId',   ctrl.getByVoyage);
router.post('/',                  ctrl.create);
module.exports = router;
