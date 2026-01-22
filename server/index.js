const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const roomHandlers = require("./handlers/roomhandlers");
const gameHandlers = require("./handlers/gamehandlers");

const app = express();
app.use(cors());

// Detectar si estamos en Docker o local
const clientPath = fs.existsSync(path.join(__dirname, '../client/dist'))
    ? path.join(__dirname, '../client/dist')  // Local
    : path.join('/app/client/dist');           // Docker

console.log('Buscando cliente en:', clientPath);

if (fs.existsSync(clientPath)) {
    console.log('✅ Sirviendo archivos estáticos del cliente');
    app.use(express.static(clientPath));
    
    // Ruta catch-all para SPA
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
} else {
    console.log('⚠️  Modo API: No se encontró el cliente compilado');
    app.get('/', (req, res) => {
        res.json({ 
            status: 'ok', 
            message: 'Servidor de Socket.IO funcionando',
            timestamp: new Date().toISOString()
        });
    });
}

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Cambiar por dominio real en producción
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);
    roomHandlers(io, socket);
    gameHandlers(io, socket);
    
    socket.on("disconnect", () => {
        console.log(`Usuario desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
