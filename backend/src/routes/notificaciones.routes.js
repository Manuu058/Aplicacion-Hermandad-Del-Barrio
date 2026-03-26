const express = require("express");
const router = express.Router();
const { getNotificaciones } = require("../controllers/notificaciones.controller");

router.get("/", getNotificaciones);

module.exports = router; // <--- VERIFICA ESTA LÍNEA