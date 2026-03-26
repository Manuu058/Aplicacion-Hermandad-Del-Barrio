const db = require("../config/db");

const getStats = async (req, res) => {
    try {
        const [
            hermanosResult,
            tunicasResult,
            cajasDisponiblesResult,
            actasResult
        ] = await Promise.all([
            db.query("SELECT COUNT(*) FROM hermanos"),
            db.query("SELECT COUNT(*) FROM tunicas"),
            db.query("SELECT COUNT(*) FROM cajas WHERE estado = 'Disponible'"),
            db.query("SELECT COUNT(*) FROM actas_junta")
        ]);

        res.json({
            hermanos: parseInt(hermanosResult.rows[0].count, 10) || 0,
            tunicasPrestadas: parseInt(tunicasResult.rows[0].count, 10) || 0,
            cajasDisponibles: parseInt(cajasDisponiblesResult.rows[0].count, 10) || 0,
            actas: parseInt(actasResult.rows[0].count, 10) || 0
        });
    } catch (err) {
        console.error("Error en getStats:", err);
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
};

module.exports = { getStats };