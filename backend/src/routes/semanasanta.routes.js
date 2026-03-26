const express = require("express");
const router = express.Router();

const semanaSantaController = require("../controllers/semanasanta.controller");

// Ver Semana Santa por año
router.get("/:anio", semanaSantaController.getSemanaSantaByAnio);

// Crear registro de Semana Santa
router.post("/", semanaSantaController.createSemanaSanta);

// Cambiar estado de pago de Semana Santa
router.put("/:id/pago", semanaSantaController.togglePagoSemanaSanta);

// Eliminar registro
router.delete("/:id", semanaSantaController.deleteSemanaSanta);

module.exports = router;