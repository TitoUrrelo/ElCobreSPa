import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where  } from 'firebase/firestore';
import ClienteModel from '../models/clienteModel';

const CLIENTES_COLECCION = 'clientes';

function rutTieneGuion(rut) {
  return /^[0-9]+-[0-9Kk]$/.test(rut);
}

function validarRutPersona(rut) {
  if (!rutTieneGuion(rut)) return "NO_GUION";
  const limpio = rut.replace(/\./g, "").toUpperCase();
  const [cuerpo, dv] = limpio.split("-");
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo[i]);
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvFinal =
    dvEsperado === 11 ? "0" :
    dvEsperado === 10 ? "K" :
    dvEsperado.toString();
  if (dvFinal !== dv) return "INVALIDO";
  return true;
}

function validarRutEmpresa(rut) {
  const personaValida = validarRutPersona(rut);
  if (personaValida !== true) return personaValida;
  const cuerpo = parseInt(rut.split("-")[0]);
  if (cuerpo < 50000000) return "NO_EMPRESA";
  return true;
}

async function rutDuplicado(rut) {
  const q = query(
    collection(db, CLIENTES_COLECCION),
    where("rut", "==", rut)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

async function correoDuplicado(correo) {
  const q = query(
    collection(db, CLIENTES_COLECCION),
    where("correo", "==", correo)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function guardarCliente(clienteData) {
  const clienteModel = new ClienteModel(clienteData);
  if (!clienteModel.esValido()) {
    throw new Error("Datos incompletos");
  }
  const { rut, tipo } = clienteData;
  let resultadoRut =
    tipo === "Empresa"
      ? validarRutEmpresa(rut)
      : validarRutPersona(rut);
  if (resultadoRut === "NO_GUION") {
    throw new Error("El RUT debe incluir el guion. Ejemplo: 12345678-9");
  }
  if (resultadoRut === "INVALIDO") {
    throw new Error("El RUT ingresado no es válido");
  }
  if (resultadoRut === "NO_EMPRESA") {
    throw new Error("El RUT ingresado no corresponde a una EMPRESA");
  }
  if (await rutDuplicado(rut)) {
    throw new Error("Ya existe un cliente registrado con este RUT.");
  }
  if (await correoDuplicado(clienteData.correo)) {
    throw new Error("Ya existe un cliente registrado con este CORREO.");
  }
  const data = clienteModel.toFirestore();
  const docRef = await addDoc(collection(db, CLIENTES_COLECCION), data);
  return docRef.id;
}

export async function obtenerClientes() {
  const snapshot = await getDocs(collection(db, CLIENTES_COLECCION));
  const clientes = [];
  snapshot.forEach((doc) => {
    clientes.push({
      id: doc.id,
      ...doc.data(),
    });
  });
  return clientes;
}

export async function obtenerClientesPorTipo(tipo) {
  try {
    const q = query(
      collection(db, CLIENTES_COLECCION),
      where("tipo", "==", tipo)
    );
    const snapshot = await getDocs(q);
    const clientes = [];
    snapshot.forEach((doc) => {
      clientes.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return clientes.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  } catch (e) {
    console.error("Error obteniendo clientes filtrados:", e);
    throw e;
  }
}