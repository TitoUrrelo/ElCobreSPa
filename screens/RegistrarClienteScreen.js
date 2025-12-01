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
  Modal,
} from 'react-native';

import { guardarCliente } from '../control/clienteControl';

export default function RegistrarClienteScreen({route, navigation }) {
  const { usuario } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    titulo: '',
    mensaje: '',
    botones: []
  });

  if (usuario.rol !== "administrador" && usuario.rol !== "recepcionista") {
  setTimeout(() => {
    Alert.alert(
      "Error de acceso",
      "Solo administradores o recepcionistas pueden registrar clientes.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  }, 100);
  return null;
}
  const tipoCliente = usuario.rol === "administrador" ? "Empresa" : "Particular";
  const [cliente, setCliente] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    correo: '',
    direccion: '',
  });

  const handleGuardar = async () => {
  try {
    if (usuario.rol !== "administrador" && usuario.rol !== "recepcionista") {
      mostrarModal(
        "Error de acceso",
        "Solo administradores o recepcionistas pueden guardar clientes."
      );
      return;
    }
    if (!cliente.nombre.trim()) {
      mostrarModal("Error", "El nombre es obligatorio");
      return;
    }
    if (!cliente.rut.trim()) {
      mostrarModal("Error", "El RUT es obligatorio");
      return;
    }
    if (!cliente.telefono.trim()) {
      mostrarModal("Error", "El teléfono es obligatorio");
      return;
    }
    if (!cliente.correo.trim()) {
      mostrarModal("Error", "El correo es obligatorio");
      return;
    }

    const resultadoTelefono = validarTelefono(cliente.telefono);
    if (resultadoTelefono !== true) {
      mostrarModal("Error", resultadoTelefono);
      return;
    }

    const resultadoCorreo = validarCorreo(cliente.correo);
    if (resultadoCorreo !== true) {
      mostrarModal("Error", resultadoCorreo);
      return;
    }

    const tipoCliente = usuario.rol === "administrador" ? "Empresa" : "Particular";
    const clienteConTipo = {
      ...cliente,
      tipo: tipoCliente,
    };

    const id = await guardarCliente(clienteConTipo);
    
    mostrarModal('Éxito', `Cliente guardado correctamente`, [
      {
        text: 'OK',
        onPress: () => {
          cerrarModal();
          setCliente({ nombre: '', rut: '', telefono: '', correo: '', direccion: '' });
        }
      }
    ]);
  } catch (e) {
    mostrarModal('Error', e.message);
  }
};

const mostrarModal = (titulo, mensaje, botones = [{ text: 'OK', onPress: () => {} }]) => {
  setModalConfig({ titulo, mensaje, botones });
  setModalVisible(true);
};

  const cerrarModal = () => {
    setModalVisible(false);
  };

  const validarTelefono = (telefono) => {

  const telefonoLimpio = telefono.replace(/[\s-]/g, '');
  
  if (telefonoLimpio.length !== 9) {
    return 'El teléfono debe tener 9 dígitos';
  }
  
  if (!telefonoLimpio.startsWith('9')) {
    return 'El teléfono debe comenzar con 9';
  }
  
  if (!/^\d+$/.test(telefonoLimpio)) {
    return 'El teléfono solo debe contener números';
  }
  
  return true;
};

const validarCorreo = (correo) => {
  const correoTrimmed = correo.trim();
  
  if (!correoTrimmed) {
    return 'El correo es obligatorio';
  }
  
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!regexCorreo.test(correoTrimmed)) {
    return 'Ingrese un correo válido (debe contener @ y un dominio válido)';
  }
  
  return true;
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
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
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>{modalConfig.titulo}</Text>
            <Text style={styles.modalMensaje}>{modalConfig.mensaje}</Text>
            <View style={styles.modalBotones}>
              {modalConfig.botones.map((boton, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalBoton,
                    modalConfig.botones.length === 1 && styles.modalBotonPrimario
                  ]}
                  onPress={() => {
                    cerrarModal();
                    if (boton.onPress) boton.onPress();
                  }}
                >
                  <Text style={[
                    styles.modalBotonTexto,
                    modalConfig.botones.length === 1 && styles.modalBotonTextoPrimario
                  ]}>
                    {boton.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 40,
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff6600ff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#ff6600ff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff6600ff',
    textAlign: 'center',
    marginBottom: 20,
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  modalMensaje: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6600ff',
    alignItems: 'center',
  },
  modalBotonPrimario: {
    backgroundColor: '#ff6600ff',
    borderColor: '#ff6600ff',
  },
  modalBotonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6600ff',
  },
  modalBotonTextoPrimario: {
    color: 'white',
  },
});