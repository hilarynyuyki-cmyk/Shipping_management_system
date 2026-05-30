const service=require('../services/gpsService');
exports.getAll=async(req,res)=>res.json(await service.getAll());
exports.getById=async(req,res)=>res.json(await service.getById(req.params.id));
