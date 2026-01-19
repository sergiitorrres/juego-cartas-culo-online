const Carta = require("./carta");

class Baraja{
    constructor(usarMazoGrande = false){
        this.cartas = []
        this.generar(usarMazoGrande)
    }

    generar(){
        const palos = ['oros', 'copas', 'espadas', 'bastos']
        let valor = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]

        if (usarMazoGrande) {
            valor = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 48 cartas
        }

        // of itera sobre elementos, in sobre indices
        for (const palo of palos){
            for (const val of valor){
                const nombreImagen = `${palo}_${val}.png`
                const nuevacarta = new Carta(palo, val, nombreImagen)
                this.cartas.push(nuevacarta)
            }
        }
    }

    barajar(){
        // Algoritmo de Fisher-Yates
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
        }
    }

    robar(cantidad){
        // Extrae la carta del array
        return this.cartas.splice(0, cantidad)
    }
}

module.exports = Baraja