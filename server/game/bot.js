// Bot.js
const Jugador = require("./jugador");
class Bot extends Jugador {
    constructor(nombre) {
        const idBot = "BOT_" + Math.random().toString(36).substring(2, 8); // id única
        super(idBot, nombre); 
        this.esBot = true;
    }

    // Función que decide qué carta tirar
    jugar(mesa) {
        if(mesa.cantidad === -1) {
            return this.mano.splice(this.mano.length - 1, 1)
        }
    }

    pasar() {
        this.haPasado = true;
    }
}

module.exports = Bot;
