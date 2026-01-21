import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './crear_privada.module.css';

const CrearPrivada = ({ socket, playerName}) => {
  const navigate = useNavigate();

  useEffect(() => { // Comprueba que hay nombre
      if (!playerName) navigate('/');
    }, [playerName, navigate]);

  const [salaCrearId, setSalaCrearId] = useState('');
  const [selectedConfig, setSelectedConfig] = useState(0);
  const [salaUnirseId, setSalaUnirseId] = useState('');

  const configuraciones = [
    {id: 0, maxJugadores: 4, baraja48: false, label: '4 personas. - 40 Cartas'},
    {id: 1, maxJugadores: 4, baraja48: true, label: '4 personas. - 48 Cartas'},
    {id: 2, maxJugadores: 5, baraja48: false, label: '5 personas. - 40 Cartas'},
    {id: 3, maxJugadores: 6, baraja48: true, label: '6 personas. - 48 Cartas'},
  ]

  useEffect(() => {
    if (!socket) return;

    socket.on("jugador_unido", (data) => {
      console.log("¡Te has unido a la sala!", data);
      navigate('/lobby1');
    });

    socket.on("error", (data) => {
      alert("Error:", data.mensaje)
    });

    return(() => {
      socket.off("jugador_unido");
      socket.off("error");
    });
  }, [socket, navigate]);

  const handleCrearPartida = () => {
    if (!salaCrearId) return alert("Escribe un código para la sala");

    const config = configuraciones[selectedConfig]

    console.log("Creando sala:", salaCrearId, config)

    socket.emit('unirse_sala', { 
      nombre: playerName,
      salaId: salaCrearId,
      config: {
        maxJugadores: config.maxJugadores,
        baraja48: config.baraja48
      } 
    });
  }

  const handleUnirsePartida = () => {
    if (!salaUnirseId) return alert("Escribe un código para la sala");

    console.log("Uniendose a sala:", salaUnirseId)

    socket.emit('unirse_sala', { 
      nombre: playerName, 
      salaId: salaUnirseId,
      config: {}
    });

  }

  return (
    <div className={styles.pantalla}>
      <div className={styles.pergamino}>

        {/*---CREAR PARTIDA PARTE DE ARRIBA---*/}
        
        <div className={styles.seccion}>
          <h2 className={styles.titulo}>Crear partida</h2>
          <input
            type='text'
            placeholder='Introduce el código de la Sala a crear'
            className={styles.inputNombre}
            value={salaCrearId}
            onChange={(e) => setSalaCrearId(e.target.value)}
          />

          <p className={styles.subtitulo}>Configuración</p>

          <div className={styles.gridOpciones}>
          {configuraciones.map((opcion, index) => (
            <button
            key={index}
            className={`${styles.botonOpcion} ${selectedConfig === index ? styles.seleccionado : ''}`}
            onClick={() => setSelectedConfig(index)}
            >
            {opcion.label}
            </button>
          ))}
          </div>

          <button className={styles.botonAccion} onClick={handleCrearPartida}>Crear Sala</button>
        </div>

        {/*---SEPARADOR---*/}
        <hr className={styles.separador}/>

        {/*---UNIRSE PARTIDA PARTE DE ABAJO---*/}
        <div>
          <h2 className={styles.titulo}>Unirse a partida</h2>
          <input
            type='text'
            placeholder='Introduce el código de la Sala existente'
            className={styles.inputNombre}
            value={salaUnirseId}
            onChange={(e) => setSalaUnirseId(e.target.value)}
          />

          <button className={styles.botonAccion} onClick={handleUnirsePartida}>Unirse Sala</button>

        </div>


      </div>
    </div>
  );
};

export default CrearPrivada;