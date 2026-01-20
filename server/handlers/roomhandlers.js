// Funciones para crear, unir y salir de salas

const { rooms } = require("../store");
const Sala = require("../game/sala");
const { ESTADOS } = require("../game/constantes");

module.exports = (io, socket) => {
    
    socket.on("unirse_sala", (data, callback) => {
        const { nombre, salaId, config } = data;

        if (!nombre || !salaId) {
            return socket.emit("error", { mensaje: "Datos incompletos" });
        }

        if (!rooms[salaId]) {
            rooms[salaId] = new Sala(salaId, config)
            console.log(`Sala ${salaId} creada.`);
        }
        
        const partida = rooms[salaId];

        if (partida.estado !== "LOBBY") {
            return socket.emit("error", { mensaje: "La partida ya ha comenzado" });
        }

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

        if (partida.estado === "LOBBY") {
            partida.jugadores = partida.jugadores.filter(jugador => jugador.id !== socket.id);

            if (partida.jugadores.length <= 0) {
                delete rooms[salaId];
                console.log(`Sala ${salaId} eliminada (vacía)`);
            } else {
                io.to(salaId).emit("jugador_unido", { jugadores: partida.jugadores });
                console.log(`Usuario salió de ${salaId} (Lobby). Quedan: ${partida.jugadores.length}`);
            }
        } 
        
        else {
            console.log(`JUGADOR ABANDONÓ PARTIDA EN CURSO: ${salaId}`);
            
            io.to(salaId).emit("error", { mensaje: "Un jugador se ha desconectado. La partida ha terminado." });
            io.to(salaId).emit("partida_cancelada", {});
            
            delete rooms[salaId];
            
        }
    });
}