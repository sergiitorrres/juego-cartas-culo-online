
import styles from './mesa.module.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESTADOS, ROLES } from '../constantes';

const Mesa = ({playerName, socket, numMaxJugadores}) => {
  const navigate = useNavigate();
  const [misCartas,setMisCartas] = useState([]);
  const [rivales,setRivales] = useState([]);
  const [estado,setEstado] = useState(ESTADOS.LOBBY);
  const [turno,setTurno] = useState ();
  const [cartasMesa, setCartaMesa] = useState([]);
  const [miRol, setMiRol] = useState();
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [jugadoresLista,setJugadoresLista] = useState([]);
  const [numeroJugadores,setNumeroJugadores] = useState()
  const [ultimoJugadorId, setUltimoJugadorId] = useState(null);

useEffect(() => {
    
    window.history.pushState(null, null, window.location.pathname);

    const handlePopState = (event) => {
      window.history.pushState(null, null, window.location.pathname);
      setMostrarModal(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!playerName) navigate('/');
    if (!socket) return;

    socket.on("jugador_unido" , (data) => {
      setJugadoresLista(data.jugadores);
      setNumeroJugadores(jugadoresLista.length + 1);
    })

    socket.on("ronda_iniciada",(data) =>{
      setMisCartas(data.misCartas);
      setUltimoJugadorId(null);
      let riv = [];
      let miPosicion = 0;
      for(miPosicion; miPosicion < data.jugadores.length; miPosicion++){
        if (data.jugadores[miPosicion].id === socket.id){
          break;
        }
      }
      let p;
      for(p = miPosicion + 1; p < data.jugadores.length; p++) {
        riv.push(data.jugadores[p])
      }
      for(p = 0; p < miPosicion; p++) {
        riv.push(data.jugadores[p])
      }
      setRivales(riv);
      setEstado(ESTADOS.JUGANDO);
    })

    socket.on("jugador_paso_notif", (data) => {
        return setRivales(prevRiv => 
          prevRiv.map(rival => 
            rival.id === data.jugadorId ? { ...rival, haPasado: true } : rival
        )
        );
      });

    socket.on("turno_jugador",(data) =>{
      setTurno(data.turno);
    })

    socket.on("error",(data)=>{
      //MODIFICAR PARA QUE SE MANDE EL TEXTO DE TODOS LOS FALLOS
      console.log(`Info error: ${data}`);
      alert(`Error: ${data.mensaje}`);
    })
    
    socket.on("jugada_valida", (data) => {
      setCartaMesa(data.cartas);
      setUltimoJugadorId(data.jugadorId)
      if(data.jugadorId === socket.id) {
        setMisCartas(prevCartas => {
          return prevCartas.filter(c => !data.cartas.find(dc => dc.id === c.id));
        });
        setSeleccionadas([]);
      }else{
        setRivales(prevRivales => 
          prevRivales.map(r =>
            r.id === data.jugadorId ? { ...r, numCartas: r.numCartas - data.cartas.length } : r
          )
        );
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
      const roles = [
        ROLES.PRESIDENTE,
        ROLES.VICE_PRESIDENTE,
        ROLES.VICE_CULO,
        ROLES.CULO
      ];

      let miRolNuevo = ROLES.NEUTRO;

      data.ranking.forEach(entry => {
        setRivales(prev =>
          prev.map(r =>
            r.id === entry.jugadorId ? { ...r, rol: entry.rol } : r
          )
        );

        if (entry.jugadorId === socket.id) {
          miRolNuevo = entry.rol;
        }
      });

      setMiRol(miRolNuevo);


      setTimeout(() => {
        setCartaMesa([]);
      }, 2000);

      // Reset Ha Pasado
      resetHaPasado();
    }) 
    
    socket.on("mesa_limpia", (data) => {
      const motivo = data.motivo; // Probablemente no necesario
      setTimeout(() => {
        setCartaMesa([]);
        setUltimoJugadorId(null);
      }, 2000);

      // Reset Ha Pasado
      resetHaPasado();
    })

    // ======= INTERCAMBIOS =======

    socket.on("fase_intercambio", (data) => {
      setEstado(ESTADOS.INTERCAMBIO);
    }) 

    socket.on("pedir_cartas", (data) => {
      const cant = data.cantidad;
      const forzado = data.forzado;

      if(forzado) {
        setTimeout(() => {
          setMisCartas(prevCartas => {
            let cartasDonadas = [];

            const indexOros2 = prevCartas.findIndex(c => c.id === "oros_2");

            if (indexOros2 !== -1) {
              const oros2 = prevCartas[indexOros2];
              cartasDonadas.push(oros2);

              if (cant === 2) {
                const mejorRestante = prevCartas.find(c => c.id !== "oros_2");
                if (mejorRestante) {
                  cartasDonadas.push(mejorRestante);
                }
              }
            } else {
              cartasDonadas = prevCartas.slice(0, cant);
            }

            socket.emit("dar_cartas", { cartas: cartasDonadas });

            return prevCartas.filter(c => !cartasDonadas.includes(c));
          });

        }, 5000);
      }
    })

    socket.on("cartas_donadas", (data) => {
      const from = data.from; // Para hacer animacion en el futuro
      const nuevasCartas = data.cartas

      const idsCartasJugadas = []
      nuevasCartas.forEach(c => {
          idsCartasJugadas.push(c.id)
      })

      console.log("Me han donado: " + idsCartasJugadas);
      setMisCartas(prevCartas => {
        let newMano = [...prevCartas, ...nuevasCartas];
        newMano.sort((a, b) => b.fuerza - a.fuerza);
        return newMano;
      });
    })

    socket.on("intercambio_incorrecto", (data) => {
      const cartasPerdidas = data.cartas;
      setMisCartas(prevCartas => {
        let mano = [...prevCartas, ...cartasPerdidas];
        mano = mano.sort((a, b) => b.fuerza - a.fuerza);
        return mano;
      })
    })

    socket.on("fase_intercambio_finalizada", (data) => {
      setEstado(ESTADOS.JUGANDO);
      setSeleccionadas([]);
    })

    
    
    // ***********************************
    //  ======= CIERRE DE SOCKETS =======
    // ***********************************
    return () => { socket.off("ronda_iniciada") ;socket.off( "jugador_paso_notif"); socket.off("turno_jugador"); socket.off("error"); socket.off("jugada_valida");
      socket.off("jugador_termino"); socket.off("fin_ronda"); socket.off("fase_intercambio"); socket.off("pedir_cartas"); socket.off("dar_cartas"); 
      socket.off("cartas_donadas"); socket.off("fase_intercambio_finalizada"); socket.off("mesa_limpia"); socket.off("jugador_unido"); socket.off("intercambio_incorrecto")
    }
  }, [playerName, navigate, socket]);

  // --- CÁLCULOS PARA EL RENDERIZADO ---
// --- ESTO DEBE IR JUSTO ANTES DEL RETURN ---
const totalConectados = rivales.length + 1;
const maxCapacidad = numeroJugadores || 6;
const huecosDisponibles = Math.max(0, maxCapacidad - totalConectados);
// El array de sitios debe estar disponible para el mapeo
const sitios = ['izq', 'arriba-izq', 'arriba-centro', 'arriba-der', 'der'];

  const resetHaPasado = () => {
    setRivales(prevRiv => prevRiv.map(rival => ({ ...rival, haPasado: false }))
);

  }

  const handlerconfirmarSalida = () => {
    // El usuario dijo SI
    socket.emit("salir_sala"); // Avisamos al server (rompe la partida)
    navigate('/'); // Nos vamos a la pantalla de inicio
  };

  const handlercancelarSalida = () => {
    // El usuario dijo NO
    setMostrarModal(false); // Ocultamos modal y seguimos jugando
  };

  const handlerIniciarPartida = () => {
    socket.emit("iniciar_partida",{});
  }
  const handlerPasarTurno = () => {
    socket.emit("jugador_paso",{});
  }

  const handlerLanzarCarta = (indices) => {
    const setIndices = new Set(indices);
    const cartasLanzadas = misCartas.filter((_, idx) => setIndices.has(idx));
    socket.emit("lanzar_cartas", {cartas: cartasLanzadas});
  }

  const toggleSelection = (index) =>{
    setSeleccionadas((prev) =>{
      if(prev.includes(index)){
        return prev.filter((i) => i !== index);
      }
      return [...prev,index];
    })
  }

  const handlerDarCartas = (indices) => {
    setMisCartas(prevCartas => {
      const setIndices = new Set(indices);

      const restantes = prevCartas.filter((_, idx) => !setIndices.has(idx));
      const cartas_donadas = prevCartas.filter((_, idx) => setIndices.has(idx));

      socket.emit("dar_cartas", { cartas: cartas_donadas });
      return restantes;
    });
  };
  
  return (
    // CONTENEDOR PADRE
    <div className={styles['game-table']}
      data-fase="Lobby"
      data-jugadores="0" // Acuérdate de poner "data-"
    >
      
      {mostrarModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCaja}>
            <h3>⚠ ATENCIÓN</h3>
            <p>¿Estás seguro de que quieres abandonar la partida?</p>
            <p style={{fontSize: '0.9rem', color: '#666'}}>Si sales, la partida finalizará para todos.</p>
            <div className={styles.modalBotones}>
              <button onClick={handlerconfirmarSalida} className={styles.btnSi}>SÍ, SALIR</button>
              <button onClick={handlercancelarSalida} className={styles.btnNo}>NO</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ZONA 1: OPONENTES (ARRIBA) --- */}
{rivales.map((rival, index) => {
  const esSuTurno = rival.id === turno;
  const hizoUltimaJugada = rival.id === ultimoJugadorId;
  return (<div 
    key={rival.id} 
    className={`${styles.jugador_rival} ${styles[sitios[index]]} ${rival.haPasado ? styles.haPasado : ''} ${esSuTurno ? styles.borde_turno_verde : ''} ${hizoUltimaJugada ? styles.brillo_ultima_jugada : ''}`}
  >
    <span className={styles.nombre_rival}>{rival.nombre}</span>
    
    {/* AVATAR PEQUEÑO (FIJADO POR CSS) */}
    <img alt="avatar" className={styles.avatar} src="/assets/images/avatar-de-usuario.png" />
    
    {/* BARRA DE TIEMPO RIVAL */}
    <div className={styles['timer-container']}>
      <div 
        className={styles['timer-bar']}
        style={{ 
          width: rival.id === turno ? '100%' : '0%', 
          transition: rival.id === turno ? 'width 15s linear' : 'none' 
        }}
      ></div>
    </div>

    <div className={styles.contadorDeCartas}>
       <span>{rival.numCartas} 🎴</span>
    </div>
  </div>
)})}

      


      {/* --- ZONA 2: CENTRO DE LA MESA --- */}
      <div className={styles['table-center']}>
        <div className={styles['pila-central']}>
          {estado === ESTADOS.LOBBY && (
            <div className={styles.contenedorLobby}>
              <h3>Esperando jugadores ({jugadoresLista.length + 1}/{numMaxJugadores})</h3>
            <div className={styles.listaEspera}>
            <div className={styles.fichaEspera}>{playerName} (Tú)</div>
            {rivales.map(r => <div key={r.id} className={styles.fichaEspera}>{r.nombre}</div>)}
                {/* Pintamos los huecos vacíos */}
            {[...Array(huecosDisponibles)].map((_, i) => (
        <div key={i} className={styles.fichaHueco}>Esperando...</div>
      ))}
    </div>
  </div>
)}
          {cartasMesa.map((carta,index) =>(
            <img key={index} alt = {carta.id} src={`/assets/images/cartas/${carta.id}.png`}/>
          ))}
          </div>
        <div className={styles.controles_centro}>
          {estado === ESTADOS.LOBBY && (
            <button
            className={styles.botonInicioPartida}
            type="button"
            onClick={handlerIniciarPartida}
          > 
            INICIAR PARTIDA 
            </button>
          )}
        
          <button
            className = {styles.boton_pasar}
            type="button"
            onClick={handlerPasarTurno}
            disabled={turno !== socket?.id || cartasMesa.length === 0}
          >
          Pasar
        </button>
        
        </div>  
      </div>


      {/* --- ZONA 3: TÚ (ABAJO) - LO QUE TE FALTABA --- */}
      <div className={`
      ${styles.zona_jugador} 
      ${socket?.id === turno ? styles.fondo_turno_activo : ''} {/* <-- NUEVA CLASE DE FONDO */}
      ${socket?.id === ultimoJugadorId ? styles.brillo_ultima_jugada : ''}
      `}>
         <div className={styles.mi_mano}>
          {misCartas.map((carta,posicion) =>
          <button
          key={carta.id}
          onClick= {() => toggleSelection(posicion)}
          className={`${styles.carta} ${seleccionadas.includes(posicion) ? styles.seleccionada : ''}`}
          
          >
            
          <img
          alt = {carta.id}
          src={`/assets/images/cartas/${carta.id}.png`}
          ></img>

          </button>

          
          )}
          
         </div>
          <button onClick = {() => handlerLanzarCarta(seleccionadas)}
            disabled ={turno !== socket?.id || seleccionadas.length === 0} 
            className={`${styles.boton_lanzar} ${seleccionadas.length > 0 ? styles.brillante : ''} ${turno === socket?.id ? styles.boton_turno_activo : ''}`}
          >    
          Lanzar
          </button>
          
          {estado === ESTADOS.INTERCAMBIO &&(
              <button
                onClick={() => handlerDarCartas(seleccionadas)}
                className={styles.boton_dar_cartas}
                disabled = {![ROLES.PRESIDENTE, ROLES.VICE_PRESIDENTE].includes(miRol)}>
                Dar cartas
              </button>
          )}


         <div className={styles.mi_perfil}>
            <img alt="mi avatar" src="/assets/images/avatar-de-usuario.png" />
            <img alt="icono rol" src="/assets/images/culo_rol.png" />
            <span>{playerName} ({miRol || 'Sin Rol'})</span>
         </div>
         <div className={styles['timer-container']}>
          <div 
            className={styles['timer-bar']}
            style={{ 
            width: socket?.id === turno ? '100%' : '0%', // Comprueba si es tu turno
            transition: socket?.id === turno ? 'width 15s linear' : 'none' 
          }}
          ></div>
            </div>
      </div>

    </div> 
  );
};

export default Mesa;