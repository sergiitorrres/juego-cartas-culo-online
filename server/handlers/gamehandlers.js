// Logica de las cartas (barajar, validar turno, calcular ganador)
const { rooms } = require("../store");
const  { ROLES } = require("../game/constantes");

module.exports = (io, socket) => {

    socket.on("iniciar_partida", () => {
        const salaId = socket.data.salaId;
        const sala = rooms[salaId];
        console.log("Intentando iniciar partida1")
        if (!sala) return;

        const resultado = sala.iniciar_partida();

        if (resultado.error) {
            return socket.emit("error", { mensaje: resultado.error });
        }
        
        console.log("Intentando iniciar partida2")
        sala.jugadores.forEach(j => {
            if (!j.esBot) {
                const s = io.sockets.sockets.get(j.id);
                if(s) {
                    s.emit("ronda_iniciada", { 
                        misCartas: j.mano,
                        jugadores: sala.jugadores.map(p => ({
                            id: p.id, nombre: p.nombre, numCartas: p.mano.length, rol: p.rol
                        }))
                    });
                }
            }
        });
        console.log("Intentando iniciar partida3")
        io.to(salaId).emit("turno_jugador", { turno: resultado.turnoInicial, esPrimero: true });
        console.log(`Partida iniciada en ${salaId}`);

        const jugadaBot = sala.checkJuegaBot();
        if(jugadaBot) {
            setTimeout();
        }
    });

    socket.on("lanzar_cartas", (data, callback) => {
        const cartasJugadas = data.cartas
        const salaId = socket.data.salaId;
        const sala = rooms[salaId]

        if(!sala || !sala.checkIfTurn(socket.id)) {
            return socket.emit("error", {mensaje: "No es tu turno"})
        }

        const mesa = sala.mesa
        const jugador = sala.jugadores.find(j => j.id === socket.id);

        if (jugador.haPasado) {
            return socket.emit("error", { mensaje: "Has pasado turno, debes esperar a que se limpie la mesa" });
        }

        if (cartasJugadas.length === 0) return;

        const esDosDeOros = (cartasJugadas.length === 1 && cartasJugadas[0].palo === 'oros' && cartasJugadas[0].valor === 2);
        let limpiaMesa = esDosDeOros;

        if(!limpiaMesa && mesa.cartasEnMesa.length > 0) {
            if (cartasJugadas.length !== mesa.cantidad) {
                return socket.emit("error", { mensaje: `Debes tirar ${mesa.cantidad} cartas` });
            }
            if (cartasJugadas[0].fuerza < mesa.fuerzaActual) {
                return socket.emit("error", { mensaje: "Tus cartas son muy bajas" });
            }
        }

        // Comprobar que todas tienen misma fuerza
        let f = cartasJugadas[0].fuerza
        if (!cartasJugadas.every(c => c.fuerza === f)) {
            return socket.emit("error", { mensaje: "Las cartas deben ser del mismo valor" });
        }
        
        let plin = (!limpiaMesa && mesa.cartasEnMesa.length > 0 && mesa.fuerzaActual === f);
        if(plin){
            io.to(salaId).emit("plinRealizado", { 
            jugadorId: socket.id, 
            cartas: cartasJugadas
        });
        }
        
        mesa.setFuerzaActual(f);
        mesa.setCartas(cartasJugadas);
        mesa.setCantidad(cartasJugadas.length);
        mesa.setUltimoJugador(jugador);
        
        const idsCartasJugadas = []
        cartasJugadas.forEach(c => {
            idsCartasJugadas.push(c.id)
        })
        
        jugador.mano = jugador.mano.filter(c => !idsCartasJugadas.includes(c.id));

        // Avisar a todos
        io.to(salaId).emit("jugada_valida", { 
            jugadorId: socket.id, 
            cartas: cartasJugadas
        });

        // Si el jugador se queda sin cartas
        if (jugador.mano.length === 0) {
            sala.posiciones = (sala.posiciones || 0) + 1;
            jugador.posicionFinal = sala.posiciones;

            io.to(salaId).emit("jugador_termino", { 
                jugadorId: socket.id, 
                posicion: jugador.posicionFinal 
            });

            // Verificar si acaba la ronda
            const activos = sala.jugadores.filter(j => j.mano.length > 0);
            if (activos.length <= 1) {
                finalizarRonda(sala, io, salaId);
                return;
            }
            limpiaMesa = true;
        }

        // Si hay que limpiar mesa
        if (limpiaMesa) {
            mesa.reset();
            sala.jugadoresResetPass();
            plin = false;
            io.to(salaId).emit("mesa_limpia", { motivo: esDosDeOros ? "2 de Oros" : "Jugador terminó" });
            
            // Si tiro 2 de oros y sigue jugando, repite turno
            if (esDosDeOros && jugador.mano.length > 0) {
                io.to(salaId).emit("turno_jugador", { turno: jugador.id, esPrimero: limpiaMesa});
                return;
            }
        }

        let nextJ = sala.nextJugador();

        if (plin && nextJ) {
            nextJ = sala.nextJugador(); 
        }

        // Si da la vuelta completa y le toca al mismo que tiro la ultima carta -> Limpia mesa
        if (mesa.ultimoJugador && nextJ && nextJ.id === mesa.ultimoJugador.id) {
            mesa.reset();
            sala.jugadoresResetPass();
            io.to(salaId).emit("mesa_limpia", { motivo: "Nadie ha tirado cartas" });
        }

        if(nextJ) io.to(salaId).emit("turno_jugador", { turno: nextJ.id, esPrimero: limpiaMesa });
    });


    socket.on("jugador_paso", (data, callback) => {
        const salaId = socket.data.salaId;
        const sala = rooms[salaId]

        if(!sala || !sala.checkIfTurn(socket.id)) {
            return socket.emit("error", {mensaje: "No es tu turno"})
        }

        if(sala.checkFirstTurn()) {
            return socket.emit("error", {mensaje: "No puedes saktar en el primer turno"})
        }

        const jugador = sala.jugadores.find(j => j.id === socket.id);
        jugador.setHaPasado(true);
        io.to(salaId).emit("jugador_paso_notif", {jugadorId: socket.id})

        let nextJ = sala.nextJugador()
        const mesa = sala.mesa

        if(mesa.ultimoJugador && nextJ && nextJ.id === mesa.ultimoJugador.id) {
            mesa.reset()
            sala.jugadoresResetPass()
            io.to(salaId).emit("mesa_limpia", {motivo: "Nadie ha tirado cartas"})
        }
        io.to(salaId).emit("turno_jugador", {turno: nextJ.id, esPrimero: false})
    });

    socket.on("dar_cartas", (data, callback) => {
        const cartas = data.cartas
        const salaId = socket.data.salaId
        const sala = rooms[salaId]

        //console.log("salaId:", socket.data.salaId);
        //console.log("rooms keys:", Object.keys(rooms));

        if (!sala) {
            socket.emit("error", { error: "Sala no encontrada o no válida" });
            return;
        }
        
        const info = sala.realizarIntercambio(socket.id, cartas)
        if(!info.ok) {
            io.to(socket.id).emit("intercambio_incorrecto", {cartas: cartas})
            return;
        }

        if(info.interDone) {
            io.to(info.jugador1).emit("cartas_donadas", {cartas: info.cartasParaJ1, from: info.jugador2})

            io.to(info.jugador2).emit("cartas_donadas", {cartas: info.cartasParaJ2, from: info.jugador1})
        }

        if(info.faseTerminada) {
            io.to(salaId).emit("fase_intercambio_finalizada", {});
            const idTurno = sala.jugadores[sala.turnoActual].id;
            io.to(salaId).emit("turno_jugador", { turno: idTurno, esPrimero: true });
            // Por si acaso
            sala.intercambiosPendientes = []
            sala.mapa = new Map()
        }
    });
}

// Fin de ronda e inicio de la siguiente
function finalizarRonda(sala, io, salaId) {
    // Ordenar roles -> Los que terminaron (posicion > 0) primero. El que queda (-1) el último.
    const ranking = [...sala.jugadores].sort((a, b) => {
        if (a.posicionFinal > 0 && b.posicionFinal === -1) return -1;
        if (a.posicionFinal === -1 && b.posicionFinal > 0) return 1;
        return a.posicionFinal - b.posicionFinal;
    });

    if (ranking.length >= 4) {
        ranking.forEach(j => j.rol = ROLES.NEUTRO); // Primero todos a NEUTRO

        ranking[0].rol = ROLES.PRESIDENTE;
        ranking[1].rol = ROLES.VICE_PRESIDENTE;
        ranking[ranking.length - 2].rol = ROLES.VICE_CULO;
        ranking[ranking.length - 1].rol = ROLES.CULO;
    }

    const infoRanking = sala.getRankings();
    io.to(salaId).emit("fin_ronda", { ranking: infoRanking });

    setTimeout(() => {  // En 5 segundos empiza la siguiente ronda
        sala.empezarRondaNueva();
        sala.posiciones = 0;
        
        // Repartir cartas nuevas a todos
        sala.jugadores.forEach(j => {
             const socketJugador = io.sockets.sockets.get(j.id);
             if(socketJugador) {
                 socketJugador.emit("ronda_iniciada", { 
                     misCartas: j.mano,
                     jugadores: sala.jugadores.map(p => ({
                        id: p.id, nombre: p.nombre, numCartas: p.mano.length, rol: p.rol
                    }))
                 });
             }
        });
        

        let indiceTurno = sala.jugadores.findIndex(j => j.rol === ROLES.CULO);
        if (indiceTurno === -1) indiceTurno = 0;
        
        sala.turnoActual = indiceTurno;

        const datosIntercambio = sala.gestionarIntercambio();

        if (datosIntercambio.tipo === "intercambio_activo") {
            io.to(salaId).emit("fase_intercambio", {});
            datosIntercambio.instrucciones.forEach(instruccion => {
                const s = io.sockets.sockets.get(instruccion.socketId);
                if (s) s.emit(instruccion.evento, instruccion.data);
            });
        } else {
            const idTurno = sala.jugadores[sala.turnoActual].id;
            io.to(salaId).emit("turno_jugador", { turno: idTurno, esPrimero: true });
        }
    }, 5000);


}