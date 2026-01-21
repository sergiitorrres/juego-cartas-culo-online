import React, { useState } from 'react';
import styles from './Lobby.module.css';

const Lobby = () => {
  const [playerName, setPlayerName] = useState('');

  return (
    <div className={styles.pantalla}>
      {/* Contenedor del Pergamino */}
      <div className={styles.pergamino}>
        
        <h1 className={styles.titulo}>Has llegado a test!!!!</h1>
        
        <input 
          type="text" 
          placeholder="DAvisuco puto maricon" 
          className={styles.inputNombre}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        


      </div>
    </div>
  );
};

export default Lobby;