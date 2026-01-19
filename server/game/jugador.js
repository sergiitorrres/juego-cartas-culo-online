import constantes from "./constantes"

class Jugador {
    constructor(socket_id, nombre) {
        this.id = socket_id
        this.nombre = nombre
        this.listo = false

        // ESTADO PARTIDA
        this.rol = constantes.ROLES.NEUTRO
        this.cartas = []
        this.haPasado = false
        this.posicionFinal = null
        this.puntuacion = null
    }
}

module.exports = Jugador