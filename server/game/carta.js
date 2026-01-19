class Carta {
    constructor(palo, valor, img) {
        this.palo = palo
        this.valor = valor
        this.fuerza = (valor + 12 - 3) % 12

        this.img = img
        this.id = '${this.palo}_${this.valor}'
    }
}

module.exports = Carta