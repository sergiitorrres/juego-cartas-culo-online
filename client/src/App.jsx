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

/*/ --- PARA EJECUTAR EN LOCAL ---
// Detectamos si estamos en local (localhost) o en producción (dominio real)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local, forzamos el puerto 3000. Si es producción, dejamos undefined (usa el mismo dominio)
const URL = isLocal ? 'http://localhost:3000/' : undefined;

const socket = io(URL, {
  transports: ['websocket', 'polling'], // Importante para estabilidad
  autoConnect: true
});
// ------------------- */

// --- PARA EJECUTAR EN SERVIDOR ---
const socket = io()
// ------------------- */

function App() {

  const [playerName, setPlayerName] = useState('');

  return (
    // Simplemente mostramos el componente Inicio
    
    <Routes>
      <Route path= "/" element = {<Inicio setPlayerName={setPlayerName} playerName={playerName} />}   />
      <Route path = "/crear_privada" element = {<CrearPrivada socket={socket} playerName={playerName} />}/>
      <Route path = "/test" element = {<Test />}/>
      <Route path = "/lobby" element = {<Lobby1 />}/>
      
      <Route path="/mesa1/:id" element={<Mesa socket={socket} />} />
      <Route path = "/test" element = {<Test />}/>
      <Route path = "/partida_publica" element = {<PartidaPublica socket={socket} playerName={playerName} />}/>

    </Routes>
  );
}

export default App;