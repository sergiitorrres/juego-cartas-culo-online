// Funciones para crear, unir y salir de salas

const { rooms } = require("../store");
const Sala = require("../game/sala");
const { ESTADOS } = require("../game/constantes");

const obtenerSalasPublicas = () => {
    
    return Object.values(rooms)
    .filter((sala) => !sala.privacidad).map(sala => ({
        
        id: sala.id,
        privacidad: sala.privacidad,
        cantJugadores: sala.jugadores.length,
        maxJugadores: sala.maxJugadores,
        modo: sala.preferenciaBaraja48 ? "48 Cartas" : "40 Cartas",
        jugadores: sala.jugadores.map(j => j.nombre), // Solo nombres
        estado: sala.estado
    }))
};

function generarIdUnico(){
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id;
    let existe = true;

    while (existe) {
        id = '';
        for (let i = 0; i < 4; i++) {
            id += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        if (!rooms[id]) {
            existe = false;
        }
    }
    return id;
}

module.exports = (io, socket) => {
    
    socket.on("pedir_salas", () => {
        socket.emit("salas_publicas", obtenerSalasPublicas());
    });
    
    socket.on("crear_sala", (data, callback) => {
        let { nombre, salaId, config,privacidad } = data;

        if (!nombre) {
            return socket.emit("error", { mensaje: "Falta el nombre del jugador" });
        }

        if (!salaId || salaId === "AUTO") {
            salaId = generarIdUnico(); 
        } else{
            if (rooms[salaId]){
                return socket.emit("error", { mensaje: "Sala ya existente, prueba con otro código" });
            }
        }

        rooms[salaId] = new Sala(salaId, config,privacidad);
        console.log(`Sala iniciada: ${salaId}`);
        
        const partida = rooms[salaId];

        partida.addJugador(socket.id, nombre)

        // Subscribe el socket a un canal
        socket.join(salaId)
        socket.data.salaId = salaId;

        socket.emit("sala_asignada", { salaId: salaId });

        // Avisa a todos incluyendome a mi
        io.to(salaId).emit("sala_asignada", {jugadores: partida.jugadores})
        console.log(`${nombre} se unió a ${salaId}`);
        
         io.emit("salas_publicas", { salas: obtenerSalasPublicas() });
    });
    
    socket.on("unirse_sala", (data, callback) => {
        let { nombre, salaId } = data;

        if (!nombre) {
            return socket.emit("error", { mensaje: "Falta el nombre del jugador" });
        }

        const partida = rooms[salaId];

        if (!partida) {
            return socket.emit("error", { mensaje: "Esa sala no existe" });
        }

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

        socket.emit("sala_asignada", { salaId: salaId });

        // Avisa a todos incluyendome a mi
        io.to(salaId).emit("jugador_unido", {jugadores: partida.jugadores})
        console.log(`${nombre} se unió a ${salaId}`);

        io.emit("salas_publicas", { salas: obtenerSalasPublicas() });
    });
    

    socket.on("disconnect", () => {

        const salaId = socket.data.salaId

        if (!salaId || !rooms[salaId]) return;

        const partida = rooms[salaId];

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
        io.emit("salas_publicas", { salas: obtenerSalasPublicas() });
    });

    
}