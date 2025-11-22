import { db } from "../firebaseConfig";
import { 
  collection, getDocs, addDoc, updateDoc, doc, query, where, onSnapshot
} from "firebase/firestore";

import PrecioEmpresaModel from "../models/prendaEmpresaModel";

const PRECIOS_EMPRESA_COLECCION = "prendasEmpresas_equipo_5";
const CLIENTES_COLECCION = "clientes_equipo_5";
const PRENDAS_COLECCION = "prendas_equipo_5";

//const PRECIOS_EMPRESA_COLECCION = "PrendasEmpresas";
//const CLIENTES_COLECCION = "clientes";
//const PRENDAS_COLECCION = "Prendas";

export async function obtenerEmpresas() {
  const q = query(collection(db, CLIENTES_COLECCION), where("tipo", "==", "Empresa"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function obtenerPrendas() {
  const snapshot = await getDocs(collection(db, PRENDAS_COLECCION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function obtenerPreciosEmpresa(rutEmpresa) {
  const q = query(
    collection(db, PRECIOS_EMPRESA_COLECCION),
    where("rut", "==", rutEmpresa)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  const data = d.data();
  const prendasOrdenadas = data.prendas.sort((a, b) =>
    (a.tipo || "").localeCompare(b.tipo || "")
  );
  return new PrecioEmpresaModel({
    id: d.id,
    ...data,
    prendas: prendasOrdenadas
  });
}

export async function crearPreciosEmpresa(nombreEmpresa, rutEmpresa, prendasNuevas) {
  const q = query(
    collection(db, PRECIOS_EMPRESA_COLECCION),
    where("rut", "==", rutEmpresa)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    const modelo = new PrecioEmpresaModel({
      nombre: nombreEmpresa,
      rut: rutEmpresa,
      prendas: prendasNuevas.map(p => ({
        idPrenda: p.id,
        tipo: p.tipo,
        precio: p.precio,
        estado: p.estado,
      }))
    });
    await addDoc(collection(db, PRECIOS_EMPRESA_COLECCION), modelo.toFirestore());
    return;
  }
  const d = snapshot.docs[0];
  const ref = doc(db, PRECIOS_EMPRESA_COLECCION, d.id);
  const prendasActuales = d.data().prendas;
  const nuevasPrendasUnicas = prendasNuevas.filter(
    nueva => !prendasActuales.some(p => p.idPrenda === nueva.id)
  );
  const prendasFinal = [
    ...prendasActuales,
    ...nuevasPrendasUnicas.map(p => ({
      idPrenda: p.id,
      tipo: p.tipo,
      precio: p.precio,
    }))
  ];
  await updateDoc(ref, { prendas: prendasFinal });
}

export async function actualizarPrecioEmpresa(idDoc, idPrenda, nuevoPrecio) {
  const ref = doc(db, PRECIOS_EMPRESA_COLECCION, idDoc);
  const snapshot = await getDocs(collection(db, PRECIOS_EMPRESA_COLECCION));
  const docData = snapshot.docs.find(d => d.id === idDoc).data();
  const nuevasPrendas  = docData.prendas.map((p) =>
    p.idPrenda === idPrenda ? { ...p, precio: nuevoPrecio } : p
  );
  await updateDoc(ref, { prendas: nuevasPrendas  });
}

export async function crearPreciosEmpresaConSeleccion(empresa, prendasSeleccionadas) {
  const modelo = new PrecioEmpresaModel({
    nombre: empresa.nombre,
    rut: empresa.rut,
    prendas: prendasSeleccionadas.map(p => ({
      idPrenda: p.id,
      tipo: p.tipo,
      precio: p.precio,
    }))
  });
  const ref = await addDoc(
    collection(db, PRECIOS_EMPRESA_COLECCION),
    modelo.toFirestore()
  );
  return ref.id;
}

export async function actualizarEstadoPrendaEmpresa(idDoc, idPrenda, nuevoEstado) {
  const ref = doc(db, PRECIOS_EMPRESA_COLECCION, idDoc);

  // obtener doc
  const snapshot = await getDocs(collection(db, PRECIOS_EMPRESA_COLECCION));
  const docData = snapshot.docs.find(d => d.id === idDoc).data();

  // actualizar estado solo en la prenda indicada
  const nuevasPrendas = docData.prendas.map((p) =>
    p.idPrenda === idPrenda ? { ...p, estado: nuevoEstado } : p
  );

  await updateDoc(ref, { prendas: nuevasPrendas });
}