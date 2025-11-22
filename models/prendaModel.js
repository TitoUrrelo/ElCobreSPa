export default class PrendaModel {
  constructor({ id = null, tipo, precio, estado = true }) {
    this.id = id;
    this.tipo = tipo;
    this.precio = precio;
    this.estado = estado;
  }

  toFirestore() {
    return {
      tipo: this.tipo,
      precio: this.precio,
      estado: this.estado
    };
  }
}