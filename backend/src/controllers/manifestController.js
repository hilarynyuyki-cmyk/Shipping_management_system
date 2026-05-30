const service=require('../services/manifestService');
exports.getAll=async(req,res)=>res.json(await service.getAll());
exports.getById=async(req,res)=>res.json(await service.getById(req.params.id));
