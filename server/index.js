const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const roomHandlers = require("./handlers/roomhandlers");
const gameHandlers = require("./handlers/gamehandlers");

// Esta cosa es para peticiones normales, no necesita estar siempre enchufado
const app = express();
app.use(cors());

const server = http.createServer(app);

// Esta cosa es la que escucha los eventos
const io = new Server(server, {
    cors: {
    origin: "*", // Cambiar por dominio real
    methods: ["GET", "POST"]
  }});

io.on("connection", (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);
    roomHandlers(io, socket);
    });

io.on("disconnect", (socket) => {
    console.log(`Usuario desconectado: ${socket.id}`);
    });

server.listen(3000, () => {
    console.log("Servidor escuchando en el puerto 3000");
});
