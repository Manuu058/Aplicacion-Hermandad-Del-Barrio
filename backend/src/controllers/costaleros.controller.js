const db = require("../config/db");

// Obtener todos los costaleros (Censo)
const getAllCostaleros = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM maestro_costaleros ORDER BY apellidos ASC, nombre ASC"
        );

        res.json(rows || []);
    } catch (err) {
        console.error("Error en getAllCostaleros:", err);
        res.status(500).json({ error: "Error al obtener costaleros" });
    }
};

// Obtener cuadrilla por año y paso
const getCuadrillaByAnioPaso = async (req, res) => {
    const { anio, paso } = req.params;

    if (!anio || !paso) {
        return res.status(400).json({
            error: "Los parámetros anio y paso son obligatorios"
        });
    }

    try {
        const query = `
            SELECT 
                c.*,
                mc.nombre,
                mc.apellidos,
                mc.telefono,
                mc.edad
            FROM asignacion_pasos c
            INNER JOIN maestro_costaleros mc ON c.costalero_id = mc.id
            WHERE c.anio = ?
              AND LOWER(TRIM(c.paso)) = LOWER(TRIM(?))
            ORDER BY CAST(c.posicion AS UNSIGNED) ASC, mc.apellidos ASC, mc.nombre ASC
        `;

        const [rows] = await db.query(query, [anio, paso]);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getCuadrillaByAnioPaso:", err);
        res.status(500).json({ error: "Error al obtener la cuadrilla" });
    }
};

// Crear nuevo costalero en el maestro
const createCostalero = async (req, res) => {
    const { nombre, apellidos, telefono, edad } = req.body;

    if (!nombre || !apellidos) {
        return res.status(400).json({
            error: "Los campos nombre y apellidos son obligatorios"
        });
    }

    try {
        const insertQuery = `
            INSERT INTO maestro_costaleros (nombre, apellidos, telefono, edad)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            nombre,
            apellidos,
            telefono || null,
            edad || null
        ]);

        const [rows] = await db.query(
            "SELECT * FROM maestro_costaleros WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            message: "Costalero creado con éxito",
            costalero: rows[0] || null
        });
    } catch (err) {
        console.error("Error en createCostalero:", err);
        res.status(500).json({ error: "Error al crear el costalero" });
    }
};

// Asignar costalero a un paso
const createAsignacionCuadrilla = async (req, res) => {
    const { costalero_id, anio, paso, posicion, suplemento } = req.body;

    if (!costalero_id || !anio || !paso || posicion === undefined || posicion === null) {
        return res.status(400).json({
            error: "Los campos costalero_id, anio, paso y posicion son obligatorios"
        });
    }

    const posicionNum = parseInt(posicion, 10);
    const suplementoNum = parseInt(suplemento, 10) || 0;

    if (Number.isNaN(posicionNum) || posicionNum < 1 || posicionNum > 6) {
        return res.status(400).json({
            error: "La posición debe estar entre 1 y 6"
        });
    }

    try {
        const existeQuery = `
            SELECT id
            FROM asignacion_pasos
            WHERE costalero_id = ?
              AND anio = ?
              AND LOWER(TRIM(paso)) = LOWER(TRIM(?))
            LIMIT 1
        `;

        const [existeRows] = await db.query(existeQuery, [costalero_id, anio, paso]);

        if (existeRows.length > 0) {
            return res.status(400).json({
                error: "Ese costalero ya está asignado a ese paso en ese año"
            });
        }

        const insertQuery = `
            INSERT INTO asignacion_pasos (costalero_id, anio, paso, posicion, suplemento)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [insertResult] = await db.query(insertQuery, [
            costalero_id,
            anio,
            paso,
            posicionNum,
            suplementoNum
        ]);

        const [rows] = await db.query(
            "SELECT * FROM asignacion_pasos WHERE id = ?",
            [insertResult.insertId]
        );

        res.status(201).json({
            message: "Asignación realizada",
            asignacion: rows[0] || null
        });
    } catch (err) {
        console.error("Error en createAsignacionCuadrilla:", err);
        res.status(500).json({ error: "Error al realizar la asignación" });
    }
};

// Quitar costalero de una cuadrilla
const deleteAsignacionCuadrilla = async (req, res) => {
    const { anio, paso, costalero_id } = req.params;

    if (!anio || !paso || !costalero_id) {
        return res.status(400).json({
            error: "Los parámetros anio, paso y costalero_id son obligatorios"
        });
    }

    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM asignacion_pasos
            WHERE anio = ?
              AND LOWER(TRIM(paso)) = LOWER(TRIM(?))
              AND costalero_id = ?
            LIMIT 1
            `,
            [anio, paso, costalero_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Asignación no encontrada"
            });
        }

        await db.query(
            `
            DELETE FROM asignacion_pasos
            WHERE anio = ?
              AND LOWER(TRIM(paso)) = LOWER(TRIM(?))
              AND costalero_id = ?
            `,
            [anio, paso, costalero_id]
        );

        res.json({
            message: "Costalero quitado de la cuadrilla",
            asignacion: rows[0]
        });
    } catch (err) {
        console.error("Error en deleteAsignacionCuadrilla:", err);
        res.status(500).json({ error: "Error al quitar costalero de la cuadrilla" });
    }
};

// Faltistas frecuentes por año
const getFaltistasFrecuentes = async (req, res) => {
    const { anio } = req.params;

    if (!anio) {
        return res.status(400).json({
            error: "El parámetro anio es obligatorio"
        });
    }

    try {
        const query = `
            SELECT
                mc.id,
                mc.nombre,
                mc.apellidos,
                COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) AS total_citas,
                COUNT(CASE WHEN e.id IS NOT NULL AND ae.asistio = 'Asistió' THEN 1 END) AS asistencias,
                COUNT(CASE WHEN e.id IS NOT NULL AND ae.asistio = 'Falta Justificada' THEN 1 END) AS justificadas,
                COUNT(CASE WHEN e.id IS NOT NULL AND ae.asistio = 'Falta Injustificada' THEN 1 END) AS injustificadas,
                COUNT(CASE WHEN e.id IS NOT NULL AND COALESCE(ae.asistio, 'Pendiente') = 'Pendiente' THEN 1 END) AS pendientes,
                CASE
                    WHEN COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) = 0 THEN 0
                    ELSE ROUND(
                        (
                            COUNT(CASE WHEN e.id IS NOT NULL AND ae.asistio = 'Asistió' THEN 1 END) * 100.0
                        ) / COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END),
                        0
                    )
                END AS porcentaje_asistencia
            FROM maestro_costaleros mc
            LEFT JOIN asistencia_ensayos ae
                ON mc.id = ae.costalero_id
            LEFT JOIN eventos_cuadrilla e
                ON ae.evento_id = e.id
               AND e.anio = ?
            GROUP BY mc.id, mc.nombre, mc.apellidos
            HAVING COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) > 0
            ORDER BY injustificadas DESC, porcentaje_asistencia ASC, mc.apellidos ASC, mc.nombre ASC
            LIMIT 25
        `;

        const [rows] = await db.query(query, [anio]);
        res.json(rows || []);
    } catch (err) {
        console.error("Error en getFaltistasFrecuentes:", err);
        res.status(500).json({ error: "Error al obtener faltistas frecuentes" });
    }
};

module.exports = {
    getAllCostaleros,
    getCuadrillaByAnioPaso,
    createCostalero,
    createAsignacionCuadrilla,
    deleteAsignacionCuadrilla,
    getFaltistasFrecuentes
};