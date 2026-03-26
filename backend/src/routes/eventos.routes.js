const express = require("express");
const router = express.Router();

const eventosController = require("../controllers/eventos.controller");

router.get("/proximos", eventosController.getEventosProximos);
router.get("/stats/:id", eventosController.getEventoStats);
router.get("/cuadrillas/:anio/:paso/:evento_id", eventosController.getCuadrillaAsistenciaByEvento);
router.post("/asistencia", eventosController.upsertAsistencia);
router.get("/:anio", eventosController.getEventosByAnio);
router.post("/", eventosController.createEvento);
router.delete("/:id", eventosController.deleteEvento);

module.exports = router;