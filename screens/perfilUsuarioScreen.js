import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { actualizarUsuario } from "../control/loginControl";

export default function PerfilScreen({ route, navigation }) {
  const { usuario, actualizarMenu } = route.params;

  const [nombre, setNombre] = useState(usuario.nombre);
  const [correo, setCorreo] = useState(usuario.correo);
  const [numero, setNumero] = useState(usuario.numero);
  const [contraseñaActual, setContraseñaActual] = useState("");

  const guardarCambios = async () => {
  console.log("Guardando cambios...");

  const result = await actualizarUsuario({
    nombre,
    correo,
    numero,
    contraseñaActual,
  });

  console.log("RESULTADO actualizarUsuario:", result);

  if (result?.requierePassword) {
    Alert.alert(
      "Contraseña requerida",
      "Debes ingresar tu contraseña actual para cambiar el correo."
    );
    return;
  }
  if (!result?.ok) {
    Alert.alert("Error", result.error || "No se pudo actualizar");
    return;
  }

  if (result.cerroSesion) {
    Alert.alert(
      "Correo actualizado",
      "Tu correo fue cambiado. Te enviamos un correo de verificación. Debes volver a iniciar sesión."
    );
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
    return;
  }

  if (!result.cerroSesion) {
    Alert.alert(
      "Cambios guardados",
      "Los cambios se actualizaron correctamente, pero debes volver a iniciar sesión para verlos reflejados en toda la app."
    );
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
    return;
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
      />
      <TextInput
        style={styles.input}
        placeholder="Número"
        value={numero}
        keyboardType="numeric"
        onChangeText={setNumero}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña actual (solo si cambia correo)"
        secureTextEntry
        value={contraseñaActual}
        onChangeText={setContraseñaActual}
      />
      <TouchableOpacity style={styles.btnGuardar} onPress={guardarCambios}>
        <Text style={styles.btnText}>Guardar cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  btnGuardar: {
    backgroundColor: "#ff6600",
    padding: 15,
    borderRadius: 10,
  },
  btnText: { textAlign: "center", color: "#fff", fontSize: 18 },
});