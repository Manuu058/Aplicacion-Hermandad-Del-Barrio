const app = require('./src/app')

const PORT = 3001

app.listen(PORT, () => {
  console.log("Servidor funcionando en puerto " + PORT)
})

const cors = require('cors');
app.use(cors()); // Esto debe estar antes de las rutas