const db = require("../config/db");

const getActas = async (req, res) => {
    const {
        fecha,
        titulo,
        numero_acta,
        tipo_reunion,
        estado,
        redactor,
        orden_dia
    } = req.query;

    try {
        let query = `
            SELECT
                id,
                numero_acta,
                titulo,
                DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
                tipo_reunion,
                orden_dia,
                contenido,
                acuerdos,
                tareas,
                observaciones,
                estado,
                redactor,
                creado_en,
                actualizado_en
            FROM actas_junta
            WHERE 1=1
        `;

        const params = [];

        if (fecha) {
            query += ` AND fecha = ?`;
            params.push(fecha);
        }

        if (titulo) {
            query += ` AND titulo LIKE ?`;
            params.push(`%${titulo}%`);
        }

        if (numero_acta) {
            query += ` AND CAST(numero_acta AS CHAR) LIKE ?`;
            params.push(`%${numero_acta}%`);
        }

        if (tipo_reunion) {
            query += ` AND tipo_reunion LIKE ?`;
            params.push(`%${tipo_reunion}%`);
        }

        if (estado) {
            query += ` AND estado LIKE ?`;
            params.push(`%${estado}%`);
        }

        if (redactor) {
            query += ` AND redactor LIKE ?`;
            params.push(`%${redactor}%`);
        }

        if (orden_dia) {
            query += ` AND orden_dia LIKE ?`;
            params.push(`%${orden_dia}%`);
        }

        query += ` ORDER BY fecha DESC, id DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getActas:", err);
        res.status(500).json({ error: "Error al obtener actas" });
    }
};

const getActaById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                numero_acta,
                titulo,
                DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
                tipo_reunion,
                orden_dia,
                contenido,
                acuerdos,
                tareas,
                observaciones,
                estado,
                redactor,
                creado_en,
                actualizado_en
            FROM actas_junta
            WHERE id = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Acta no encontrada" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error en getActaById:", err);
        res.status(500).json({ error: "Error al obtener el acta" });
    }
};

const createActa = async (req, res) => {
    const {
        numero_acta,
        titulo,
        fecha,
        tipo_reunion,
        orden_dia,
        contenido,
        acuerdos,
        tareas,
        observaciones,
        estado,
        redactor
    } = req.body;

    if (!titulo || !fecha || !tipo_reunion) {
        return res.status(400).json({
            error: "Los campos titulo, fecha y tipo_reunion son obligatorios"
        });
    }

    try {
        const [result] = await db.query(
            `
            INSERT INTO actas_junta
            (
                numero_acta,
                titulo,
                fecha,
                tipo_reunion,
                orden_dia,
                contenido,
                acuerdos,
                tareas,
                observaciones,
                estado,
                redactor
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            `,
            [
                numero_acta || null,
                titulo,
                fecha,
                tipo_reunion,
                orden_dia || null,
                contenido || null,
                acuerdos || null,
                tareas || null,
                observaciones || null,
                estado || "Borrador",
                redactor || null
            ]
        );

        const [rows] = await db.query(`SELECT * FROM actas_junta WHERE id = ?`, [result.insertId]);

        res.status(201).json({
            message: "Acta creada correctamente",
            acta: rows[0]
        });
    } catch (err) {
        console.error("Error en createActa:", err);
        res.status(500).json({ error: "Error al crear acta" });
    }
};

const updateActa = async (req, res) => {
    const { id } = req.params;
    const {
        numero_acta,
        titulo,
        fecha,
        tipo_reunion,
        orden_dia,
        contenido,
        acuerdos,
        tareas,
        observaciones,
        estado,
        redactor
    } = req.body;

    if (!titulo || !fecha || !tipo_reunion) {
        return res.status(400).json({
            error: "Los campos titulo, fecha y tipo_reunion son obligatorios"
        });
    }

    try {
        const [result] = await db.query(
            `
            UPDATE actas_junta
            SET
                numero_acta = ?,
                titulo = ?,
                fecha = ?,
                tipo_reunion = ?,
                orden_dia = ?,
                contenido = ?,
                acuerdos = ?,
                tareas = ?,
                observaciones = ?,
                estado = ?,
                redactor = ?,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                numero_acta || null,
                titulo,
                fecha,
                tipo_reunion,
                orden_dia || null,
                contenido || null,
                acuerdos || null,
                tareas || null,
                observaciones || null,
                estado || "Borrador",
                redactor || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Acta no encontrada" });
        }

        const [rows] = await db.query(`SELECT * FROM actas_junta WHERE id = ?`, [id]);

        res.json({
            message: "Acta actualizada correctamente",
            acta: rows[0]
        });
    } catch (err) {
        console.error("Error en updateActa:", err);
        res.status(500).json({ error: "Error al actualizar acta" });
    }
};

const deleteActa = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(`SELECT * FROM actas_junta WHERE id = ?`, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Acta no encontrada" });
        }

        await db.query(`DELETE FROM actas_junta WHERE id = ?`, [id]);

        res.json({
            message: "Acta eliminada correctamente",
            acta: rows[0]
        });
    } catch (err) {
        console.error("Error en deleteActa:", err);
        res.status(500).json({ error: "Error al eliminar acta" });
    }
};

module.exports = {
    getActas,
    getActaById,
    createActa,
    updateActa,
    deleteActa
};