const db = require("../config/db");

// Obtener todos los eventos
const getEventos = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM agenda_hermandad ORDER BY fecha ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Funciones básicas para que no den error las rutas
const createEvento = async (req, res) => { res.json({ msg: "creado" }); };
const updateEvento = async (req, res) => { res.json({ msg: "actualizado" }); };
const deleteEvento = async (req, res) => { res.json({ msg: "borrado" }); };

module.exports = { 
    getEventos, 
    createEvento, 
    updateEvento, 
    deleteEvento 
};