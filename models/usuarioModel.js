// models/usuarioModel.js
export default class UsuarioModel {
  constructor({ uid, nombre, correo, rut, numero, rol }) {
    this.uid = uid;
    this.nombre = nombre;
    this.correo = correo;
    this.rut = rut;
    this.numero = numero;
    this.rol = rol;
    this.fecha_creacion = new Date().toISOString();
    this.ultimo_acceso = new Date().toISOString();
    this.activo = true;
  }

  toFirestore() {
    return {
      uid: this.uid,
      nombre: this.nombre,
      correo: this.correo,
      rut: this.rut,
      telefono: this.numero,
      rol: this.rol,
      fecha_creacion: this.fecha_creacion,
      ultimo_acceso: this.ultimo_acceso,
      activo: this.activo,
    };
  }
}
