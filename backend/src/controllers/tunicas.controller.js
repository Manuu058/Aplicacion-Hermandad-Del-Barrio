const db = require("../config/db");

// Listar cajas
const getCajas = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM cajas ORDER BY numero_caja ASC"
        );
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getCajas:", err);
        res.status(500).json({ error: "Error al obtener cajas" });
    }
};

// Obtener una túnica por ID
const getTunicaById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `
            SELECT 
                t.id,
                t.hermano_id,
                t.caja_id,
                h.nombre,
                h.apellidos,
                h.numero_hermano,
                c.numero_caja,
                t.estado AS estado_tunica,
                t.descripcion
            FROM tunicas t
            LEFT JOIN hermanos h ON t.hermano_id = h.id
            INNER JOIN cajas c ON t.caja_id = c.id
            WHERE t.id = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Túnica no encontrada" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error en getTunicaById:", err);
        res.status(500).json({ error: "Error al obtener la túnica" });
    }
};

// Listado detallado
const getTunicas = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                t.id,
                t.hermano_id,
                t.caja_id,
                t.nombre_manual,
                t.apellidos_manual,
                t.dni_manual,
                h.nombre,
                h.apellidos,
                h.numero_hermano,
                c.numero_caja,
                t.estado AS estado_tunica,
                t.descripcion
            FROM tunicas t
            LEFT JOIN hermanos h ON t.hermano_id = h.id
            LEFT JOIN cajas c ON t.caja_id = c.id
            ORDER BY c.numero_caja ASC, t.id DESC
        `);

        res.json(rows || []);
    } catch (err) {
        console.error("Error en getTunicas:", err);
        res.status(500).json({ error: "Error al obtener túnicas", detalle: err.message });
    }
};

// Estadísticas
const getTunicasStats = async (req, res) => {
    try {
        const [prestadas] = await db.query("SELECT COUNT(*) AS total FROM tunicas");
        const [disponibles] = await db.query("SELECT COUNT(*) AS total FROM cajas WHERE estado = 'Disponible'");
        const [ocupadas] = await db.query("SELECT COUNT(*) AS total FROM cajas WHERE estado = 'Ocupada'");

        res.json({
            tunicasPrestadas: Number(prestadas[0]?.total || 0),
            cajasDisponibles: Number(disponibles[0]?.total || 0),
            cajasOcupadas: Number(ocupadas[0]?.total || 0)
        });
    } catch (err) {
        console.error("Error en getTunicasStats:", err);
        res.status(500).json({ error: "Error al obtener estadísticas de túnicas" });
    }
};

// Historial
const getHistorialTunicasByHermano = async (req, res) => {
    const { hermano_id } = req.params;

    try {
        const [rows] = await db.query(
            `
            SELECT 
                t.id,
                t.hermano_id,
                t.caja_id,
                h.nombre,
                h.apellidos,
                h.numero_hermano,
                c.numero_caja,
                t.estado AS estado_tunica,
                t.descripcion
            FROM tunicas t
            LEFT JOIN hermanos h ON t.hermano_id = h.id
            INNER JOIN cajas c ON t.caja_id = c.id
            WHERE t.hermano_id = ?
            ORDER BY t.id DESC
            `,
            [hermano_id]
        );

        res.json(rows || []);
    } catch (err) {
        console.error("Error en getHistorialTunicasByHermano:", err);
        res.status(500).json({ error: "Error al obtener historial de túnicas" });
    }
};

// Crear
const createTunica = async (req, res) => {
    const { hermano_id, caja_id, estado, descripcion } = req.body;

    if (!caja_id || !estado) {
        return res.status(400).json({
            error: "Los campos caja_id y estado son obligatorios"
        });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [cajaRows] = await connection.query(
            "SELECT * FROM cajas WHERE id = ?",
            [caja_id]
        );

        if (cajaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "La caja no existe" });
        }

        if (String(cajaRows[0].estado || "").trim().toLowerCase() !== "disponible") {
            await connection.rollback();
            return res.status(400).json({ error: "La caja no está disponible" });
        }

        const [insertResult] = await connection.query(
            `
            INSERT INTO tunicas (hermano_id, caja_id, estado, descripcion)
            VALUES (?, ?, ?, ?)
            `,
            [hermano_id || null, caja_id, estado, descripcion || null]
        );

        await connection.query(
            "UPDATE cajas SET estado = 'Ocupada' WHERE id = ?",
            [caja_id]
        );

        const [nuevaTunica] = await connection.query(
            "SELECT * FROM tunicas WHERE id = ?",
            [insertResult.insertId]
        );

        await connection.commit();

        res.status(201).json({
            message: "Túnica creada correctamente",
            tunica: nuevaTunica[0]
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error en createTunica:", err);
        res.status(500).json({ error: "Error al crear la túnica" });
    } finally {
        if (connection) connection.release();
    }
};

// Actualizar
const updateTunica = async (req, res) => {
    const { id } = req.params;
    const { estado, descripcion } = req.body;

    try {
        const [result] = await db.query(
            `
            UPDATE tunicas
            SET estado = ?, descripcion = ?
            WHERE id = ?
            `,
            [estado, descripcion || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        res.json({ message: "Túnica actualizada correctamente" });
    } catch (err) {
        console.error("Error en updateTunica:", err);
        res.status(500).json({ error: "Error al actualizar la túnica" });
    }
};

// Eliminar / devolver
const deleteTunica = async (req, res) => {
    const { id } = req.params;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            "SELECT caja_id FROM tunicas WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        const cajaId = rows[0].caja_id;

        await connection.query("DELETE FROM tunicas WHERE id = ?", [id]);
        await connection.query(
            "UPDATE cajas SET estado = 'Disponible' WHERE id = ?",
            [cajaId]
        );

        await connection.commit();

        res.json({ message: "Túnica devuelta y caja liberada" });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error en deleteTunica:", err);
        res.status(500).json({ error: "Error al devolver la túnica" });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getCajas,
    getTunicaById,
    getTunicas,
    getTunicasStats,
    getHistorialTunicasByHermano,
    createTunica,
    updateTunica,
    deleteTunica
};