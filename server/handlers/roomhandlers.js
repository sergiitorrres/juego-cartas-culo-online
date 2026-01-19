// Funciones para crear, unir y salir de salas

const { rooms } = require("../store");
const Sala = require("../game/sala")

module.exports = (io, socket) => {
    
    socket.on("unirse_sala", (data, callback) => {
        const { nombre, salaId, config } = data;

        if (!rooms[salaId]) {
            rooms[salaId] = new Sala(salaId, config)
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

        socket.data.salaId = salaId;

        // Avisa a todos incluyendome a mi
        io.to(salaId).emit("jugador_unido", {jugadores: partida.jugadores})

        console.log(`${nombre} se unió a ${salaId}`);
    });
    

    socket.on("disconnect", () => {

        const salaId = socket.data.salaId

        if (!salaId || !rooms[salaId]) return;

        const partida = rooms[salaId];

        partida.jugadores = partida.jugadores.filter(jugador => jugador.id !== socket.id);

        if (rooms[salaId].jugadores.length <=0){
            delete rooms[salaId]
            console.log(`Sala ${salaId} eliminada (esta vacia)`)
        }else{
            io.to(salaId).emit("jugador_unido", { jugadores: partida.jugadores });
            console.log(`Un usuario salió de ${salaId}. Quedan: ${partida.jugadores.length}`);
        }
    });
}