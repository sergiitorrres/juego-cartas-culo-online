const constantes = require("./constantes");

class Jugador {
    constructor(socketId, nombre) {
        this.id = socketId
        this.nombre = nombre
        this.listo = false

        // ESTADO PARTIDA
        this.rol = constantes.ROLES.NEUTRO
        this.mano = []
        this.haPasado = false
        this.posicionFinal = -1
        this.puntuacion = null
        
    }
    
    removeCarta(pos) { this.cartas.splice(pos, 1) }

    setPosFinal(pos) { this.posicionFinal = pos }

    setRol(rol) { this.rol = rol }

    setHaPasado(bool) { this.haPasado = bool }
}

module.exports = Jugador