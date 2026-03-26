const express = require("express");
const router = express.Router();
const { 
    getEventos, 
    createEvento, 
    updateEvento, 
    deleteEvento 
} = require("../controllers/agenda.controller");

// Verifica que ninguna de estas variables sea "undefined"
router.get("/", getEventos); // Esta suele ser la línea 10 que falla
router.post("/", createEvento);
router.put("/:id", updateEvento);
router.delete("/:id", deleteEvento);

module.exports = router;