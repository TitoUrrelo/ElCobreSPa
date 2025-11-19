export default class ClienteModel {
  constructor({ nombre, rut, telefono, correo, direccion = '', tipo }) {
    this.nombre = nombre;
    this.rut = rut;
    this.telefono = telefono;
    this.correo = correo;
    this.direccion = direccion;
    this.tipo = tipo
  }

  esValido() {
    return this.nombre && this.rut && this.telefono && this.correo;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      rut: this.rut,
      telefono: this.telefono,
      correo: this.correo,
      direccion: this.direccion,
      tipo: this.tipo,
    };
  }
}