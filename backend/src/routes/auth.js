const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Verificación de seguridad
if (!authController.login || !authController.register) {
    console.error("❌ ERROR: Las funciones login o register no se encuentran en auth.controller.js");
}

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authController.getMe);

module.exports = router;