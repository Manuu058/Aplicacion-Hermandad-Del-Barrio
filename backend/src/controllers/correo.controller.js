const db = require("../config/db");
const { enviarCorreoGmail } = require("../services/gmailSender.service");
const { listarMensajesDetallados, leerMensaje } = require("../services/gmailReader.service");

const getCorreos = async (req, res) => {
    const { titulo, asunto, destinatario, fecha, estado, etiqueta } = req.query;

    try {
        let query = `
            SELECT
                c.id,
                c.titulo,
                c.destinatario,
                c.asunto,
                c.mensaje,
                c.estado,
                c.gmail_message_id,
                c.gmail_thread_id,
                DATE_FORMAT(c.fecha_envio, '%Y-%m-%d %H:%i') AS fecha_envio,
                COALESCE(
                    JSON_ARRAYAGG(
                        CASE 
                            WHEN e.id IS NOT NULL THEN JSON_OBJECT(
                                'id', e.id,
                                'nombre', e.nombre
                            )
                            ELSE NULL
                        END
                    ),
                    JSON_ARRAY()
                ) AS etiquetas
            FROM correos c
            LEFT JOIN correo_etiqueta_rel cer ON cer.correo_id = c.id
            LEFT JOIN correo_etiquetas e ON e.id = cer.etiqueta_id
            WHERE 1=1
        `;

        const params = [];

        if (titulo) {
            query += ` AND c.titulo LIKE ?`;
            params.push(`%${titulo}%`);
        }

        if (asunto) {
            query += ` AND c.asunto LIKE ?`;
            params.push(`%${asunto}%`);
        }

        if (destinatario) {
            query += ` AND c.destinatario LIKE ?`;
            params.push(`%${destinatario}%`);
        }

        if (fecha) {
            query += ` AND DATE(c.fecha_envio) = ?`;
            params.push(fecha);
        }

        if (estado) {
            query += ` AND c.estado = ?`;
            params.push(estado);
        }

        if (etiqueta) {
            query += ` AND EXISTS (
                SELECT 1
                FROM correo_etiqueta_rel cer2
                JOIN correo_etiquetas e2 ON e2.id = cer2.etiqueta_id
                WHERE cer2.correo_id = c.id
                  AND e2.nombre LIKE ?
            )`;
            params.push(`%${etiqueta}%`);
        }

        query += ` GROUP BY c.id ORDER BY c.creado_en DESC`;

        const [rows] = await db.query(query, params);

        const correos = rows.map(correo => ({
            ...correo,
            etiquetas: typeof correo.etiquetas === "string"
                ? JSON.parse(correo.etiquetas).filter(Boolean)
                : (correo.etiquetas || [])
        }));

        res.json(correos);
    } catch (err) {
        console.error("Error en getCorreos:", err);
        res.status(500).json({ error: "Error al obtener correos" });
    }
};

const getCorreoById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `
            SELECT
                c.id,
                c.titulo,
                c.destinatario,
                c.asunto,
                c.mensaje,
                c.estado,
                c.gmail_message_id,
                c.gmail_thread_id,
                DATE_FORMAT(c.fecha_envio, '%Y-%m-%d %H:%i') AS fecha_envio,
                COALESCE(
                    JSON_ARRAYAGG(
                        CASE 
                            WHEN e.id IS NOT NULL THEN JSON_OBJECT(
                                'id', e.id,
                                'nombre', e.nombre
                            )
                            ELSE NULL
                        END
                    ),
                    JSON_ARRAY()
                ) AS etiquetas
            FROM correos c
            LEFT JOIN correo_etiqueta_rel cer ON cer.correo_id = c.id
            LEFT JOIN correo_etiquetas e ON e.id = cer.etiqueta_id
            WHERE c.id = ?
            GROUP BY c.id
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Correo no encontrado" });
        }

        const correo = {
            ...rows[0],
            etiquetas: typeof rows[0].etiquetas === "string"
                ? JSON.parse(rows[0].etiquetas).filter(Boolean)
                : (rows[0].etiquetas || [])
        };

        res.json(correo);
    } catch (err) {
        console.error("Error en getCorreoById:", err);
        res.status(500).json({ error: "Error al obtener correo" });
    }
};

const createCorreo = async (req, res) => {
    const { titulo, destinatario, asunto, mensaje, etiquetas = [] } = req.body;

    if (!titulo || !asunto || !mensaje) {
        return res.status(400).json({
            error: "titulo, asunto y mensaje son obligatorios"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const envio = await enviarCorreoGmail({
            para: destinatario,
            asunto,
            texto: mensaje
        });

        const [insertCorreo] = await connection.query(
            `
            INSERT INTO correos
            (
                titulo,
                destinatario,
                asunto,
                mensaje,
                estado,
                gmail_message_id,
                fecha_envio
            )
            VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)
            `,
            [
                titulo,
                destinatario || null,
                asunto,
                mensaje,
                "enviado",
                envio.messageId || null
            ]
        );

        const correoId = insertCorreo.insertId;

        for (const nombreEtiqueta of etiquetas) {
            const nombre = nombreEtiqueta.trim();

            const [existe] = await connection.query(
                `SELECT id FROM correo_etiquetas WHERE nombre = ?`,
                [nombre]
            );

            let etiquetaId;

            if (existe.length > 0) {
                etiquetaId = existe[0].id;
            } else {
                const [nuevaEtiqueta] = await connection.query(
                    `INSERT INTO correo_etiquetas (nombre) VALUES (?)`,
                    [nombre]
                );
                etiquetaId = nuevaEtiqueta.insertId;
            }

            await connection.query(
                `
                INSERT IGNORE INTO correo_etiqueta_rel (correo_id, etiqueta_id)
                VALUES (?, ?)
                `,
                [correoId, etiquetaId]
            );
        }

        await connection.commit();

        const [rows] = await db.query(`SELECT * FROM correos WHERE id = ?`, [correoId]);

        res.status(201).json({
            message: "Correo enviado y guardado correctamente",
            correo: rows[0]
        });
    } catch (err) {
        await connection.rollback();
        console.error("Error en createCorreo:", err);
        res.status(500).json({ error: "Error al crear o enviar correo" });
    } finally {
        connection.release();
    }
};

const deleteCorreo = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT * FROM correos WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Correo no encontrado" });
        }

        await db.query(`DELETE FROM correos WHERE id = ?`, [id]);

        res.json({
            message: "Correo eliminado correctamente",
            correo: rows[0]
        });
    } catch (err) {
        console.error("Error en deleteCorreo:", err);
        res.status(500).json({ error: "Error al eliminar correo" });
    }
};

const getGmailInbox = async (req, res) => {
    const { q, maxResults, labelIds } = req.query;

    try {
        const mensajes = await listarMensajesDetallados({
            q: q || "",
            maxResults: Number(maxResults) || 10,
            labelIds: labelIds ? labelIds.split(",") : []
        });

        res.json(mensajes);
    } catch (err) {
        console.error("Error en getGmailInbox:", err);
        res.status(500).json({ error: "Error al leer Gmail" });
    }
};

const getGmailMessageById = async (req, res) => {
    const { messageId } = req.params;

    try {
        const mensaje = await leerMensaje(messageId);
        res.json(mensaje);
    } catch (err) {
        console.error("Error en getGmailMessageById:", err);
        res.status(500).json({ error: "Error al leer mensaje de Gmail" });
    }
};

module.exports = {
    getCorreos,
    getCorreoById,
    createCorreo,
    deleteCorreo,
    getGmailInbox,
    getGmailMessageById
};