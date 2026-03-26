const express = require("express");
const router = express.Router();

router.post("/enviar", (req, res) => res.json({ msg: "Email service" }));

module.exports = router;