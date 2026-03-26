const express = require("express");
const router = express.Router();

const costalerosController = require("../controllers/costaleros.controller");

// Obtener todos los costaleros
router.get("/costaleros-todos", costalerosController.getAllCostaleros);

// Obtener cuadrilla por año y paso
router.get("/cuadrillas/:anio/:paso", costalerosController.getCuadrillaByAnioPaso);

// Crear costalero nuevo
router.post("/costaleros-nuevo", costalerosController.createCostalero);

// Crear asignación a cuadrilla
router.post("/cuadrillas", costalerosController.createAsignacionCuadrilla);

// Eliminar asignación de cuadrilla
router.delete("/cuadrillas/:anio/:paso/:costalero_id", costalerosController.deleteAsignacionCuadrilla);

// Obtener faltistas frecuentes
router.get("/faltistas/:anio", costalerosController.getFaltistasFrecuentes);

module.exports = router;