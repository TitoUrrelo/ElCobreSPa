import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import PrendaModel from "../models/prendaModel";

const PRENDAS_COLECCION = "prendas_equipo_5";
//const PRENDAS_COLECCION = "Prendas";

export async function obtenerPrendas() {
  const snapshot = await getDocs(collection(db, PRENDAS_COLECCION));
  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return new PrendaModel({
        id: d.id,
        ...data,
        estado: data.estado ?? true
      });
    })
    .sort((a, b) => a.tipo.localeCompare(b.tipo));
}

export async function crearPrenda(dataPlano) {
  const prendaModel = new PrendaModel(dataPlano);
  await addDoc(collection(db, PRENDAS_COLECCION), prendaModel.toFirestore());
}

export async function actualizarPrenda(id, nuevoPrecio) {
  const ref = doc(db, PRENDAS_COLECCION, id);
  await updateDoc(ref, { precio: nuevoPrecio });
}

export async function actualizarEstadoPrenda(id, nuevoEstado) {
  const ref = doc(db, PRENDAS_COLECCION, id);
  await updateDoc(ref, { estado: nuevoEstado });
}