import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Button, Alert, 
  TouchableOpacity, ScrollView 
} from 'react-native';
import { handleCreateUser } from '../control/loginControl';

// 🔹 Generador de contraseña automática (8 caracteres)
function generarPasswordTemporal() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default function CreateUserScreen() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rut, setRut] = useState("");
  const [numero, setNumero] = useState("");
  const [rol, setRol] = useState("Administrador");

  const onCreateUser = async () => {
    console.log("Iniciando creación");

    const passwordGenerada = generarPasswordTemporal();
    console.log("Contraseña generada:", passwordGenerada);

    const result = await handleCreateUser(
      nombre, 
      correo, 
      rut, 
      numero, 
      passwordGenerada,
      rol
    );

    if (!result.success) {
      Alert.alert("Error", result.message);
      return;
    }

    Alert.alert(
      "Usuario creado",
      `Debe verificar su correo y cambiar la contraseña para iniciar sesión.`
    );

    setNombre("");
    setCorreo("");
    setRut("");
    setNumero("");
    setRol("Administrador");
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Crear Usuario</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="RUT"
          value={rut}
          onChangeText={setRut}
        />

        <TextInput
          style={styles.input}
          placeholder="Número de teléfono"
          value={numero}
          onChangeText={setNumero}
          keyboardType="phone-pad"
        />

        {/* Roles */}
        <View style={styles.roleContainer}>
          <Text style={styles.label}>Rol del usuario</Text>

          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleBtn, rol === "Administrador" && styles.roleBtnActive]}
              onPress={() => setRol("Administrador")}
            >
              <Text style={[styles.roleText, rol === "Administrador" && styles.roleTextActive]}>
                Administrador
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, rol === "Recepcionista" && styles.roleBtnActive]}
              onPress={() => setRol("Recepcionista")}
            >
              <Text style={[styles.roleText, rol === "Recepcionista" && styles.roleTextActive]}>
                Recepcionista
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button title="Crear Usuario" onPress={onCreateUser} color="#ff6600" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f7fa",
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "bold",
    color: "#333",
    fontSize: 16
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: "column",
    gap: 10,
  },
  roleBtn: {
    width: "100%",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  roleBtnActive: {
    backgroundColor: "#ff6600",
    borderColor: "#ff6600",
  },
  roleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    flexWrap: "nowrap",
  },
  roleTextActive: {
    color: "#fff",
  }
});
