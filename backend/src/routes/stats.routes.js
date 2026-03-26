const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/dashboard", async (req, res) => {
    try {
        const [
            [resHermanos],
            [resTunicas],
            [resCajasLibres],
            [resCajasOcupadas],
            [resPagos],
            [resEventos]
        ] = await Promise.all([
            db.query("SELECT COUNT(*) AS total FROM hermanos"),
            db.query("SELECT COUNT(*) AS total FROM tunicas WHERE estado = 'Prestada'"),
            db.query("SELECT COUNT(*) AS total FROM cajas WHERE estado = 'Disponible'"),
            db.query("SELECT COUNT(*) AS total FROM cajas WHERE estado = 'Ocupada'"),
            db.query("SELECT COUNT(*) AS total FROM pagos WHERE estado = 'Pendiente'"),
            db.query(`
                SELECT COUNT(*) AS total
                FROM agenda_hermandad
                WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
            `)
        ]);

        res.json({
            totalHermanos: Number(resHermanos[0]?.total || 0),
            tunicasPrestadas: Number(resTunicas[0]?.total || 0),
            cajasDisponibles: Number(resCajasLibres[0]?.total || 0),
            cajasOcupadas: Number(resCajasOcupadas[0]?.total || 0),
            pagosPendientes: Number(resPagos[0]?.total || 0),
            eventosSemana: Number(resEventos[0]?.total || 0)
        });
    } catch (error) {
        console.error("Error en Dashboard Stats:", error);

        res.json({
            totalHermanos: 0,
            tunicasPrestadas: 0,
            cajasDisponibles: 0,
            cajasOcupadas: 0,
            pagosPendientes: 0,
            eventosSemana: 0,
            error: "Algunas tablas no existen todavía"
        });
    }
});

module.exports = router;