require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db"); 

// 1. Importación de Rutas
// Asegúrate de que TODOS estos archivos tengan "module.exports = router;" al final
const authRoutes = require("./routes/auth");
const hermanosRoutes = require("./routes/hermanos.routes");
const pagosRoutes = require("./routes/pagos.routes");
const tunicasRoutes = require("./routes/tunicas.routes");
const semanaSantaRoutes = require("./routes/semanasanta.routes");
const costalerosRoutes = require("./routes/costaleros.routes");
const eventosRoutes = require("./routes/eventos.routes");
const agendaRoutes = require("./routes/agenda.routes");
const actasRoutes = require("./routes/actas.routes");
const actasAdjuntosRoutes = require("./routes/actasAdjuntos.routes");
const statsRoutes = require("./routes/stats.routes");
const notificacionesRoutes = require("./routes/notificaciones.routes");
const correoRoutes = require("./routes/correo.routes");

const app = express();

// 2. Middlewares
app.use(cors());
app.use(express.json());

// 3. Registro de Rutas del Sistema
// Si el servidor falla en este bloque, es porque el archivo .js correspondiente no exporta el router.
app.use("/auth", authRoutes);
app.use("/hermanos", hermanosRoutes);
app.use("/pagos", pagosRoutes);
app.use("/tunicas", tunicasRoutes);
app.use("/semana-santa", semanaSantaRoutes);
app.use("/costaleros", costalerosRoutes);
app.use("/eventos", eventosRoutes);
app.use("/agenda", agendaRoutes);
app.use("/actas", actasRoutes);
app.use("/actas-adjuntos", actasAdjuntosRoutes);
app.use("/stats", statsRoutes); // La lógica de /dashboard ahora vive en routes/stats.routes.js
app.use("/notificaciones", notificacionesRoutes);
app.use("/correo", correoRoutes);

// 4. Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({ 
        status: "error",
        message: "La ruta solicitada no existe en el servidor de la Hermandad" 
    });
});

// 5. Gestión de errores global
app.use((err, req, res, next) => {
    console.error("❌ Error interno:", err.stack);
    res.status(500).json({ 
        status: "error",
        message: "Error interno del servidor",
        error: err.message 
    });
});

// 6. Arrancar Servidor 
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 SERVIDOR ENCENDIDO`);
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`📊 Dashboard API: http://localhost:${PORT}/stats/dashboard`);
    console.log(`=================================================\n`);
});