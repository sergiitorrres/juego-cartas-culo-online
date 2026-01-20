const constantes = require("./constantes");
const Jugador = require("./jugador");

class Sala {
    constructor(id, config) {
        this.id = id
        this.estado = constantes.ESTADOS.LOBBY
        this.ronda = 0

        const limite = config?.maxJugadores || 4;
        this.maxJugadores = [4, 5, 6].includes(limite) ? limite : 4;

        // CONFIGURACION DE TURNO
        this.turnoActual = 0 // Indice del array de jugadores
        this.direccion = 1 // 1 = Horario, -1 = Antihorario

        // DATOS
        this.jugadores = []
        this.mesa = mesa

        // ESTADO INTERCAMBIO
        this.intercambiosPendientes = []


    }

    addJugador(socketId, nombre){
        const nuevoJugador = new Jugador(socketId, nombre);
        this.jugadores.push(nuevoJugador);
        return nuevoJugador;
    }

    updateTurnoActual() {
        return ++this.turnoActual % this.jugadores.length;
    }
}

module.exports = Sala