const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path'); // <--- 1. Importante añadir esto
const roomHandlers = require("./handlers/roomhandlers");
const gameHandlers = require("./handlers/gamehandlers");

const app = express();
app.use(cors());

// --- NUEVA LÓGICA PARA SERVIR EL FRONTEND ---

// 2. Sirve los archivos estáticos de la carpeta 'dist' de React
// Esta ruta asume que 'server' y 'client' están al mismo nivel en la raíz del proyecto
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);
  roomHandlers(io, socket);
  gameHandlers(io, socket);
});

// 3. Maneja cualquier otra ruta devolviendo el index.html
// Esto permite que si alguien refresca la página en /mesa, React tome el control
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

io.on("disconnect", (socket) => {
  console.log(`Usuario desconectado: ${socket.id}`);
});

server.listen(3000, () => {
  console.log("Servidor escuchando en el puerto 3000");
});