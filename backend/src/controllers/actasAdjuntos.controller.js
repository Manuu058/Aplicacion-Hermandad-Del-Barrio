const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const subirAdjuntosActa = async (req, res) => {
    const { id } = req.params;
    const { subido_por } = req.body;

    try {
        const [actaExiste] = await db.query(
            "SELECT id FROM actas_junta WHERE id = ?",
            [id]
        );

        if (actaExiste.length === 0) {
            return res.status(404).json({ error: "Acta no encontrada" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No se han subido archivos PDF" });
        }

        const insertados = [];

        for (const file of req.files) {
            const [result] = await db.query(
                `
                INSERT INTO actas_adjuntos
                (
                    acta_id,
                    nombre_original,
                    nombre_archivo,
                    ruta_archivo,
                    tipo_mime,
                    tamano_bytes,
                    subido_por
                )
                VALUES (?,?,?,?,?,?,?)
                `,
                [
                    id,
                    file.originalname,
                    file.filename,
                    file.path,
                    file.mimetype,
                    file.size,
                    subido_por || null
                ]
            );

            const [rows] = await db.query(
                `SELECT * FROM actas_adjuntos WHERE id = ?`,
                [result.insertId]
            );

            insertados.push(rows[0]);
        }

        res.status(201).json({
            message: "PDFs subidos correctamente",
            archivos: insertados
        });
    } catch (err) {
        console.error("Error al subir PDFs:", err);
        res.status(500).json({ error: "Error al subir PDFs" });
    }
};

const listarAdjuntosActa = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                acta_id,
                nombre_original,
                nombre_archivo,
                tipo_mime,
                tamano_bytes,
                es_oficial,
                subido_por,
                fecha_subida
            FROM actas_adjuntos
            WHERE acta_id = ?
            ORDER BY es_oficial DESC, fecha_subida DESC
            `,
            [id]
        );

        res.json(rows || []);
    } catch (err) {
        console.error("Error listando adjuntos:", err);
        res.status(500).json({ error: "Error al listar adjuntos" });
    }
};

const verAdjuntoPdf = async (req, res) => {
    const { adjuntoId } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM actas_adjuntos WHERE id = ?",
            [adjuntoId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "PDF no encontrado" });
        }

        const archivo = rows[0];

        if (!fs.existsSync(archivo.ruta_archivo)) {
            return res.status(404).json({ error: "Archivo no existe en disco" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${archivo.nombre_original}"`);
        res.sendFile(path.resolve(archivo.ruta_archivo));
    } catch (err) {
        console.error("Error al visualizar PDF:", err);
        res.status(500).json({ error: "Error al visualizar PDF" });
    }
};

const descargarAdjuntoPdf = async (req, res) => {
    const { adjuntoId } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM actas_adjuntos WHERE id = ?",
            [adjuntoId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "PDF no encontrado" });
        }

        const archivo = rows[0];

        if (!fs.existsSync(archivo.ruta_archivo)) {
            return res.status(404).json({ error: "Archivo no existe en disco" });
        }

        res.download(path.resolve(archivo.ruta_archivo), archivo.nombre_original);
    } catch (err) {
        console.error("Error al descargar PDF:", err);
        res.status(500).json({ error: "Error al descargar PDF" });
    }
};

const eliminarAdjuntoPdf = async (req, res) => {
    const { adjuntoId } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM actas_adjuntos WHERE id = ?",
            [adjuntoId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "PDF no encontrado" });
        }

        const archivo = rows[0];

        await db.query("DELETE FROM actas_adjuntos WHERE id = ?", [adjuntoId]);

        if (archivo.ruta_archivo && fs.existsSync(archivo.ruta_archivo)) {
            fs.unlinkSync(archivo.ruta_archivo);
        }

        res.json({
            message: "PDF eliminado correctamente",
            archivo
        });
    } catch (err) {
        console.error("Error al eliminar PDF:", err);
        res.status(500).json({ error: "Error al eliminar PDF" });
    }
};

const marcarPdfOficial = async (req, res) => {
    const { adjuntoId } = req.params;

    try {
        const [actual] = await db.query(
            "SELECT * FROM actas_adjuntos WHERE id = ?",
            [adjuntoId]
        );

        if (actual.length === 0) {
            return res.status(404).json({ error: "PDF no encontrado" });
        }

        const actaId = actual[0].acta_id;

        await db.query(
            "UPDATE actas_adjuntos SET es_oficial = 0 WHERE acta_id = ?",
            [actaId]
        );

        await db.query(
            "UPDATE actas_adjuntos SET es_oficial = 1 WHERE id = ?",
            [adjuntoId]
        );

        const [rows] = await db.query(
            "SELECT * FROM actas_adjuntos WHERE id = ?",
            [adjuntoId]
        );

        res.json({
            message: "PDF marcado como acta oficial aprobada",
            archivo: rows[0]
        });
    } catch (err) {
        console.error("Error marcando PDF oficial:", err);
        res.status(500).json({ error: "Error al marcar PDF oficial" });
    }
};

module.exports = {
    subirAdjuntosActa,
    listarAdjuntosActa,
    verAdjuntoPdf,
    descargarAdjuntoPdf,
    eliminarAdjuntoPdf,
    marcarPdfOficial
};