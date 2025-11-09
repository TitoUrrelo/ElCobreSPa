import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import ComandaModel from '../models/comandaModel';

const COLLECTION_NAME = 'comandas';

// Crear comanda
export const crearComanda = async (comandaData) => {
  try {
    const comanda = new ComandaModel(comandaData);
    await addDoc(collection(db, COLLECTION_NAME), comanda.toFirestore());
    return { success: true };
  } catch (error) {
    console.error('Error al guardar comanda:', error);
    throw error;
  }
};

// Obtener todas las comandas
export const obtenerComandas = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener comandas:', error);
    throw error;
  }
};

// Obtener comandas por estado
export const obtenerComandasPendientes = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('estado', '==', 'pendiente'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener comandas pendientes:', error);
    throw error;
  }
};

export const obtenerUltimaComandaPorTipo = async (tipoCliente) => {
  try {
    const prefix = tipoCliente === 'empresa' ? 'EMP-' : 'PART-';
    const q = query(
      collection(db, COLLECTION_NAME),
      where('cliente.tipo', '==', tipoCliente),
      orderBy('numeroOrden', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const ultima = snapshot.docs[0].data();
      return ultima.numeroOrden; // ej: "EMP-0042"
    }
    return null;
  } catch (error) {
    console.error('Error al obtener última comanda:', error);
    return null;
  }
};