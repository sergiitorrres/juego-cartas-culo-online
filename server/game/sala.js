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
        while(nextJ.haPasado || nextJ.posicionFinal != null) {
            turnoActual = (turnoActual + 1) % jugadores.length
            nextJ = jugadores[turnoActual]
        }
        return nextJ
    }

    checkIfTurn(id) {
        return id == this.jugadores[this.turnoActual].id
    }

    jugadoresResetPass() {
        this.jugadores.forEach(j => {
            j.setHaPasado(false) 
        });
    }

    realizarIntercambio(clientId, indicesCartas) {
        if (this.estado !== 'INTERCAMBIO') return { error: 'No es fase de intercambio' };
        if (!this.intercambiosPendientes.includes(clientId)) {
            return { error: 'No tienes intercambios pendientes' };
        }

        const jugadorEnvia = this.jugadores.find(j => j.id === clientId);
        if (!jugadorEnvia) return { error: 'Jugador no encontrado' };

        let rolDestino = null;
        switch (jugadorEnvia.rol) {
            case 'culo':
                rolDestino = 'presidente';
                break;
            case 'vice_culo':
                rolDestino = 'vice_presidente';
                break;
            case 'vice_presidente':
                rolDestino = 'vice_culo';
                break;
            case 'presidente':
                rolDestino = 'culo';
                break;
            default:
                return { error: 'Tu rol no intercambia cartas' };
        }

        const jugadorDestino = this.jugadores.find(j => j.rol === rolDestino);
        if (!jugadorDestino) return { error: 'No se encontró al destinatario' };

        
        // Recuperar los objetos carta usando los índices que nos dio el cliente
        const cartasAEnviar = indicesCartas.map(indice => jugadorEnvia.mano[indice]).filter(c => c !== undefined);
        if (cartasAEnviar.length === 0) return { error: 'Indices de cartas inválidos' };

        // Añadir las cartas al Destino
        jugadorDestino.mano.push(...cartasAEnviar);

        // Borrar las cartas del Origen
        jugadorEnvia.mano = jugadorEnvia.mano.filter(carta => !cartasAEnviar.includes(carta));

        jugadorDestino.mano.sort((a, b) => a.fuerza - b.fuerza);
        jugadorEnvia.mano.sort((a, b) => a.fuerza - b.fuerza);

        this.intercambiosPendientes = this.intercambiosPendientes.filter(id => id !== clientId);

        return {
            exito: true,
            destinatarioId: jugadorDestino.id,
            nuevasCartas: cartasAEnviar,
            faseTerminada: this.intercambiosPendientes.length === 0
        };
    }
}

module.exports = Sala