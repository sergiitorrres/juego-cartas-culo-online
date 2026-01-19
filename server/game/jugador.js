const constantes = require("./constantes");

class Jugador {
    constructor(socketId, nombre) {
        this.id = socketId
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