const db = require('../config/db');

// 1. OBTENER EVENTOS POR AÑO
const getEventosByAnio = async (req, res) => {
    const { anio } = req.params;

    if (!anio) {
        return res.status(400).json({ error: "El parámetro anio es obligatorio" });
    }

    try {
        const query = `
            SELECT 
                id,
                titulo,
                tipo,
                DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
                hora,
                paso,
                anio
            FROM eventos_cuadrilla
            WHERE anio = ?
            ORDER BY fecha ASC, hora ASC
        `;
        const [rows] = await db.query(query, [anio]);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getEventosByAnio:", err);
        res.status(500).json({ error: "Error al obtener eventos" });
    }
};

// 2. CREAR NUEVO EVENTO
const createEvento = async (req, res) => {
    let { titulo, tipo, fecha, hora, paso, anio } = req.body;

    if (!titulo || !tipo || !fecha || !paso || !anio) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const anioParseado = parseInt(anio, 10);

    try {
        // Verificar duplicados
        const [duplicado] = await db.query(
            `SELECT id FROM eventos_cuadrilla 
             WHERE anio = ? AND fecha = ? AND hora = ? AND LOWER(TRIM(paso)) = LOWER(TRIM(?)) AND LOWER(TRIM(tipo)) = LOWER(TRIM(?)) 
             LIMIT 1`,
            [anioParseado, fecha, hora || '21:00', paso, tipo]
        );

        if (duplicado.length > 0) {
            return res.status(400).json({ error: "Ya existe una cita igual para esa fecha y paso" });
        }

        const [result] = await db.query(
            `INSERT INTO eventos_cuadrilla (titulo, tipo, fecha, hora, paso, anio) VALUES (?, ?, ?, ?, ?, ?)`,
            [titulo, tipo, fecha, hora || '21:00', paso, anioParseado]
        );

        res.status(201).json({
            message: "Evento creado con éxito",
            id: result.insertId
        });
    } catch (err) {
        console.error("Error en createEvento:", err);
        res.status(500).json({ error: "Error al crear evento" });
    }
};

// 3. OBTENER LISTA DE COSTALEROS + SU ESTADO DE ASISTENCIA
const getCuadrillaAsistenciaByEvento = async (req, res) => {
    const { anio, paso, evento_id } = req.params;

    try {
        const query = `
            SELECT 
                ap.costalero_id,
                mc.nombre,
                mc.apellidos,
                ap.posicion,
                COALESCE(ae.asistio, 'Pendiente') AS asistio
            FROM asignacion_pasos ap
            JOIN maestro_costaleros mc ON ap.costalero_id = mc.id
            LEFT JOIN asistencia_ensayos ae
                ON ap.costalero_id = ae.costalero_id
                AND ae.evento_id = ?
            WHERE ap.anio = ?
              AND LOWER(TRIM(ap.paso)) = LOWER(TRIM(?))
            ORDER BY CAST(ap.posicion AS UNSIGNED) ASC, mc.apellidos ASC, mc.nombre ASC
        `;

        const [rows] = await db.query(query, [evento_id, anio, paso]);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getCuadrillaAsistenciaByEvento:", err);
        res.status(500).json({ error: "Error al obtener la cuadrilla del evento" });
    }
};

// 4. GUARDAR O ACTUALIZAR ASISTENCIA (UPSERT para MySQL)
const upsertAsistencia = async (req, res) => {
    const { evento_id, costalero_id, asistio } = req.body;

    try {
        const query = `
            INSERT INTO asistencia_ensayos (evento_id, costalero_id, asistio)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE asistio = VALUES(asistio)
        `;
        await db.query(query, [evento_id, costalero_id, asistio]);
        res.status(200).json({ message: "Asistencia guardada correctamente" });
    } catch (err) {
        console.error("Error en upsertAsistencia:", err);
        res.status(500).json({ error: "Error al guardar asistencia" });
    }
};

// 5. BUSCADOR DE ESTADÍSTICAS POR COSTALERO
const searchCostaleroStats = async (req, res) => {
    const { query } = req.params;
    try {
        const sql = `
            SELECT 
                mc.id, mc.nombre, mc.apellidos,
                COUNT(ae.id) AS total_citas,
                SUM(CASE WHEN ae.asistio = 'Asistió' THEN 1 ELSE 0 END) AS asistencias,
                SUM(CASE WHEN ae.asistio = 'Falta Justificada' THEN 1 ELSE 0 END) AS justificadas,
                SUM(CASE WHEN ae.asistio = 'Falta Injustificada' THEN 1 ELSE 0 END) AS injustificadas,
                IF(COUNT(ae.id) = 0, 0, ROUND(SUM(CASE WHEN ae.asistio = 'Asistió' THEN 1 ELSE 0 END) * 100 / COUNT(ae.id))) AS porcentaje
            FROM maestro_costaleros mc
            LEFT JOIN asistencia_ensayos ae ON mc.id = ae.costalero_id
            WHERE mc.nombre LIKE ? OR mc.apellidos LIKE ?
            GROUP BY mc.id, mc.nombre, mc.apellidos
            ORDER BY porcentaje DESC LIMIT 10
        `;
        const [rows] = await db.query(sql, [`%${query}%`, `%${query}%`]);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en searchCostaleroStats:", err);
        res.status(500).json({ error: "Error al buscar estadísticas" });
    }
};

// 6. CONTADORES DE UN EVENTO
const getEventoStats = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                e.id, e.titulo, e.tipo, e.fecha, e.hora, e.paso,
                COUNT(DISTINCT ap.costalero_id) AS total_costaleros,
                COUNT(DISTINCT CASE WHEN ae.asistio = 'Asistió' THEN ae.costalero_id END) AS asistentes,
                COUNT(DISTINCT CASE WHEN ae.asistio = 'Falta Justificada' THEN ae.costalero_id END) AS justificadas,
                COUNT(DISTINCT CASE WHEN ae.asistio = 'Falta Injustificada' THEN ae.costalero_id END) AS injustificadas
            FROM eventos_cuadrilla e
            LEFT JOIN asignacion_pasos ap ON ap.anio = e.anio AND LOWER(TRIM(ap.paso)) = LOWER(TRIM(e.paso))
            LEFT JOIN asistencia_ensayos ae ON ae.evento_id = e.id AND ae.costalero_id = ap.costalero_id
            WHERE e.id = ?
            GROUP BY e.id
        `;
        const [rows] = await db.query(query, [id]);
        res.json(rows[0] || {});
    } catch (err) {
        console.error("Error en getEventoStats:", err);
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
};

// 7. ELIMINAR EVENTO
const deleteEvento = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM asistencia_ensayos WHERE evento_id = ?", [id]);
        const [result] = await db.query("DELETE FROM eventos_cuadrilla WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ error: "No encontrado" });
        res.status(200).json({ message: "Evento eliminado correctamente" });
    } catch (err) {
        console.error("Error en deleteEvento:", err);
        res.status(500).json({ error: "Error al eliminar" });
    }
};

// 8. LISTADO COMPLETO DE CITAS Y ASISTENCIA
const getEventosResumenByAnio = async (req, res) => {
    const { anio } = req.params;
    try {
        const query = `
            SELECT
                e.id AS evento_id, e.titulo, e.tipo, e.fecha, e.hora, e.paso,
                ap.posicion, mc.nombre, mc.apellidos,
                COALESCE(ae.asistio, 'Pendiente') AS asistio
            FROM eventos_cuadrilla e
            JOIN asignacion_pasos ap ON ap.anio = e.anio AND LOWER(TRIM(ap.paso)) = LOWER(TRIM(e.paso))
            JOIN maestro_costaleros mc ON mc.id = ap.costalero_id
            LEFT JOIN asistencia_ensayos ae ON ae.costalero_id = mc.id AND ae.evento_id = e.id
            WHERE e.anio = ?
            ORDER BY e.fecha ASC, e.hora ASC, CAST(ap.posicion AS UNSIGNED) ASC
        `;
        const [rows] = await db.query(query, [anio]);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getEventosResumenByAnio:", err);
        res.status(500).json({ error: "Error al obtener resumen" });
    }
};

const getEventosProximos = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, titulo, tipo, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, hora, paso, anio
            FROM eventos_cuadrilla
            WHERE fecha >= CURDATE()
            ORDER BY fecha ASC, hora ASC
            LIMIT 5
        `);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getEventosProximos:", err);
        res.status(500).json({ error: "Error al obtener próximos eventos" });
    }
};

module.exports = {
    getEventosByAnio,
    getEventosProximos,
    createEvento,
    getCuadrillaAsistenciaByEvento,
    upsertAsistencia,
    searchCostaleroStats,
    getEventoStats,
    deleteEvento,
    getEventosResumenByAnio
};