import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './inicio.module.css';

const Inicio = ({ playerName, setPlayerName }) => {
  const navigate = useNavigate();

  const irACrearPrivada = () => {
    if (!playerName.trim()) {
      alert("Por favor, escribe tu nombre antes de entrar");
      return;
    }
    navigate('/crear_privada');
  };

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
          
          <button className={styles.botonMadera} onClick={irACrearPrivada}>
            Partida privada
          </button>
          
        </div>

      </div>
    </div>
  );
};

export default Inicio;