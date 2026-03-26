const db = require("../config/db");

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscamos usando el nombre de columna real: password_hash
        const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Usuario no encontrado." });
        }

        const usuario = rows[0];

        // Comparamos con la columna password_hash que vemos en tu captura
        if (usuario.password_hash !== password) {
            return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
        }

        res.json({ 
            success: true, 
            message: "¡Bienvenido!",
            user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ success: false, error: "Error en el servidor" });
    }
};

const register = async (req, res) => { /* ... tu código de registro ... */ };
const getMe = async (req, res) => { /* ... tu código de getMe ... */ };

module.exports = { login, register, getMe };