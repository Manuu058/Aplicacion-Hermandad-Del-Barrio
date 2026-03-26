const express = require("express");
const router = express.Router();

const pagosController = require("../controllers/pagos.controller");

// Ver estado de pagos por año
router.get("/estado/:anio", pagosController.getEstadoPagosByAnio);

// Cambiar estado de pago
router.post("/toggle", pagosController.togglePago);

// Ver pagos de un hermano
router.get("/hermano/:hermano_id", pagosController.getPagosByHermano);

// Ver pagos por año
router.get("/:anio", pagosController.getPagosByAnio);

// Crear pago
router.post("/", pagosController.createPago);

// Actualizar estado de pago
router.put("/:id", pagosController.updateEstadoPago);

// Eliminar pago
router.delete("/:id", pagosController.deletePago);

module.exports = router;