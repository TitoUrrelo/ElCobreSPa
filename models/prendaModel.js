export default class PrendaModel {
  constructor({ id = null, tipo, precio }) {
    this.id = id;
    this.tipo = tipo;
    this.precio = precio;
  }

  toFirestore() {
    return {
      tipo: this.tipo,
      precio: this.precio,
    };
  }
}