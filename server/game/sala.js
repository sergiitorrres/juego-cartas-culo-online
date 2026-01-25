const constantes = require("./constantes");
const Jugador = require("./jugador");
const Mesa = require("./mesa");
const Baraja = require("./baraja");

class Sala {
    constructor(id, config,privacidad) {
        this.id = id
        this.estado = constantes?.ESTADOS?.LOBBY || "LOBBY"
        this.ronda = 0
        this.privacidad = privacidad

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
        this.intercambiosRealizados = []
        this.mapa = new Map()
        this.baraja = null

        this.preferenciaBaraja48 = config?.baraja48 || false;
        this.usarMazoGrande = false;

    }

    addJugador(socketId, nombre){
        const nuevoJugador = new Jugador(socketId, nombre);
        this.jugadores.push(nuevoJugador);
        return nuevoJugador;
    }

    iniciar_partida(){
        if (this.jugadores.length < 4) return {error : "Faltan jugadores"};
        if (this.estado !== constantes.ESTADOS.LOBBY) return { error: "Ya ha empezado" };

        this.estado = constantes.ESTADOS.REPARTIENDO;
        this.ronda = 1;

        const numJugadores = this.jugadores.length;
        
        if (numJugadores === 4) {this.usarMazoGrande = this.preferenciaBaraja48;}
        else if (numJugadores === 6) {this.usarMazoGrande = true;}
        else {this.usarMazoGrande = false;} // 5 jugadores

        this.baraja = new Baraja(this.usarMazoGrande);
        this.baraja.barajar();

        this.repartirCartas();

        // Ronda 1, el 3 de Oros empieza
        let indiceArranca = this.jugadores.findIndex(j => j.mano.some(c => c.palo === 'oros' && c.valor === 3));
        if (indiceArranca === -1) indiceArranca = 0;
        this.turnoActual = indiceArranca;

        this.estado = constantes.ESTADOS.JUGANDO;

        return {exito : true, turnoInicial: this.jugadores[this.turnoActual].id}
    }

    // auxiliar que se repetia varias veces
    repartirCartas() {
        const totalCartas = this.baraja.cartas.length;
        const numJugadores = this.jugadores.length;
        const cartasPorJugador = Math.floor(totalCartas / numJugadores);

        this.jugadores.forEach(jugador => {
            jugador.mano = this.baraja.robar(cartasPorJugador);
            jugador.mano.sort((a,b) => b.fuerza - a.fuerza);
        });
    }

    nextJugador() {
        let count = 0;
        do {
            this.turnoActual = (this.turnoActual + 1) % this.jugadores.length;
            count++;
            if (count > this.jugadores.length) return null;
        } while (this.jugadores[this.turnoActual].haPasado || this.jugadores[this.turnoActual].mano.length === 0);

        return this.jugadores[this.turnoActual];
    }

    checkIfTurn(id) { 
        return id == this.jugadores[this.turnoActual].id 
    }

    jugadoresResetPass() {
        this.jugadores.forEach(j => j.haPasado = false);
    }

    gestionarIntercambio() {
        // Solo intercambio a partir de la ronda 2
        if (this.ronda < 2) return { tipo: "sin_intercambio" };
        
        const hayRoles = this.jugadores.some(j => j.rol === constantes.ROLES.PRESIDENTE);
        if (!hayRoles) return { tipo: "sin_intercambio" };

        this.estado = constantes.ESTADOS.INTERCAMBIO; 
        this.intercambiosPendientes = [];

        const instrucciones = [];
        
        const getPorRol = (r) => this.jugadores.find(j => j.rol === r);

        const presidente = getPorRol(constantes.ROLES.PRESIDENTE);
        const culo = getPorRol(constantes.ROLES.CULO);
        const vicePresi = getPorRol(constantes.ROLES.VICE_PRESIDENTE);
        const viceCulo = getPorRol(constantes.ROLES.VICE_CULO);

        if (presidente && culo) {
            instrucciones.push({
                socketId: culo.id,
                evento: "pedir_cartas",
                data: { rol: constantes.ROLES.CULO, cantidad: 2, forzado: true, destino: constantes.ROLES.PRESIDENTE }
            });
            instrucciones.push({
                socketId: presidente.id,
                evento: "pedir_cartas",
                data: { rol: constantes.ROLES.PRESIDENTE, cantidad: 2, forzado: false, destino: constantes.ROLES.CULO }
            });
            this.intercambiosPendientes.push(culo.id);
            this.intercambiosPendientes.push(presidente.id)
        }

        if (vicePresi && viceCulo) {
            instrucciones.push({
                socketId: viceCulo.id,
                evento: "pedir_cartas",
                data: { rol: constantes.ROLES.VICE_CULO, cantidad: 1, forzado: true, destino: constantes.ROLES.VICE_PRESIDENTE }
            });
            instrucciones.push({
                socketId: vicePresi.id,
                evento: "pedir_cartas",
                data: { rol: constantes.ROLES.VICE_PRESIDENTE, cantidad: 1, forzado: false, destino: constantes.ROLES.VICE_CULO }
            });
            this.intercambiosPendientes.push(viceCulo.id);
            this.intercambiosPendientes.push(vicePresi.id)
        }

        return { tipo: "intercambio_activo", instrucciones };
    }

    realizarIntercambio(clientId, cartasAEnviar) {
        if (this.estado !== constantes.ESTADOS.INTERCAMBIO) return {ok: false, error: 'No es fase de intercambio' };
        /*if (!this.intercambiosPendientes.includes(clientId)) {
            return { ok: false, error: 'No tienes intercambios pendientes' };
        }*/

        const jugadorEnvia = this.jugadores.find(j => j.id === clientId);
        if (!jugadorEnvia) return { ok: false, error: 'Jugador no encontrado' };

        let rolDestino = null;
        let cantidad = 0
        switch (jugadorEnvia.rol) {
            case constantes.ROLES.CULO: rolDestino = constantes.ROLES.PRESIDENTE; cantidad = 2; break;
            case constantes.ROLES.VICE_CULO: rolDestino = constantes.ROLES.VICE_PRESIDENTE; cantidad = 1; break;
            case constantes.ROLES.VICE_PRESIDENTE: rolDestino = constantes.ROLES.VICE_CULO; cantidad = 1; break;
            case constantes.ROLES.PRESIDENTE: rolDestino = constantes.ROLES.CULO; cantidad = 2; break;
            default: return {ok: false, error: 'Tu rol no intercambia cartas' };
        }

        const jugadorDestino = this.jugadores.find(j => j.rol === rolDestino);
        if (!jugadorDestino) return {ok: false, error: 'No se encontró al destinatario' };

        // Recuperar objetos carta
        if (cartasAEnviar.length !== cantidad ) return {ok: false, error: 'No has entregado ' + cantidad + ' cartas' };

        let interDone = false
        let cartasFromJD = undefined
        if(this.intercambiosRealizados.includes(jugadorDestino.id)) {
            cartasFromJD = this.mapa.get(jugadorDestino.id)
            // Añadir las cartas al Destino
            jugadorEnvia.mano.push(...cartasFromJD);
            // Borrar las cartas del Origen
            jugadorDestino.mano = jugadorDestino.mano.filter(carta => !cartasFromJD.includes(carta));

            // Añadir las cartas al Destino
            jugadorDestino.mano.push(...cartasAEnviar);
            // Borrar las cartas del Origen
            jugadorEnvia.mano = jugadorEnvia.mano.filter(carta => !cartasAEnviar.includes(carta));

            jugadorDestino.mano.sort((a, b) => b.fuerza - a.fuerza);
            jugadorEnvia.mano.sort((a, b) => b.fuerza - a.fuerza);
            interDone = true;
            this.mapa.delete(jugadorDestino.id)
        } else {
            this.mapa.set(jugadorEnvia.id, cartasAEnviar)
        }

        this.intercambiosPendientes = this.intercambiosPendientes.filter(id => id !== clientId);

        return {
            ok: true,
            inter: interDone,
            jugador1: jugadorEnvia.id,
            cartasParaJ1: cartasFromJD,
            jugador2: jugadorDestino.id,
            cartasParaJ2: cartasAEnviar,
            faseTerminada: this.intercambiosPendientes.length === 0
        };
    }
    
    getRankings() {
        const ranking = [];
        const rolesOrdenados = [
            constantes.ROLES.PRESIDENTE,
            constantes.ROLES.VICE_PRESIDENTE,
            constantes.ROLES.VICE_CULO,
            constantes.ROLES.CULO
        ];

        let ptos = this.ronda === 1 ? 2 : this.ronda === 2 ? 4 : 6;

        rolesOrdenados.forEach((r, index) => {
            const jugador = this.jugadores.find(j => j.rol === r);
            if (!jugador) return;

            ranking.push({
                jugadorId: jugador.id,
                rol: r
            });

            if (r === constantes.ROLES.PRESIDENTE) jugador.addPtos(ptos);
            else if (r === constantes.ROLES.VICE_PRESIDENTE) jugador.addPtos(ptos / 2);
            else if (r === constantes.ROLES.VICE_CULO) jugador.addPtos(-ptos / 2);
            else jugador.addPtos(-ptos);
        });

        return ranking;
    }


    empezarRondaNueva() {
        this.ronda++;
        this.mesa.reset(); // restaura a los valores por defecto

        this.baraja = new Baraja(this.usarMazoGrande);
        this.baraja.barajar();
        
        this.jugadores.forEach(jugador => {
            jugador.posicionFinal = -1;
            jugador.haPasado = false;
        });

        this.repartirCartas();
    }
}

module.exports = Sala