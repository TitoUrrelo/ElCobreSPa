import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import ClienteModel from '../models/clienteModel';

const CLIENTES_COLLECTION = 'clientes';

export async function guardarCliente(clienteData) {
  const clienteModel = new ClienteModel(clienteData);

  if (!clienteModel.esValido()) {
    throw new Error('Datos incompletos: revisa los campos obligatorios.');
  }

  const data = clienteModel.toFirestore();

  const docRef = await addDoc(collection(db, CLIENTES_COLLECTION), data);
  return docRef.id;
}