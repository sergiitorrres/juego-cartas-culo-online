import React from 'react';
import styles from './mesa.module.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESTADOS } from '../../../server/game/constantes';
import { ROLES } from '../../../server/game/constantes';


const Mesa = ({playerName, socket}) => {
  const navigate = useNavigate();
  const [misCartas,setMisCartas] = useState([]);
  const [rivales,setRivales] = useState([]);
  const [estado,setEstado] = useState(ESTADOS.LOBBY);
  const [turno,setTurno] = useState ();
  const [cartasMesa, setCartaMesa] = useState([]);
  const [miRol, setMiRol] = useState();
  const [seleccionadas, setSeleccionadas] = useState([]);

  useEffect(() => {
    if (!playerName) navigate('/');
    if (!socket) return;

    socket.on("ronda_iniciada",(data) =>{
      setMisCartas(data.misCartas);
      setRivales(data.jugadores.filter(j => j.id !== socket.id));
      setEstado(ESTADOS.JUGANDO);
    })

    socket.on("jugador_paso_notif",(data) =>{
      //MODIFICAR PARA QUE SE VEA CUANDO PASA
      
    })

    socket.on("turno_jugador",(data) =>{
      setTurno(data.turno);
    })

    socket.on("error",(data)=>{
      //MODIFICAR PARA QUE SE MANDE EL TEXTO DE TODOS LOS FALLOS
    })
    
    socket.on("jugada_valida", (data) => {
      setCartaMesa(data.cartas)
      if(data.jugadorId === socket.id) {
        let cartas = misCartas
        const cartasJugadas = indices.map(i => jugador.mano[i]).filter(c => c);
        cartas = cartas.filter(c => !cartasJugadas.includes(c));
        setMisCartas(cartas)
      }
    })
  
      socket.on("jugador_termino", (data) => {
        setRivales((prev) =>
          prev.map((r) =>
            r.id === data.jugadorId ? { ...r, posicionFinal: data.posicion } : r
        )
      );
    });

    socket.on("fin_ronda", (data) => {
      const ranking = data.ranking
      const roles = [ROLES.PRESIDENTE, ROLES.VICE_PRESIDENTE, ROLES.VICE_CULO, ROLES.CULO]
      let flag = false

      for(let i = 0; i < ranking.length; i++) {
        // El servidor envía: { jugadorId, posicion }
        setRivales((prevRivales) => 
          prevRivales.map((rival) =>
          // Si el ID coincide, actualizamos su posición
          rival.id === ranking[i].jugadorId ? { ...rival, rol: roles[i] } : rival // Si no coincide, devolvemos el rival sin cambios
          )
        );
        
        if(ranking[i].id === socket.id) {
          setMiRol(roles[i])
          flag = true
        }
      }

      if(!flag) {
        setMiRol(ROLES.NEUTRO)
      }
    }) 

    // ======= INTERCAMBIOS =======

    socket.on("fase_intercambio", (data) => {
      setEstado(ESTADOS.INTERCAMBIO)
    }) 

    socket.on("pedir_cartas", (data) => {
      const cant = data.cantidad
      const forzado = data.forzado

      if(forzado) {
        let cartas = misCartas
        cartas.splice(0, cant)
        setMisCartas(ca)
      }
    })

    return () => { socket.off("ronda_iniciada"); }
  }, [playerName, navigate]);

  const handlerIniciarPartida = () => {
    socket.emit("iniciar_partida",{
    })
  }
  const handlerPasarTurno = () => {
    socket.emit("jugador_paso",{
    })
  }

  const handelerLanzarCarta = (indices) => {
    socket.emit("lanzar_cartas", {
      indices: indices
    })
  }

  const toggleSelection = (index) =>{
    setSeleccionadas ((prev) =>{
      if(prev.includes(index)){
        return prev.filter((i) => i !== index);
      }
      return [...prev,index];
    })
  }

  
  
  return (
    // CONTENEDOR PADRE
    <div 
      className="game-table"
      data-fase="Lobby"
      data-jugadores="0" // Acuérdate de poner "data-"
    >
      
      {/* --- ZONA 1: OPONENTES (ARRIBA) --- */}
      <div className="opponents-row">
        
        {/* Un Jugador Rival */}
        <div className="jugador_rival"> 
          <img alt="avatar" src="foto_avatar" />
          <span>{playerName}</span>
          <img alt="rol" src="foto_rol" />
          <img alt="estado" src="foto_check" />
          
          <div className="contador">
            <img alt="cartas" src="icono_cartas.png" />
            <span>3</span>
          </div>
        </div>

        {/* Si hubiera más rivales, irían aquí... */}

      </div> 


      {/* --- ZONA 2: CENTRO DE LA MESA --- */}
      <div className="table-center">
        <div className="pila-central"></div> 
        <button
          className="botonInicioPartida"
          type="button"
          onClick={handlerIniciarPartida}
          disabled={!LOBBY} 
        ></button>
        
        <button
          className="boton_pasar"
          type="button"
          onClick={jugador_paso}
          // disabled={true} preguntar como funciona lo de pasar y los turnos
        >
          Pasar
        </button>
        
        <span className="info-turno">Turno de: Pepe</span>
      </div>


      {/* --- ZONA 3: TÚ (ABAJO) - LO QUE TE FALTABA --- */}
      <div className="zona del jugador">
         <div className="mi_mano">
          
            <button className="carta">3 🔶</button> 
         </div>

         <div className="mi_perfil">
            <img alt="mi avatar" src="mi_foto" />
            <img alt="icono rol" src="icono rol" />
            <span>Yo</span>
         </div>
      </div>

    </div> 
  );
};

export default Mesa;