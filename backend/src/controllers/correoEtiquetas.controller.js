const db = require("../config/db");

const getEtiquetasCorreo = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, nombre, creado_en
             FROM correo_etiquetas
             ORDER BY nombre ASC`
        );
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getEtiquetasCorreo:", err);
        res.status(500).json({ error: "Error al obtener etiquetas" });
    }
};

const createEtiquetaCorreo = async (req, res) => {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    try {
        const nombreLimpio = nombre.trim();

        const [existente] = await db.query(
            `SELECT * FROM correo_etiquetas WHERE nombre = ?`,
            [nombreLimpio]
        );

        if (existente.length > 0) {
            return res.status(201).json({
                message: "La etiqueta ya existía",
                etiqueta: existente[0]
            });
        }

        const [result] = await db.query(
            `INSERT INTO correo_etiquetas (nombre) VALUES (?)`,
            [nombreLimpio]
        );

        const [rows] = await db.query(
            `SELECT * FROM correo_etiquetas WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: "Etiqueta creada correctamente",
            etiqueta: rows[0]
        });
    } catch (err) {
        console.error("Error en createEtiquetaCorreo:", err);
        res.status(500).json({ error: "Error al crear etiqueta" });
    }
};

module.exports = {
    getEtiquetasCorreo,
    createEtiquetaCorreo
};