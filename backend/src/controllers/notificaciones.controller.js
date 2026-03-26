const db = require("../config/db");

const getNotificaciones = async (req, res) => {
    try {
        // En MariaDB usamos DATE_FORMAT en lugar de to_char
        // Y eliminamos NULLS LAST que no es compatible
        const [rows] = await db.query(`
            SELECT 
                id,
                titulo,
                tipo,
                DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
                hora,
                lugar,
                descripcion
            FROM agenda_hermandad
            WHERE fecha >= CURRENT_DATE
            ORDER BY fecha ASC, hora ASC
            LIMIT 5
        `);

        // mysql2 devuelve los datos directamente en 'rows'
        const notificaciones = (rows || []).map((ev) => ({
            id: ev.id,
            titulo: ev.titulo,
            mensaje: `${ev.tipo} - ${ev.fecha}${ev.hora ? ` ${ev.hora}` : ""}`,
            tipo: ev.tipo
        }));

        res.json(notificaciones);
    } catch (err) {
        console.error("Error en getNotificaciones:", err);
        // Si la tabla no existe aún, enviamos un array vacío en lugar de un error 500
        // para que el Dashboard no se bloquee.
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json([]);
        }
        res.status(500).json({ error: "Error al obtener notificaciones" });
    }
};

module.exports = { getNotificaciones };