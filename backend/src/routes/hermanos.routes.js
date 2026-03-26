const express = require("express");
const router = express.Router();

const {
    getHermanos,
    getHermanoById,
    createHermano,
    updateHermano,
    deleteHermano
} = require("../controllers/hermanos.controller");

router.get("/", getHermanos);
router.get("/:id", getHermanoById);
router.post("/", createHermano);
router.put("/:id", updateHermano);
router.delete("/:id", deleteHermano);

module.exports = router;