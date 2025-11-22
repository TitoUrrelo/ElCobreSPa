import UsuarioModel from "../models/usuarioModel";
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  setDoc,
  getDocs  } from "firebase/firestore";

const USUARIOS_COLECCION = "usuarios";

export async function createUser({ nombre, correo, rut, numero, password, rol }) {
  try {
    console.log("Creando usuario...");
    const userCred = await createUserWithEmailAndPassword(auth, correo, password);
    const user = userCred.user;
    console.log("Usuario creado en Auth:", user.uid);
    const usuario = new UsuarioModel({
      nombre,
      correo,
      rut,
      numero,
      rol,
    });
    await setDoc(doc(db, USUARIOS_COLECCION, user.uid), usuario.toFirestore());
    console.log("Datos del usuario guardados en Firestore");
    await sendEmailVerification(user);
    console.log("Email enviado para verificación");
    return { success: true };
  } catch (error) {
    console.log("Error en createUser:", error.message);
    return { success: false, error: error.message };
  }
}

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
  return dvFinal === dv ? true : "INVALIDO";
}

async function rutDuplicadoUsuarios(rut) {
  console.log("Buscando RUT:", rut);
  const q = query(
    collection(db, USUARIOS_COLECCION),
    where("rut", "==", rut)
  );
  const snapshot = await getDocs(q);
  console.log("Documentos encontrados:", snapshot.size);
  return !snapshot.empty;
}

async function correoDuplicadoUsuarios(correo) {
  console.log("Buscando correo:", correo);
  const q = query(
    collection(db, USUARIOS_COLECCION),
    where("correo", "==", correo)
  );
  const snapshot = await getDocs(q);
  console.log("Documentos encontrados:", snapshot.size);
  return !snapshot.empty;
}

export async function handleCreateUser(nombre, correo, rut, numero, password, rol) {
  console.log("Inicio creación usuario");
  if (!nombre || !correo || !rut || !numero || !password || !rol) {
    console.log("Faltan campos");
    return { success: false, message: "Debes completar todos los campos." };
  }
  console.log("Validando RUT...");
  let validacion = validarRutPersona(rut);
  console.log("Resultado validación RUT:", validacion);
  if (validacion === "NO_GUION") {
    return { success: false, message: "El RUT debe incluir guion. Ej: 12345678-9" };
  }
  if (validacion === "INVALIDO") {
    return { success: false, message: "El RUT es inválido" };
  }
  console.log("Verificando duplicado...");
  const existe = await rutDuplicadoUsuarios(rut);
  console.log("¿Existe RUT?:", existe);
  if (existe) {
    return { success: false, message: "Este RUT ya está registrado como usuario." };
  }
  console.log("Verificando correo duplicado...");
  const existeCorreo = await correoDuplicadoUsuarios(correo);
  if (existeCorreo) {
    return { success: false, message: "Este CORREO ya está registrado como usuario." };
  }
  console.log("Llamando a createUser()...");
  const result = await createUser({
    nombre,
    correo,
    rut,
    numero,
    password,
    rol,
  });
  console.log("Resultado createUser:", result);
  if (!result.success) {
    return { success: false, message: result.error };
  }
  return {
    success: true,
    message: "Usuario creado correctamente. Debe verificar su correo antes de iniciar sesión.",
  };
}

export async function handleLogin(email, password) {
  console.log("Iniciando sesión en Firebase Auth...");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Sesión iniciada. UID:", user.uid);
    const ref = doc(db, USUARIOS_COLECCION, user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.log("Usuario no encontrado en Firestore");
      return {
        success: false,
        message: "No se encontró la información del usuario.",
      };
    }
    const userData = snap.data();
    console.log("Datos Firestore:", userData);
    if (!user.emailVerified) {
  return {
    success: false,
    message: "Tu correo no está verificado. Revisa tu bandeja o solicita reenviar verificación.",
    needsVerification: true,
    email: user.email
  };
}
    return {
      success: true,
      user: {
        uid: user.uid,
        nombre: userData.nombre,
        correo: userData.correo,
        numero: userData.numero,
        rut: userData.rut,
        rol: userData.rol,
      },
    };
  } catch (error) {
    console.log("Error:", error);
    let mensaje = "Error al iniciar sesión.";
    if (error.code === "auth/invalid-credential") {
      mensaje = "Credenciales incorrectas. Verifica correo y contraseña.";
    }
    if (error.code === "auth/user-not-found") {
      mensaje = "El usuario no existe.";
    }
    if (error.code === "auth/wrong-password") {
      mensaje = "Contraseña incorrecta.";
    }
    return {
      success: false,
      message: mensaje,
    };
  }
}

export async function handlePasswordReset(email) {
  if (!email || email.trim() === "") {
    return {
      success: false,
      message: "Por favor, ingresa tu correo para recuperar la contraseña.",
    };
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: `Se envió un correo a ${email} para restablecer tu contraseña.`,
    };
  } catch (error) {
    console.log("Error al enviar correo de recuperación:", error);
    let msg = "No se pudo enviar el correo.";
    if (error.code === "auth/user-not-found") {
      msg = "No existe un usuario con ese correo.";
    }
    return { success: false, message: msg };
  }
}

export const actualizarUsuario = async ({ nombre, correo, numero, contraseñaActual }) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No hay usuario autenticado.");
    const correoLimpio = correo.trim();
    const correoActual = user.email;
    const cambioCorreo = correoLimpio !== correoActual;
    if (cambioCorreo) {
      if (!contraseñaActual || contraseñaActual.trim() === "") {
        return { ok: false, requierePassword: true };
      }
      const cred = EmailAuthProvider.credential(correoActual, contraseñaActual);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, correoLimpio);
      await sendEmailVerification(user);
    }
    await updateDoc(doc(db, USUARIOS_COLECCION, user.uid), {
      nombre: nombre.trim(),
      correo: correoLimpio,
      numero
    });
    if (cambioCorreo) {
      await signOut(auth);
      return { ok: true, cerroSesion: true };
    }
    return { ok: true, cerroSesion: false };
  } catch (error) {
    console.log("Error al actualizar:", error);
    return { ok: false, error: error.message };
  }
};