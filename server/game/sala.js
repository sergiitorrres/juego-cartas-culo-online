import constantes from "./constantes"

class Sala {
    constructor(id, mesa) {
        this.id = id
        this.estado = constantes.ESTADOS.LOBBY
        this.ronda = 0

        // CONFIGURACION DE TURNO
        this.turnoActual = 0 // Indice del array de jugadores
        this.direccion = 1 // 1 = Horario, -1 = Antihorario

        // DATOS
        this.jugadores = []
        this.mesa = mesa

        // ESTADO INTERCAMBIO
        this.intercambiosPendientes = []
    }
}

module.exports = Sala