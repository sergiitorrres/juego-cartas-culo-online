import React, {useState} from 'react';
// Conectamos con tu pantalla principal
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Inicio from './components/inicio1'; 
import CrearPrivada from './components/crear_privada';
import Lobby1 from './components/lobby1';
import Test from './components/test';
import Mesa from './components/mesa1';
import PartidaPublica from './components/partida_publica';

const socket = io('http://localhost:3000')

function App() {

  const [playerName, setPlayerName] = useState('');

  return (
    // Simplemente mostramos el componente Inicio
    
    <Routes>
      <Route path= "/" element = {<Inicio setPlayerName={setPlayerName} playerName={playerName} />}   />
      <Route path = "/crear_privada" element = {<CrearPrivada socket={socket} playerName={playerName} />}/>
      <Route path = "/test" element = {<Test />}/>
      <Route path = "/lobby" element = {<Lobby1 />}/>
      <Route path = "/mesa" element = {<Mesa />}/>
      <Route path = "/test" element = {<Test />}/>
      <Route path = "/partida_publica" element = {<PartidaPublica socket={socket} playerName={playerName} />}/>

    </Routes>
  );
}

export default App;