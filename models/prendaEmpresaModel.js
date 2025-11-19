export default class PrecioEmpresaModel {
  constructor({ id = null, nombre, rut, prendas = [] }) {
    this.id = id;
    this.nombre = nombre;
    this.rut = rut;
    this.prendas = prendas;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      rut: this.rut,
      prendas: this.prendas,
    };
  }
}
