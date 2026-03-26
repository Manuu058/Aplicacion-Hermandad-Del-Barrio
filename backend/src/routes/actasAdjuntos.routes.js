const express = require("express");
const router = express.Router();

const uploadActas = require("../middlewares/uploadActas");

const {
    subirAdjuntosActa,
    listarAdjuntosActa,
    verAdjuntoPdf,
    descargarAdjuntoPdf,
    eliminarAdjuntoPdf,
    marcarPdfOficial
} = require("../controllers/actasAdjuntos.controller");

/**
 * 📎 ADJUNTOS DE ACTAS
 * Base: /actas
 */

// Subir PDFs a un acta
router.post(
    "/:id/adjuntos",
    uploadActas.array("pdfs", 10), // máximo 10 archivos
    subirAdjuntosActa
);

// Listar PDFs de un acta
router.get("/:id/adjuntos", listarAdjuntosActa);

// 🔥 IMPORTANTE: rutas de adjuntos (NO dependen de :id de acta)

// Ver PDF en navegador
router.get("/adjunto/:adjuntoId/ver", verAdjuntoPdf);

// Descargar PDF
router.get("/adjunto/:adjuntoId/descargar", descargarAdjuntoPdf);

// Eliminar PDF
router.delete("/adjunto/:adjuntoId", eliminarAdjuntoPdf);

// Marcar PDF como oficial
router.put("/adjunto/:adjuntoId/oficial", marcarPdfOficial);

module.exports = router;