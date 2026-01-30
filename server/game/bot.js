// Bot.js
const { ROLES } = require("./constantes");
const Jugador = require("./jugador");
class Bot extends Jugador {
    constructor(nombre) {
        const idBot = "BOT_" + Math.random().toString(36).substring(2, 8); // id única
        super(idBot, nombre); 
        this.esBot = true;
        this.vista = null;
        this.tengo2Oros = false;
    }

    // Función que decide qué carta tirar
    jugar(mesa) {
        this.verMano()

        //console.log("Vista de Bot: " + this.vista)

        if(mesa.cartasEnMesa.length === 0) {
            for(var i = this.vista.length - 1; i >= 0; i--) {
                if(this.vista[i].length > 0) {
                    var fuerza = this.vista[i][0];
                    return this.getCartas(fuerza, i + 1);
                }
            }
        }

        let jugada = []

        if(this.vista[mesa.cantidad - 1].length !== 0){
            var fuerza = -1;
            var cantidad = mesa.cantidad;
            var cont = 0;
            while(fuerza < mesa.fuerzaActual && this.vista[cantidad - 1].length > cont) {
                fuerza = this.vista[cantidad - 1][cont];
                cont++;
            }

            if(fuerza < mesa.fuerzaActual) {return [];}
            jugada = this.getCartas(fuerza, cantidad);
            
        }else if(this.tengo2Oros){
            for(var i = 0; i < this.mano.length; i++){
                if(this.mano[i].fuerza === 11 && this.mano[i].palo === 'oros'){
                    jugada = [this.mano[i]]
                    this.tengo2Oros = false;
                    break;
                }
            }
        }

        //console.log("Jugada bot " + this.nombre + ": " + jugada.map(c => `${c.valor} de ${c.palo}`))
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

        return cartas.length === cantidad ? cartas : [];
    }



    darCartas (rol){
        let elegidasBuenas = [];
        this.verMano();
        if(this.tengo2Oros){
            var i = 0;
            while(i < this.mano.length){
                if(this.mano[i].valor === 2 && this.mano[i].palo === 'oros'){
                    if(i === 0){
                        elegidasBuenas = [this.mano[i], this.mano[i+1]]
                    }else{
                        elegidasBuenas = [this.mano[i], this.mano[0]]
                    }
                }
                i++;
            }
        }else{
            elegidasBuenas = [this.mano[0], this.mano[1]];
        }
       
        let elegidasMalas = [this.mano[this.mano.length - 2],this.mano[this.mano.length - 1]]

        switch (rol){
            case ROLES.CULO:
                return elegidasBuenas;
                break;
            case ROLES.VICE_CULO:
                return elegidasBuenas[0];
                break;
            case ROLES.VICE_PRESIDENTE:
                return elegidasMalas[1];
                break;
            case ROLES.PRESIDENTE:
                return elegidasMalas;
                break;

            default: 
            break;
        }
        
    }
}
module.exports = Bot;
