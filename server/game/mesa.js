class Mesa {
    constructor() {
        this.cartasEnMesa = []
        this.ultimoJugador = null
        this.cantidad = null // Cuantas cartas juntas
        this.fuerzaActual = -1
        this.jugadoresTerminado = 0
    }

    jugadorTerminado() {
        return ++this.jugadoresTerminado;
    }

    setFuerzaActual(f) {
        this.fuerzaActual = f
    }

    setCartas(cartas) {
        this.cartasEnMesa = cartas
    }

    reset() {
        this.cartasEnMesa = []
        this.ultimoJugador = null
        this.cantidad = null // Cuantas cartas juntas
        this.fuerzaActual = -1
        this.jugadoresTerminado = 0
    }
}

module.exports = Mesa