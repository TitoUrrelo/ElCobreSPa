import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { guardarCliente } from '../control/clienteControl';

export default function RegistrarClienteScreen({route, navigation }) {
  const { usuario } = route.params;
  const tipoCliente = usuario.rol === "Administrador" ? "Empresa" : "Particular";
  const [cliente, setCliente] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    correo: '',
    direccion: '',
  });

  // registrar clienteS
  const handleGuardar = async () => {
  try {
    const tipoCliente = usuario.rol === "Administrador" ? "Empresa" : "Particular";

    const clienteConTipo = {
      ...cliente,
      tipo: tipoCliente,
    };

    const id = await guardarCliente(clienteConTipo);

    Alert.alert('Éxito', `Cliente guardado correctamente`);
    setCliente({ nombre: '', rut: '', telefono: '', correo: '', direccion: '' });
  } catch (e) {
    Alert.alert('Error', e.message);
    console.log('No se pudo guardar cliente:', e.message);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Registrar Cliente ({tipoCliente})</Text>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Juan Pérez"
          value={cliente.nombre}
          onChangeText={(text) => setCliente({ ...cliente, nombre: text })}
        />
        <Text style={styles.label}>RUT</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 12345678-9"
          value={cliente.rut}
          onChangeText={(text) => setCliente({ ...cliente, rut: text })}
        />
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="9 1234 5678"
          keyboardType="phone-pad"
          value={cliente.telefono}
          onChangeText={(text) => setCliente({ ...cliente, telefono: text })}
        />
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          value={cliente.correo}
          onChangeText={(text) => setCliente({ ...cliente, correo: text })}
        />
        <Text style={styles.label}>Dirección (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Calle, número"
          value={cliente.direccion}
          onChangeText={(text) => setCliente({ ...cliente, direccion: text })}
        />
        <TouchableOpacity style={styles.button} onPress={handleGuardar}>
          <Text style={styles.buttonText}>Guardar Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: '#ff6600ff' }]}>← Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff6600ff',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ff6600ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6600ff',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
