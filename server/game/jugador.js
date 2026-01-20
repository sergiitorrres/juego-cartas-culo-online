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
        this.posicionFinal = null
        this.puntuacion = null
        
    }
    
    removeCarta(pos) {
        this.cartas.splice(pos, 1)
    }

    setPosFinal(pos) {
        this.posicionFinal = pos
    }
}

module.exports = Jugador