const db = require('../config/db');

// Obtener lista de Semana Santa por año
const getSemanaSantaByAnio = async (req, res) => {
    const { anio } = req.params;

    if (!anio) {
        return res.status(400).json({
            error: "El parámetro anio es obligatorio"
        });
    }

    try {
        const query = `
            SELECT 
                p.*,
                h.nombre AS hermano_nombre,
                h.apellidos AS hermano_apellidos,
                h.numero_hermano,
                c.numero_caja,
                t.estado AS estado_tunica,
                t.descripcion AS descripcion_caja,
                CASE
                    WHEN p.hermano_id IS NOT NULL THEN h.nombre
                    ELSE p.nombre_manual
                END AS nombre,
                CASE
                    WHEN p.hermano_id IS NOT NULL THEN h.apellidos
                    ELSE p.apellidos_manual
                END AS apellidos
            FROM planificacion_semana_santa p
            LEFT JOIN hermanos h ON p.hermano_id = h.id
            LEFT JOIN cajas c ON p.caja_id = c.id
            LEFT JOIN tunicas t ON p.caja_id = t.caja_id
            WHERE p.anio = $1
            ORDER BY p.papeleta_numero ASC
        `;

        const result = await db.query(query, [anio]);
        res.json(result.rows || []);
    } catch (err) {
        console.error("Error en getSemanaSantaByAnio:", err);
        res.status(500).json({ error: "Error al obtener la planificación" });
    }
};

// Crear papeleta
const createSemanaSanta = async (req, res) => {
    const {
        hermano_id,
        anio,
        puesto,
        metodo_pago,
        pagado,
        importe,
        nombre_manual,
        apellidos_manual,
        dni_manual,
        caja_id,
        accion_caja
    } = req.body;

    const esHermano = !!hermano_id;
    const puestosConCaja = ["Nazareno", "Acólito", "Monaguillo"];

    if (!anio || !puesto) {
        return res.status(400).json({
            error: "Los campos anio y puesto son obligatorios"
        });
    }

    if (!esHermano && (!nombre_manual || !apellidos_manual)) {
        return res.status(400).json({
            error: "Si no es hermano, nombre_manual y apellidos_manual son obligatorios"
        });
    }

    if (
        caja_id &&
        !puestosConCaja.includes(puesto)
    ) {
        return res.status(400).json({
            error: "Las cajas solo se usan en Nazarenos, Acólitos o Monaguillos"
        });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const numeroResult = await client.query(
            `
            SELECT COALESCE(MAX(papeleta_numero), 0) + 1 AS siguiente
            FROM planificacion_semana_santa
            WHERE anio = $1
            `,
            [anio]
        );

        const siguienteNumero = numeroResult.rows[0].siguiente;

        if (caja_id) {
            const cajaAsignada = await client.query(
                `
                SELECT
                    t.id,
                    t.caja_id,
                    t.estado,
                    c.numero_caja
                FROM tunicas t
                JOIN cajas c ON c.id = t.caja_id
                WHERE t.caja_id = $1
                LIMIT 1
                `,
                [caja_id]
            );

            if (cajaAsignada.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    error: "La caja indicada no está asignada en Túnicas"
                });
            }

            const nuevoEstadoCaja =
                accion_caja === "Se queda en Casa Hermandad"
                    ? "En Casa Hermandad"
                    : "Prestada";

            await client.query(
                `
                UPDATE tunicas
                SET estado = $1
                WHERE caja_id = $2
                `,
                [nuevoEstadoCaja, caja_id]
            );

            await client.query(
                `
                UPDATE cajas
                SET estado = $1
                WHERE id = $2
                `,
                [nuevoEstadoCaja, caja_id]
            );
        }

        const result = await client.query(
            `
            INSERT INTO planificacion_semana_santa
            (
                hermano_id,
                anio,
                puesto,
                metodo_pago,
                pagado,
                importe,
                nombre_manual,
                apellidos_manual,
                dni_manual,
                papeleta_numero,
                caja_id,
                accion_caja
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *
            `,
            [
                hermano_id || null,
                anio,
                puesto,
                metodo_pago || 'Efectivo',
                !!pagado,
                importe || 0,
                nombre_manual || null,
                apellidos_manual || null,
                dni_manual || null,
                siguienteNumero,
                caja_id || null,
                accion_caja || null
            ]
        );

        if (hermano_id && pagado) {
            const pagoExistente = await client.query(
                `
                SELECT *
                FROM pagos
                WHERE hermano_id = $1
                  AND anio = $2
                LIMIT 1
                `,
                [hermano_id, anio]
            );

            if (pagoExistente.rows.length === 0) {
                await client.query(
                    `
                    INSERT INTO pagos (hermano_id, concepto, importe, fecha, estado, anio)
                    VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)
                    `,
                    [hermano_id, 'Papeleta Semana Santa', importe || 0, 'Pagado', anio]
                );
            } else {
                await client.query(
                    `
                    UPDATE pagos
                    SET estado = 'Pagado',
                        fecha = CURRENT_DATE,
                        concepto = COALESCE(concepto, 'Papeleta Semana Santa'),
                        importe = COALESCE(importe, $1)
                    WHERE id = $2
                    `,
                    [importe || 0, pagoExistente.rows[0].id]
                );
            }
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Inscripción realizada con éxito",
            registro: result.rows[0]
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error en createSemanaSanta:", err);

        if (err.code === '23505') {
            return res.status(400).json({
                error: "Ya existe una inscripción duplicada para ese año"
            });
        }

        res.status(500).json({ error: "Error al procesar la inscripción" });
    } finally {
        client.release();
    }
};

// Eliminar
const deleteSemanaSanta = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            error: "El parámetro id es obligatorio"
        });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const registroResult = await client.query(
            `
            SELECT id, anio, papeleta_numero
            FROM planificacion_semana_santa
            WHERE id = $1
            LIMIT 1
            `,
            [id]
        );

        if (registroResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        const registro = registroResult.rows[0];

        await client.query(
            `DELETE FROM planificacion_semana_santa WHERE id = $1`,
            [id]
        );

        await client.query(
            `
            UPDATE planificacion_semana_santa
            SET papeleta_numero = papeleta_numero - 1
            WHERE anio = $1
              AND papeleta_numero > $2
            `,
            [registro.anio, registro.papeleta_numero]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Registro eliminado y papeletas reordenadas"
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error en deleteSemanaSanta:", err);
        res.status(500).json({ error: "Error al eliminar el registro" });
    } finally {
        client.release();
    }
};

const togglePagoSemanaSanta = async (req, res) => {
    const { id } = req.params;
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const actual = await client.query(
            `
            SELECT *
            FROM planificacion_semana_santa
            WHERE id = $1
            LIMIT 1
            `,
            [id]
        );

        if (actual.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        const registro = actual.rows[0];
        const nuevoPagado = !registro.pagado;

        const updated = await client.query(
            `
            UPDATE planificacion_semana_santa
            SET pagado = $1
            WHERE id = $2
            RETURNING *
            `,
            [nuevoPagado, id]
        );

        if (registro.hermano_id) {
            const pagoExistente = await client.query(
                `
                SELECT *
                FROM pagos
                WHERE hermano_id = $1
                  AND anio = $2
                LIMIT 1
                `,
                [registro.hermano_id, registro.anio]
            );

            if (pagoExistente.rows.length === 0 && nuevoPagado) {
                await client.query(
                    `
                    INSERT INTO pagos (hermano_id, concepto, importe, fecha, estado, anio)
                    VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)
                    `,
                    [
                        registro.hermano_id,
                        'Papeleta Semana Santa',
                        registro.importe || 0,
                        'Pagado',
                        registro.anio
                    ]
                );
            } else if (pagoExistente.rows.length > 0) {
                await client.query(
                    `
                    UPDATE pagos
                    SET estado = $1,
                        fecha = CURRENT_DATE,
                        concepto = COALESCE(concepto, 'Papeleta Semana Santa'),
                        importe = COALESCE(importe, $2)
                    WHERE id = $3
                    `,
                    [
                        nuevoPagado ? 'Pagado' : 'Pendiente',
                        registro.importe || 0,
                        pagoExistente.rows[0].id
                    ]
                );
            }
        }

        await client.query("COMMIT");

        res.json({
            message: "Pago actualizado",
            registro: updated.rows[0]
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error en togglePagoSemanaSanta:", err);
        res.status(500).json({ error: "Error al actualizar pago" });
    } finally {
        client.release();
    }
};

module.exports = {
    getSemanaSantaByAnio,
    createSemanaSanta,
    deleteSemanaSanta,
    togglePagoSemanaSanta
};