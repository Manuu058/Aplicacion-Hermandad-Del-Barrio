const express = require("express");
const router = express.Router();

const {
    getActas,
    getActaById,
    createActa,
    updateActa,
    deleteActa
} = require("../controllers/actas.controller");

/**
 * 📄 ACTAS
 * Base: /actas
 */

// Obtener todas las actas (con filtros)
// Ejemplo: /actas?fecha=2026-03-20&titulo=Cabildo&orden_dia=elecciones
router.get("/", getActas);

// Obtener una acta por ID
router.get("/:id", getActaById);

// Crear nueva acta
router.post("/", createActa);

// Actualizar acta
router.put("/:id", updateActa);

// Eliminar acta
router.delete("/:id", deleteActa);

module.exports = router;