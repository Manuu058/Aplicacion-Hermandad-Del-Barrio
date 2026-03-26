const express = require("express");
const router = express.Router();
const tunicasController = require("../controllers/tunicas.controller");

router.get("/cajas", tunicasController.getCajas);
router.get("/stats", tunicasController.getTunicasStats);
router.get("/historial/:hermano_id", tunicasController.getHistorialTunicasByHermano);

router.get("/", tunicasController.getTunicas);
router.get("/:id", tunicasController.getTunicaById);
router.post("/", tunicasController.createTunica);
router.put("/:id", tunicasController.updateTunica);
router.delete("/:id", tunicasController.deleteTunica);

module.exports = router;