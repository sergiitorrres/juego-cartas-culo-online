// Bot.js
const Jugador = require("./jugador");
class Bot extends Jugador {
    constructor(nombre) {
        const idBot = "BOT_" + Math.random().toString(36).substring(2, 8); // id única
        super(idBot, nombre); 
        this.esBot = true;
        this.vista = null;
        this.tengo2Oros = false;
        verMano()
    }

    // Función que decide qué carta tirar
    jugar(mesa) {
        if(mesa.cantidad === -1) {
            for(var i = this.vista.length - 1; i >= 0; i--) {
                if(this.vista[i].length > 0) {
                    var fuerza = this.vista[i][0];
                    var cantidad = i + 1;
                    this.getCartas(fuerza , cantidad);
                }
            }


        }

        let jugada = []

        if(this.vista[mesa.cantidad - 1].length !== 0){
            var fuerza = mesa.fuerzaActual;
            var cantidad = mesa.cantidad;
            jugada = this.getCartas(fuerza, cantidad);
            
        }else if(this.tengo2Oros){
            jugada = this.getCartas
            
            for(var i = 0; i < this.mano.length; i++){
                if(this.mano[i].fuerza === 11 && this.mano[i].palo === 'oros'){
                    jugada = [this.mano[i]]
                    this.tengo2Oros = false;
                    break;
                }
            }
        }

        return jugada;
    }
    
    verMano() {
        this.vista = [[], [], [], []];
        let cont = 0;
        let f = this.mano[this.mano.length - 1].fuerza;
        for(var i = this.mano.length - 2; i >= 0; i--) {
            let faux = this.mano[i].fuerza;
            if(faux === 11 && this.mano[i].palo === 'oros') {
                this.tengo2Oros = true;
                continue;
            }
            
            if(f !== faux) {
                this.vista[cont].push(f);
                f = faux;
                cont = 0;
            } else { cont++; }

            
        }

        this.vista[cont].push(f);
    }

    getCartas(fuerza, cantidad) {
        let cartas = [];

        for (let i = this.mano.length - 1; i >= 0 && cartas.length < cantidad; i--) {
            if (this.mano[i].fuerza === fuerza) {
                cartas.push(this.mano[i]);
            }
        }

        const idx = this.vista[cantidad - 1].indexOf(fuerza);
        this.vista = this.vista[cantidad - 1].splice(idx, 1);

        return cartas.length === cantidad ? cartas : null;
    }

}

module.exports = Bot;
