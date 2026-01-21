import React, { useState } from 'react';
import styles from './Lobby.module.css';

const Lobby = () => {
  const [playerName, setPlayerName] = useState('');

  return (
    <div className={styles.pantalla}>
      {/* Contenedor del Pergamino */}
      <div className={styles.pergamino}>
        
        <h1 className={styles.titulo}>La Taberna del Naipe</h1>
        
        <input 
          type="text" 
          placeholder="Tu Nombre de Jugador" 
          className={styles.inputNombre}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        
        <div className={styles.botonesContainer}>
          <button className={styles.botonMadera}>
            Partida publica
          </button>
          <button className={styles.botonMadera}>
            partida privada
          </button>
        </div>
        <vr/>

      </div>
    </div>
  );
};

export default Lobby;