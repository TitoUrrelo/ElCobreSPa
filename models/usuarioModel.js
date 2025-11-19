// models/usuarioModel.js
export default class UsuarioModel {
  constructor({ nombre, correo, rut, numero, rol }) {
    this.nombre = nombre;
    this.correo = correo;
    this.rut = rut;
    this.numero = numero;
    this.rol = rol;
    this.creadoEn = new Date().toISOString();
    this.estado = true;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      correo: this.correo,
      rut: this.rut,
      numero: this.numero,
      rol: this.rol,
      creadoEn: this.creadoEn,
      estado: this.estado,
    };
  }
}
