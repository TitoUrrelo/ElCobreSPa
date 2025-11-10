export default class ClienteModel {
  constructor({ nombre, rut, telefono, correo, direccion = '' }) {
    this.nombre = nombre;
    this.rut = rut;
    this.telefono = telefono;
    this.correo = correo;
    this.direccion = direccion;
  }

  esValido() {
    // Retorna true si los campos obligatorios están completos
    return this.nombre && this.rut && this.telefono && this.correo;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      rut: this.rut,
      telefono: this.telefono,
      correo: this.correo,
      direccion: this.direccion,
    };
  }
}