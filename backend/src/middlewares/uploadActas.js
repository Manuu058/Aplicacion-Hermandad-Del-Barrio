const multer = require("multer");
const path = require("path");
const fs = require("fs");

const carpetaDestino = path.join(__dirname, "../uploads/actas");

if (!fs.existsSync(carpetaDestino)) {
    fs.mkdirSync(carpetaDestino, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carpetaDestino);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const nombreBase = path
            .basename(file.originalname, ext)
            .replace(/\s+/g, "_")
            .replace(/[^\w\-]/g, "");

        const nombreFinal = `${Date.now()}-${nombreBase}${ext}`;
        cb(null, nombreFinal);
    }
});

const fileFilter = (req, file, cb) => {
    const esPdfMime = file.mimetype === "application/pdf";
    const esPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";

    if (esPdfMime && esPdfExt) {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten archivos PDF"), false);
    }
};

const uploadActas = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

module.exports = uploadActas;