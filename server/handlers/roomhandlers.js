// Funciones para crear, unir y salir de salas

const { rooms } = require("../store");
const Sala = require("../game/Sala")

module.exports = (io, socket) => {
    
    socket.on("unirse_sala", (data, callback) => {
        const { nombre, salaId, config } = data;

        if (!rooms[salaId]) {
            rooms[salaID] = new Sala(salaId, config)
            console.log(`Sala ${salaId} creada.`);
        }
        
        const partida = rooms[salaId];

        if( partida.jugadores.length >= partida.maxJugadores){
            socket.emit("error", {mensaje : "La sala está llena"})
            return;
        }

        partida.addJugador(socket.id, nombre)

        // Subscribe el socket a un canal
        socket.join(salaId)

        // Avisa a todos incluyendome a mi
        io.to(salaId).emit("jugador_unido", {jugadores: partida.jugadores})

        console.log(`${nombre} se unió a ${salaId}`);
    });
    

    socket.on("disconnect", (data, callback) => {

    });
}