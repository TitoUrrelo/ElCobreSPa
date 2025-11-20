import { signOut } from "firebase/auth";
import { db, auth } from '../firebaseConfig';
import { updateDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import ComandaModel from '../models/comandaModel';

const COLECCION_PARTICULAR = 'comandas_particular_equipo_5';
const COLECCION_EMPRESA = 'comandas_empresa_equipo_5';

export const crearComanda = async (comandaData) => {
  try {
    if (!comandaData.cliente || !comandaData.cliente.tipo) {
      throw new Error('El cliente no tiene tipo definido.');
    }
    const comanda = new ComandaModel(comandaData);
    const coleccion =
      comandaData.cliente.tipo === 'Empresa'
        ? COLECCION_EMPRESA
        : COLECCION_PARTICULAR;
    const docRef = await addDoc(collection(db, coleccion), comanda.toFirestore());
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar comanda:', error);
    throw error;
  }
};

export const escucharComandasPorRut = (rut, callback, onChangeEvent) => {
  const q = query(
    collection(db, COLECCION_EMPRESA),
    where('creadoPor.rut', '==', rut),
    orderBy('fechaCreacion', 'desc')
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const cambios = snapshot.docChanges().map(change => ({
      tipo: change.type,
      id: change.doc.id,
      datos: change.doc.data(),
    }));
    callback(data);
    if (onChangeEvent) onChangeEvent(cambios);
  });
  return unsubscribe;
};

export const escucharComandasPorRutPart = (rut, callback, onChangeEvent) => {
  const q = query(
    collection(db, COLECCION_PARTICULAR),
    where('creadoPor.rut', '==', rut),
    orderBy('fechaCreacion', 'desc')
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const cambios = snapshot.docChanges().map(change => ({
      tipo: change.type,
      id: change.doc.id,
      datos: change.doc.data(),
    }));
    callback(data);
    if (onChangeEvent) onChangeEvent(cambios);
  });
  return unsubscribe;
};

export const obtenerComandasPendientes = async () => {
    try {
        const q = query(collection(db, COMANDAS_COLECCION), where('estado', '==', 'Pendiente'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error al obtener comandas pendientes:', error);
        throw error;
    }
    };

export const obtenerNuevoNumeroOrdenPorTipo = async (tipoCliente) => {
  try {
    const prefix = tipoCliente === 'Empresa' ? 'EMP-' : 'PART-';
    const coleccion =
      tipoCliente === 'Empresa'
        ? COLECCION_EMPRESA
        : COLECCION_PARTICULAR;
    const snapshot = await getDocs(collection(db, coleccion));
    const totalComandas = snapshot.size;
    const nuevoNumero = totalComandas + 1;
    return `${prefix}${nuevoNumero}`;
  } catch (error) {
    console.error("Error al generar número de orden:", error);
    return null;
  }
};

export const handleLogout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.log("Error al cerrar sesión:", error);
    return { success: false, error };
  }
};

export const cancelarComanda = async (tipoCliente, id) => {
  try {
    const coleccion =
      tipoCliente === "Empresa"
        ? COLECCION_EMPRESA
        : COLECCION_PARTICULAR;
    const ref = doc(db, coleccion, id);
    await updateDoc(ref, { estado: "Cancelada" });
    return { success: true };
  } catch (error) {
    console.error("Error cancelando comanda:", error);
    return { success: false, error };
  }
};