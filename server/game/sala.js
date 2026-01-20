const constantes = require("./constantes");
const Jugador = require("./jugador");
const Mesa = require("./mesa");
const Baraja = require("./baraja");

class Sala {
    constructor(id, config) {
        this.id = id
        this.estado = constantes?.ESTADOS?.LOBBY || "LOBBY"
        this.ronda = 0

        const limite = config?.maxJugadores || 4;
        this.maxJugadores = [4, 5, 6].includes(limite) ? limite : 4;

        // CONFIGURACION DE TURNO
        this.turnoActual = 0 // Indice del array de jugadores
        this.direccion = 1 // 1 = Horario, -1 = Antihorario

        // DATOS
        this.jugadores = []
        this.mesa = new Mesa()

        // ESTADO INTERCAMBIO
        this.intercambiosPendientes = []

        this.baraja = null

        this.preferenciaBaraja48 = config?.baraja48 || false;

    }

    addJugador(socketId, nombre){
        const nuevoJugador = new Jugador(socketId, nombre);
        this.jugadores.push(nuevoJugador);
        return nuevoJugador;
    }

    iniciar_partida(){
        if (this.jugadores.length < 4) return {error : "Faltan jugadores"};
        if (this.estado !== "LOBBY") return { error: "Ya ha empezado" };

        this.estado = "JUGANDO";

        const numJugadores = this.jugadores.length;
        let usarMazoGrande = false;

        if (numJugadores === 4) {
            usarMazoGrande = this.preferenciaBaraja48;
        }else if (numJugadores === 6) {  // 5 ya es = false -> No se cambia
            usarMazoGrande = true;
        }

        this.baraja = new Baraja(usarMazoGrande);
        this.baraja.barajar();

        const totalCartas = this.baraja.cartas.length;
        const cartasPorJugador = Math.floor(totalCartas / numJugadores);

        this.jugadores.forEach(jugador => {
            jugador.mano = this.baraja.robar(cartasPorJugador)
            // ordena cartas
            jugador.mano.sort((a,b) => a.fuerza - b.fuerza)
        });
        
        return {exito : true}
    }

    nextJugador() {
        turnoActual = (turnoActual + 1) % jugadores.length
        let nextJ = jugadores[turnoActual]
        while(nextJ.haPasado || nextJ.posicionFinal < 0) {
            turnoActual = (turnoActual + 1) % jugadores.length
            nextJ = jugadores[turnoActual]
        }
        return nextJ
    }

    checkIfTurn(id) { return id == this.jugadores[this.turnoActual].id }

    jugadoresResetPass() {
        this.jugadores.forEach(j => {
            j.setHaPasado(false) 
        });
    }

    getRankings() {
        let ranking = ["Presi", "Vice_Presi", "Vice_Culo", "Culo"]
        let ptos = 2 + this.ronda * 2
        if(ronda > 2) ptos = 6
        
        this.jugadores.forEach(j => {
            if(j.rol == constantes.ROLES.PRESIDENTE) {
                ranking[0] = j.id;
                j.addPtos(ptos)
            } else if (j.rol == constantes.ROLES.VICE_PRESIDENTE) {
                ranking[1] = j.id
                j.addPtos(ptos/2)
            } else if (j.rol == constantes.ROLES.VICE_CULO) {
                ranking[2] = j.id
                j.add(-ptos/2)
            } else if (j.rol == constantes.ROLES.CULO) {
                ranking[3] = j.id
                j.add(-ptos)
            }
        });

        return ranking
    }

    startNewRound() {
        this.baraja.barajar()
        this.ronda++
        
        const totalCartas = this.baraja.cartas.length;
        const cartasPorJugador = Math.floor(totalCartas / numJugadores);

        this.jugadores.forEach(jugador => {
            jugador.mano = this.baraja.robar(cartasPorJugador)
            // ordena cartas
            jugador.mano.sort((a,b) => a.fuerza - b.fuerza)

            // -- Reset otros atributos --
            jugador.setPosFinal(-1)
            jugador.setHaPasado(false)
        });
    }
}

module.exports = Sala