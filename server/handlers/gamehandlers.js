// Logica de las cartas (barajar, validar turno, calcular ganador)

module.exports = (io, socket) => {

    function startNew(mesa) {
        mesa.reset()
    }
    
    socket.on("lanzar_cartas", (data, callback) => {
        const {indices, salaId} = data
        const sala = rooms[salaId]
        const mesa = sala.mesa
        let jugador
        sala.jugadores.forEach(j => {
            if(j.id == socket.id) jugador = j 
        });

        let mesa_limpia = false
        if (indices.length == 1 && jugador.cartas[indices[0]].id != "oro_2") {
            //2 oros (mesa_limpia)
            mesa_limpia = true
        } else if(indices.length != mesa.cantidad) { // CANTIDAD INSUFICIENTE
            // No puedes hacer eso
            socket.emit("error", {mensaje : "Hay " + mesa.cantidad + " cartas pero has tirado " + indices.length})
            return;
        } else if(jugador.cartas[indices[0]].fuerza < mesa.fuerzaActual) { // NECESITA CARTAS MAS ALTAS
            // No puedes hacer eso
            socket.emit("error", {mensaje: "La carta en mesa es más alta"})
            return;
        }

        // Jugada casi Valida
        let cartas = []
        indices.sort((a, b) => b - a) // mayor a menor
        indices.forEach(i => {
            cartas.push(jugador.cartas[i])
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
        
        mesa.setFuerzaActual(f)
        mesa.setCartas(cartas)
        indices.forEach(i => {
            jugador.removeCarta(i)
        })

        // Avisar a todos de cartas jugadas
        io.to(salaId).emit("jugada_valida", 
            {   jugadorId: socket.id, 
                cartas: cartas
        })

        // CONTINUAR TURNOS
        if(mesa_limpia) {
            startNew(mesa)
            io.to(salaId).emit("mesa_limpia", {})
        }
        if(jugador.cartas.length == 0) {
            // El jugador ha terminado
            jugador.setPosFinal(mesa.jugadorTerminado())
            io.to(salaId).emit("jugador_termino", {jugadorId: socket.id, posicion: jugador.posicionFinal})
            sala.updateTurnoActual() // sala.turnoActual++
            
            if(mesa.jugadorTerminado + 1 == sala.jugadores.length) { // FIN RONDA
                
            }
        }


    });
}