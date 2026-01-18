const http = require('http');

// Creamos el servidor
const server = http.createServer((req, res) => {
    // 1. Log para que tú lo veas en la terminal de la Raspberry
    console.log(`[CONEXIÓN] ¡Alguien ha entrado desde ${req.socket.remoteAddress}!`);

    // 2. Preparamos la respuesta para el navegador (Cabeceras)
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });

    // 3. Enviamos el mensaje al usuario
    res.end('¡Felicidades SysAdmin! Tu servidor Docker en la Raspberry Pi funciona 🚀');
});

// Arrancamos el servidor
// IMPORTANTE: '0.0.0.0' es vital para que Docker permita conexiones desde fuera del contenedor
server.listen(3000, '0.0.0.0', () => {
    console.log('--- Servidor Listo ---');
    console.log('Escuchando en el puerto 3000');
});
