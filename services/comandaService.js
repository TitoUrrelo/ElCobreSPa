import { db } from "../firebaseConfig";
import { ref, push, set } from "firebase/database";

export const guardarComanda = async (comanda) => {
  console.log("🟢 guardarComanda() ejecutado, comanda:", comanda);
  try {
    // Crear referencia a la colección 'comandas'
    const comandasRef = ref(db, "comandas");

    // Generar un nuevo ID único y guardar
    const nuevaComandaRef = push(comandasRef);
    await set(nuevaComandaRef, {
      ...comanda,
      fechaCreacion: new Date().toISOString(),
    });

    console.log("✅ Comanda guardada con ID:", nuevaComandaRef.key);
    return nuevaComandaRef.key;
  } catch (error) {
    console.error("❌ Error al guardar comanda:", error);
    throw error;
  }
};