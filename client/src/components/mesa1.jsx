
import styles from './mesa.module.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESTADOS, ROLES } from '../constantes';

const Mesa = ({playerName, socket}) => {
  const navigate = useNavigate();
  const [misCartas,setMisCartas] = useState([]);
  const [rivales,setRivales] = useState([]);
  const [estado,setEstado] = useState(ESTADOS.LOBBY);
  const [turno,setTurno] = useState ();
  const [cartasMesa, setCartaMesa] = useState([]);
  const [miRol, setMiRol] = useState();
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

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
    //if (!playerName) navigate('/');
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
      console.log(`Info error: ${data}`);
      alert(`Error: ${data.mensaje}`);
    })
    
    socket.on("jugada_valida", (data) => {
      setCartaMesa(data.cartas);
      if(data.jugadorId === socket.id) {
        setMisCartas(prevCartas => {
          return prevCartas.filter(c => !data.cartas.find(dc => dc.id === c.id));
        });
        setSeleccionadas([]);
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
      const ranking = data.ranking;
      const roles = [ROLES.PRESIDENTE, ROLES.VICE_PRESIDENTE, ROLES.VICE_CULO, ROLES.CULO];
      let flag = false;

      for(let i = 0; i < ranking.length; i++) {
        // El servidor envía: { jugadorId, posicion }
        setRivales((prevRivales) => 
          prevRivales.map((rival) =>
          // Si el ID coincide, actualizamos su posición
          rival.id === ranking[i].jugadorId ? { ...rival, rol: roles[i] } : rival // Si no coincide, devolvemos el rival sin cambios
          )
        );
        
        if(ranking[i].id === socket.id) {
          setMiRol(roles[i]);
          flag = true;
        }
      }

      if(!flag) {
        setMiRol(ROLES.NEUTRO);
      }

      setTimeout(() => {
        setCartaMesa([]);
      }, 2000);
    }) 

    socket.on("mesa_limpia", (data) => {
      const motivo = data.motivo; // Probablemente no necesario
      setTimeout(() => {
        setCartaMesa([]);
      }, 2000);
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
          const cartasDonadas = prevCartas.slice(0, cant);

          const indices = cartasDonadas.map(c =>
            prevCartas.findIndex(pc => pc.id === c.id)
          );

          socket.emit("dar_cartas", { indices });

          return prevCartas.filter(c => !cartasDonadas.includes(c));
          });
        }, 5000);
      } else {
        // MODIFICAR Y AÑADIR POP UP??
        // Gestionar seleccion de cartas a donar !!!
      }
    })

    socket.on("cartas_donadas", (data) => {
      const from = data.from; // Para hacer animacion en el futuro
      const nuevasCartas = data.cartas;

      setMisCartas(prevCartas => {
        let newMano = [...prevCartas, ...nuevasCartas];
        newMano.sort((a, b) => b.fuerza - a.fuerza);
        return newMano;
      });
    })

    socket.on("fase_intercambio_finalizada", (data) => {
      setEstado(ESTADOS.JUGANDO);
    })
    
    // ***********************************
    //  ======= CIERRE DE SOCKETS =======
    // ***********************************
    return () => { socket.off("ronda_iniciada") ;socket.off( "jugador_paso_notif"); socket.off("turno_jugador"); socket.off("error"); socket.off("jugada_valida");
      socket.off("jugador_termino"); socket.off("fin_ronda"); socket.off("fase_intercambio"); socket.off("pedir_cartas"); socket.off("dar_cartas"); 
      socket.off("cartas_donadas"); socket.off("fase_intercambio_finalizada"); socket.off("mesa_limpia")
    }
  }, [playerName, navigate, socket]);

  const handlerconfirmarSalida = () => {
    // El usuario dijo SI
    socket.emit("salir_sala"); // Avisamos al server (rompe la partida)
    navigate('/'); // Nos vamos a la pantalla de inicio
  };

  const handlercancelarSalida = () => {
    // El usuario dijo NO
    setMostrarModal(false); // Ocultamos modal y seguimos jugando
  };

  const handlerPulsarSalir = () => {
    setMostrarModal(true);
};

  const handlerIniciarPartida = () => {
    socket.emit("iniciar_partida",{});
  }
  const handlerPasarTurno = () => {
    socket.emit("jugador_paso",{});
  }

  const handlerLanzarCarta = (indices) => {
    socket.emit("lanzar_cartas", {indices: indices});
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

      socket.emit("dar_cartas", { indices });
      return restantes;
    });
  };
  
  return (
    // CONTENEDOR PADRE
    <div className={styles['game-table']}
      data-fase="Lobby"
      data-jugadores="0" // Acuérdate de poner "data-"
    >
      <button
        className={styles.boton_pasar} // Reutilizamos el estilo para que se vea igual
        type="button"
        onClick={handlerPulsarSalir}
        style={{
            position: 'absolute',  // Flotante
            top: '20px',           // Separación del techo
            left: '20px',          // Separación de la izquierda
            zIndex: 100,           // Por encima de todo
            backgroundColor: '#c62828', 
            color: 'white', 
            borderColor: '#8e0000',
            width: 'auto',         // Ajuste automático
            padding: '10px 20px'   // Un poco de aire
        }}
      >
        ⏏ SALIR
      </button>
      
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
      <div className={styles['opponents-row']}>
       {rivales.map((rival,posicion_pantalla) => (
        <div key= {rival.id} className={styles.jugador_rival}>
          <span className={styles.nombre_rival}> {rival.nombre} </span>
          <span> {rival.numCartas} </span>
          <img alt={rival.rol} src= 'PONER AQUI LA URL DE LA FOTO DEL ROL'/>
          <img alt="avatar" className={styles.avatar} src="foto_avatar" />

          {rival.posicionFinal > 0 ?
          (<span className={styles.victoria}> Termino en posicion {rival.posicionFinal}</span>):
          (<div className={styles.contadorDeCartas}>
            <img alt= '' src='INSERTAR AQUI URL QUE PONGAMOS PARA ICNONO DEL'/>
            <span> {rival.numCartas} </span>
          </div>)
          }
          {rival.id === turno &&
            <span className={styles.pensando}> ◀◀ Pensando </span>
          }
        </div>

       )
      
        
      )}

      </div> 


      {/* --- ZONA 2: CENTRO DE LA MESA --- */}
      <div className={styles['table-center']}>
        <div className={styles['pila-central']}>
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
      <div className={styles.zona_jugador}>
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
            className={`${styles.boton_lanzar} ${seleccionadas.length > 0 ? styles.brillante : ''}`}
          >    
          Lanzar
          </button>
         <div className={styles.mi_perfil}>
            <img alt="mi avatar" src="/assets/images/avatar-de-usuario.png" />
            <img alt="icono rol" src="/assets/images/culo_rol.png" />
            <span>{playerName} ({miRol || 'Sin Rol'})</span>
         </div>
      </div>

    </div> 
  );
};

export default Mesa;
