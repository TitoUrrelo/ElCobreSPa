export default class ComandaModel {
  constructor({ numeroOrden, cliente, prendas,total, observaciones, fechaEntrega, fechaCreacion,creadoPor, procesos, despacho = false }) {
    this.numeroOrden = numeroOrden;
    this.cliente = cliente;
    this.prendas = prendas;
    this.total = total;
    this.observaciones = observaciones || '';
    this.fechaEntrega = fechaEntrega || new Date();
    this.fechaCreacion = fechaCreacion || new Date();
    this.estado = 'Pendiente';
    this.creadoPor = creadoPor || null; 
    this.procesos = procesos || [];
    this.despacho = despacho;
  }

  toFirestore() {
    return {
      numeroOrden: this.numeroOrden,
      cliente: this.cliente,
      prendas: this.prendas,
      total: this.total,
      observaciones: this.observaciones,
      fechaEntrega: this.fechaEntrega.toISOString(),
      fechaCreacion: this.fechaCreacion.toISOString(),
      estado: this.estado,
      creadoPor: this.creadoPor,
      procesos: this.procesos,
      despacho: this.despacho
    };
  }
}
