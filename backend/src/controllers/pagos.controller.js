const db = require("../config/db");

// Obtener estado de pagos por año para la gestión anual
const getEstadoPagosByAnio = async (req, res) => {
    const { anio } = req.params;

    try {
        const [rows] = await db.query(
            `
            SELECT 
                h.id,
                h.numero_hermano,
                h.nombre,
                h.apellidos,
                h.dni,
                h.metodo_pago,
                CASE 
                    WHEN h.metodo_pago = 'Domiciliado' THEN 1
                    WHEN p.id IS NOT NULL AND p.estado = 'Pagado' THEN 1
                    ELSE 0
                END AS pagado
            FROM hermanos h
            LEFT JOIN pagos p
                ON p.hermano_id = h.id
               AND p.anio = ?
            ORDER BY h.numero_hermano ASC
            `,
            [anio]
        );

        res.json(Array.isArray(rows) ? rows : []);
    } catch (err) {
        console.error("Error REAL en getEstadoPagosByAnio:", err);
        res.status(500).json({
            error: "Error al obtener estado de pagos",
            detalle: err.message
        });
    }
};

// Alternar pago anual
const togglePago = async (req, res) => {
    const { hermano_id, anio } = req.body;

    if (!hermano_id || !anio) {
        return res.status(400).json({
            error: "hermano_id y anio son obligatorios"
        });
    }

    try {
        const [hermanoRows] = await db.query(
            `
            SELECT id, metodo_pago
            FROM hermanos
            WHERE id = ?
            LIMIT 1
            `,
            [hermano_id]
        );

        if (hermanoRows.length === 0) {
            return res.status(404).json({
                error: "Hermano no encontrado"
            });
        }

        const hermano = hermanoRows[0];

        // Si es domiciliado, siempre debe constar como pagado
        if (hermano.metodo_pago === "Domiciliado") {
            const [pagoExistenteDomiciliado] = await db.query(
                `
                SELECT *
                FROM pagos
                WHERE hermano_id = ?
                  AND anio = ?
                LIMIT 1
                `,
                [hermano_id, anio]
            );

            if (pagoExistenteDomiciliado.length === 0) {
                const [nuevoPago] = await db.query(
                    `
                    INSERT INTO pagos (hermano_id, concepto, importe, fecha, estado, anio, fecha_pago)
                    VALUES (?, ?, ?, CURRENT_DATE, ?, ?, NOW())
                    `,
                    [hermano_id, "Cuota Anual", 0, "Pagado", anio]
                );

                const [rowsNuevoPago] = await db.query(
                    `SELECT * FROM pagos WHERE id = ?`,
                    [nuevoPago.insertId]
                );

                return res.status(200).json({
                    message: "Pago domiciliado registrado automáticamente",
                    pago: rowsNuevoPago[0],
                    pagado: true
                });
            }

            const pago = pagoExistenteDomiciliado[0];

            await db.query(
                `
                UPDATE pagos
                SET estado = 'Pagado',
                    fecha = CURRENT_DATE,
                    fecha_pago = NOW(),
                    concepto = COALESCE(concepto, 'Cuota Anual'),
                    importe = COALESCE(importe, 0)
                WHERE id = ?
                `,
                [pago.id]
            );

            const [actualizado] = await db.query(
                `SELECT * FROM pagos WHERE id = ?`,
                [pago.id]
            );

            return res.status(200).json({
                message: "El hermano está domiciliado y figura como pagado",
                pago: actualizado[0],
                pagado: true
            });
        }

        const [pagoExistente] = await db.query(
            `
            SELECT *
            FROM pagos
            WHERE hermano_id = ?
              AND anio = ?
            LIMIT 1
            `,
            [hermano_id, anio]
        );

        if (pagoExistente.length === 0) {
            const [nuevoPago] = await db.query(
                `
                INSERT INTO pagos (hermano_id, concepto, importe, fecha, estado, anio, fecha_pago)
                VALUES (?, ?, ?, CURRENT_DATE, ?, ?, NOW())
                `,
                [hermano_id, "Cuota Anual", 0, "Pagado", anio]
            );

            const [rowsNuevoPago] = await db.query(
                `SELECT * FROM pagos WHERE id = ?`,
                [nuevoPago.insertId]
            );

            return res.status(200).json({
                message: "Pago registrado correctamente",
                pago: rowsNuevoPago[0],
                pagado: true
            });
        }

        const pago = pagoExistente[0];
        const nuevoEstado = pago.estado === "Pagado" ? "Pendiente" : "Pagado";

        await db.query(
            `
            UPDATE pagos
            SET estado = ?,
                fecha = CURRENT_DATE,
                fecha_pago = CASE WHEN ? = 'Pagado' THEN NOW() ELSE NULL END,
                concepto = COALESCE(concepto, 'Cuota Anual'),
                importe = COALESCE(importe, 0)
            WHERE id = ?
            `,
            [nuevoEstado, nuevoEstado, pago.id]
        );

        const [actualizado] = await db.query(
            `SELECT * FROM pagos WHERE id = ?`,
            [pago.id]
        );

        return res.status(200).json({
            message: "Estado del pago actualizado",
            pago: actualizado[0],
            pagado: nuevoEstado === "Pagado"
        });
    } catch (err) {
        console.error("Error REAL en togglePago:", err);
        return res.status(500).json({
            error: "Error al cambiar estado del pago",
            detalle: err.message
        });
    }
};

// Obtener todos los pagos de un año
const getPagosByAnio = async (req, res) => {
    const { anio } = req.params;

    if (!anio) {
        return res.status(400).json({
            error: "El parámetro anio es obligatorio"
        });
    }

    try {
        const [rows] = await db.query(
            `
            SELECT 
                p.id,
                p.hermano_id,
                h.nombre,
                h.apellidos,
                h.numero_hermano,
                h.metodo_pago,
                p.importe,
                DATE_FORMAT(p.fecha, '%Y-%m-%d') as fecha,
                p.estado,
                p.anio,
                p.fecha_pago,
                p.concepto
            FROM pagos p
            JOIN hermanos h ON p.hermano_id = h.id
            WHERE p.anio = ?
            ORDER BY p.fecha DESC
            `,
            [anio]
        );

        res.json(rows || []);
    } catch (err) {
        console.error("Error en getPagosByAnio:", err);
        res.status(500).json({ error: "Error al obtener pagos", detalle: err.message });
    }
};

// Obtener pagos de un hermano
const getPagosByHermano = async (req, res) => {
    const { hermano_id } = req.params;

    if (!hermano_id) {
        return res.status(400).json({
            error: "El parámetro hermano_id es obligatorio"
        });
    }

    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM pagos
            WHERE hermano_id = ?
            ORDER BY anio DESC, fecha DESC
            `,
            [hermano_id]
        );

        res.json(rows || []);
    } catch (err) {
        console.error("Error en getPagosByHermano:", err);
        res.status(500).json({ error: "Error al obtener pagos del hermano", detalle: err.message });
    }
};

// Crear nuevo pago
const createPago = async (req, res) => {
    const { hermano_id, importe, fecha, estado, anio, concepto } = req.body;

    if (!hermano_id || importe === undefined || importe === null || !anio) {
        return res.status(400).json({
            error: "hermano_id, importe y anio son obligatorios"
        });
    }

    try {
        const [hermanoRows] = await db.query(
            `
            SELECT id, metodo_pago
            FROM hermanos
            WHERE id = ?
            LIMIT 1
            `,
            [hermano_id]
        );

        if (hermanoRows.length === 0) {
            return res.status(404).json({
                error: "Hermano no encontrado"
            });
        }

        const hermano = hermanoRows[0];
        const estadoFinal =
            hermano.metodo_pago === "Domiciliado" ? "Pagado" : (estado || "Pendiente");

        const [result] = await db.query(
            `
            INSERT INTO pagos (hermano_id, importe, fecha, estado, anio, concepto, fecha_pago)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                hermano_id,
                importe,
                fecha || new Date(),
                estadoFinal,
                anio,
                concepto || "Cuota Anual",
                estadoFinal === "Pagado" ? new Date() : null
            ]
        );

        const [rows] = await db.query(
            `SELECT * FROM pagos WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: "Pago registrado correctamente",
            pago: rows[0]
        });
    } catch (err) {
        console.error("Error en createPago:", err);
        res.status(500).json({ error: "Error al registrar el pago", detalle: err.message });
    }
};

// Actualizar estado de pago
const updateEstadoPago = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({
            error: "El campo estado es obligatorio"
        });
    }

    try {
        const [pagoRows] = await db.query(
            `
            SELECT p.*, h.metodo_pago
            FROM pagos p
            JOIN hermanos h ON h.id = p.hermano_id
            WHERE p.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (pagoRows.length === 0) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        const pago = pagoRows[0];
        const estadoFinal =
            pago.metodo_pago === "Domiciliado" ? "Pagado" : estado;

        const [result] = await db.query(
            `
            UPDATE pagos
            SET estado = ?,
                fecha_pago = CASE WHEN ? = 'Pagado' THEN NOW() ELSE NULL END
            WHERE id = ?
            `,
            [estadoFinal, estadoFinal, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        const [rows] = await db.query(
            `SELECT * FROM pagos WHERE id = ?`,
            [id]
        );

        res.json({
            message: "Estado del pago actualizado",
            pago: rows[0]
        });
    } catch (err) {
        console.error("Error en updateEstadoPago:", err);
        res.status(500).json({ error: "Error al actualizar pago", detalle: err.message });
    }
};

// Eliminar pago
const deletePago = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT * FROM pagos WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Pago no encontrado"
            });
        }

        await db.query(
            "DELETE FROM pagos WHERE id = ?",
            [id]
        );

        res.json({
            message: "Pago eliminado",
            pago: rows[0]
        });
    } catch (err) {
        console.error("Error en deletePago:", err);
        res.status(500).json({ error: "Error al eliminar el pago", detalle: err.message });
    }
};

module.exports = {
    getEstadoPagosByAnio,
    togglePago,
    getPagosByAnio,
    getPagosByHermano,
    createPago,
    updateEstadoPago,
    deletePago
};