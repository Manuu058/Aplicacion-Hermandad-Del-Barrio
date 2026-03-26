const db = require("../config/db");

// Listar hermanos
const getHermanos = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM hermanos ORDER BY numero_hermano ASC"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error al obtener hermanos:", err);
        res.status(500).json({ error: "Error al obtener hermanos" });
    }
};

// Obtener hermano por ID
const getHermanoById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM hermanos WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Hermano no encontrado" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error en getHermanoById:", err);
        res.status(500).json({ error: "Error al obtener el hermano" });
    }
};

// Crear hermano
const createHermano = async (req, res) => {
    const {
        nombre,
        apellidos,
        dni,
        telefono,
        fecha_nacimiento,
        direccion,
        email,
        fecha_alta,
        estado,
        observaciones,
        cuota_tipo,
        metodo_pago,
        iban,
        titular_cuenta
    } = req.body;

    const fechaNacimientoFinal =
        fecha_nacimiento && String(fecha_nacimiento).trim() !== ""
            ? fecha_nacimiento
            : null;

    const fechaAltaFinal =
        fecha_alta && String(fecha_alta).trim() !== ""
            ? fecha_alta
            : null;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [ultimo] = await connection.query(
            "SELECT MAX(numero_hermano) AS ultimo_numero FROM hermanos"
        );

        const siguienteNumero = (ultimo[0].ultimo_numero || 0) + 1;

        const [result] = await connection.query(
            `INSERT INTO hermanos 
            (
                numero_hermano,
                nombre,
                apellidos,
                dni,
                telefono,
                fecha_nacimiento,
                direccion,
                email,
                fecha_alta,
                estado,
                observaciones,
                cuota_tipo,
                metodo_pago,
                iban,
                titular_cuenta
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                siguienteNumero,
                nombre,
                apellidos,
                dni || null,
                telefono || null,
                fechaNacimientoFinal,
                direccion || null,
                email || null,
                fechaAltaFinal,
                estado || "Activo",
                observaciones || null,
                cuota_tipo || null,
                metodo_pago || "Efectivo",
                iban || null,
                titular_cuenta || null
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Hermano creado correctamente",
            id: result.insertId,
            numero_hermano: siguienteNumero
        });
    } catch (err) {
        await connection.rollback();
        console.error("Error al crear hermano:", err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

// Editar hermano
const updateHermano = async (req, res) => {
    const { id } = req.params;
    const {
        nombre,
        apellidos,
        dni,
        telefono,
        fecha_nacimiento,
        direccion,
        email,
        fecha_alta,
        estado,
        observaciones,
        cuota_tipo,
        metodo_pago,
        iban,
        titular_cuenta
    } = req.body;

    const fechaNacimientoFinal =
        fecha_nacimiento && String(fecha_nacimiento).trim() !== ""
            ? fecha_nacimiento
            : null;

    const fechaAltaFinal =
        fecha_alta && String(fecha_alta).trim() !== ""
            ? fecha_alta
            : null;

    try {
        const [result] = await db.query(
            `UPDATE hermanos SET 
                nombre = ?,
                apellidos = ?,
                dni = ?,
                telefono = ?,
                fecha_nacimiento = ?,
                direccion = ?,
                email = ?,
                fecha_alta = ?,
                estado = ?,
                observaciones = ?,
                cuota_tipo = ?,
                metodo_pago = ?,
                iban = ?,
                titular_cuenta = ?
            WHERE id = ?`,
            [
                nombre,
                apellidos,
                dni || null,
                telefono || null,
                fechaNacimientoFinal,
                direccion || null,
                email || null,
                fechaAltaFinal,
                estado || "Activo",
                observaciones || null,
                cuota_tipo || null,
                metodo_pago || "Efectivo",
                iban || null,
                titular_cuenta || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Hermano no encontrado" });
        }

        res.json({ message: "Hermano actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar hermano:", err);
        res.status(500).json({ error: err.message });
    }
};

// Eliminar hermano y renumerar
const deleteHermano = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            "SELECT id, numero_hermano FROM hermanos WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Hermano no encontrado" });
        }

        const numeroEliminado = rows[0].numero_hermano;

        const [result] = await connection.query(
            "DELETE FROM hermanos WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Hermano no encontrado" });
        }

        await connection.query(
            `UPDATE hermanos
             SET numero_hermano = numero_hermano - 1
             WHERE numero_hermano > ?`,
            [numeroEliminado]
        );

        await connection.commit();

        res.json({
            message: "Hermano eliminado correctamente y numeración actualizada"
        });
    } catch (err) {
        await connection.rollback();
        console.error("Error al eliminar hermano:", err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

module.exports = {
    getHermanos,
    getHermanoById,
    createHermano,
    updateHermano,
    deleteHermano
};