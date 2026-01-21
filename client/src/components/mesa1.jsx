import React from 'react';
import styles from './Mesa.module.css';

const Mesa = () => {
  return (
    <div className={styles.tablero}>
      {/* Aquí irán las cartas más adelante */}
      <h2 style={{color: 'white', position: 'absolute', top: 20}}>
        Partida en curso...
      </h2>
    </div>
  );
};

export default Mesa;