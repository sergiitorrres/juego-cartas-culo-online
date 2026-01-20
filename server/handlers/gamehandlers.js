// Logica de las cartas (barajar, validar turno, calcular ganador)

const  { ROLES } = require("../game/constantes");

module.exports = (io, socket) => {
    
    socket.on("lanzar_cartas", (data, callback) => {
        const {indices, salaId} = data
        const sala = rooms[salaId]

        if(!sala.checkIfTurn(socket.id)) {
            socket.emit("error", {mensaje: "No es tu turno"})
            return;
        }

        const mesa = sala.mesa
        let jugador
        sala.jugadores.forEach(j => {
            if(j.id === socket.id) jugador = j 
        });

        let mesa_limpia = indices.length == 1 && jugador.mano[indices[0]].id == "oros_2"

        if(!mesa_limpia) {
            if(indices.length != mesa.cantidad) { // CANTIDAD INSUFICIENTE
                if(mesa.cantidad < 1) {
                    // Era la primera tirada
                    mesa.setCantidad(indices.length)
                } else {
                    // No puedes hacer eso
                    socket.emit("error", {mensaje : "Hay " + mesa.cantidad + " cartas pero has tirado " + indices.length})
                    return;
                }
            } else if(jugador.mano[indices[0]].fuerza < mesa.fuerzaActual) { // NECESITA CARTAS MAS ALTAS
                // No puedes hacer eso
                socket.emit("error", {mensaje: "La carta en mesa es más alta"})
                return;
            }
        }

        // Jugada casi Valida
        let cartas = []
        indices.sort((a, b) => b - a) // mayor a menor
        indices.forEach(i => {
            cartas.push(jugador.mano[i])
        })

        // Comprobar que todas tienen misma fuerza
        let f = cartas[0].fuerza
        for(let i = 1; i < cartas.length; i++) {
            if(f != cartas[i].fuerza) {
                // No puedes hacer eso
                socket.emit("error", {mensaje: "Las cartas son distintas"})
                return;
            }
        }
        
        const plin = mesa.setFuerzaActual(f)
        mesa.setCartas(cartas)
        indices.forEach(i => {
            jugador.removeCarta(i)
        })

        // Avisar a todos de cartas jugadas
        io.to(salaId).emit("jugada_valida", 
            {   jugadorId: socket.id, 
                cartas: cartas
        })
        mesa.setUltimoJugador(jugador)

        // CONTINUAR TURNOS
        if(mesa_limpia) {
            mesa.reset()
            sala.jugadoresResetPass()
            io.to(salaId).emit("mesa_limpia", {})
        }
        // ¿? JUGADOR TERMINA
        if(jugador.mano.length == 0) {
            // El jugador ha terminado
            if(!mesa_limpia) { // Evita repetir
                mesa.reset()
                sala.jugadoresResetPass()
                io.to(salaId).emit("mesa_limpia", {})
                mesa_limpia = true
            }

            jugador.setPosFinal(mesa.jugadorTerminado())
            io.to(salaId).emit("jugador_termino", {jugadorId: socket.id, posicion: jugador.posicionFinal})
            
            if(mesa.jugadorTerminado + 1 == sala.jugadores.length) { // FIN RONDA
                jugador.setRol(ROLES.VICE_CULO)
                // SELECCIONAR QUIEN ES CULO
                let jculo = null
                sala.jugadores.forEach(j => {
                    if(j.posicionFinal < 0) {
                        jculo = j
                    }
                })
                jculo.setRol(ROLES.CULO)
                // ------ INICIAR NUEVA RONDA ------
                let ranking = sala.getRankings()
                io.to(salaId).emit("fin_ronda", {presi: ranking[0], vice_presi: ranking[1], vice_culo: ranking[2], culo: ranking[3]})
                sala.startNewRound()

                sala.jugadores.forEach(j => {
                    io.to(j.id).emit("ronda_iniciada", {misCartas: j.mano})
                })
                return
            } else {
                if(jugador.posicionFinal == 1) {
                    jugador.setRol(ROLES.PRESIDENTE)
                } else if(jugador.posicionFinal == 2) {
                    jugador.setRol(ROLES.VICE_PRESIDENTE)
                } else {jugador.setRol(ROLES.NEUTRO)}
            }
        }

        // SIGUIENTE JUGADOR A TIRAR
        let nextJ = sala.nextJugador()
        if(plin) {
            nextJ = sala.nextJugador()
        }

        if(nextJ.id === mesa.ultimoJugador.id) {
            mesa.reset()
            sala.jugadoresResetPass()
            io.to(salaId).emit("mesa_limpia", {})
        }
        io.to(salaId).emit("turno_jugador", {turno: nextJ.id})
    });

    socket.on("jugador_paso", (data, callback) => {
        const { salaId } = data
        const sala = rooms[salaId]

        if(!sala.checkIfTurn(socket.id)) {
            socket.emit("error", {mensaje: "No es tu turno"})
            return;
        }

        let jugador
        sala.jugadores.forEach(j => {
            if(j.id === socket.id) jugador = j 
        });
        jugador.setHaPasado(true)
        io.to(salaId).emit("jugador_paso_notif", {jugadorId: socket.id})

        let nextJ = sala.nextJugador()
        const mesa = sala.mesa
        if(nextJ.id === mesa.ultimoJugador.id) {
            mesa.reset()
            sala.jugadoresResetPass()
            io.to(salaId).emit("mesa_limpia", {})
        }
        io.to(salaId).emit("turno_jugador", {turno: nextJ.id})
    });
}