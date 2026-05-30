const service=require('../services/vesselService');
exports.getAll=async(req,res)=>res.json(await service.getAll());
exports.getById=async(req,res)=>res.json(await service.getById(req.params.id));
