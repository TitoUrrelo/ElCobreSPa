import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";

import {
  obtenerPrendas,
  actualizarPrenda,
  crearPrenda,
  actualizarEstadoPrenda,
} from "../control/prendaControl";

export default function PrendasParticularesScreen({ navigation }) {
  const [prendas, setPrendas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);

  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState("");

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrecioCrear, setNuevoPrecioCrear] = useState("");

  // cargar prendas
  useEffect(() => {
    cargarPrendas();
  }, []);

  const cargarPrendas = async () => {
    try {
      const data = await obtenerPrendas();
      setPrendas(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar las prendas.");
    }
  };

  const abrirEdicion = (prenda) => {
    setPrendaSeleccionada(prenda);
    setNuevoPrecio(prenda.precio.toString());
    setModalVisible(true);
  };

  const solicitarConfirmacion = () => {
    setConfirmVisible(true);
  };

  // actualizar precio
  const confirmarCambio = async () => {
    try {
      await actualizarPrenda(prendaSeleccionada.id, parseFloat(nuevoPrecio));
      setModalVisible(false);
      setConfirmVisible(false);
      cargarPrendas();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo actualizar el precio.");
    }
  };

  const cambiarEstado = async (prenda) => {
    try {
      await actualizarEstadoPrenda(prenda.id, !prenda.estado);
      cargarPrendas();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cambiar el estado de la prenda.");
    }
  };

  const crearNuevaPrenda = async () => {
    if (!nuevoNombre || !nuevoPrecioCrear) {
      Alert.alert("Error", "Complete el nombre y precio.");
      return;
    }

    try {
      await crearPrenda({
        tipo: nuevoNombre,
        precio: parseFloat(nuevoPrecioCrear),
      });

      setNuevoNombre("");
      setNuevoPrecioCrear("");
      setModalCrearVisible(false);

      cargarPrendas();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear la prenda.");
    }
  };

  const renderPrenda = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.prendaNombre}>{item.tipo}</Text>
        <Text style={styles.prendaPrecio}>${item.precio}</Text>
        <View>
          <Text style={{ color: item.estado ? "green" : "#cc0000", fontWeight: "bold" }}>
            {item.estado ? "Activo" : "Inactivo"}
          </Text>
        </View>
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => abrirEdicion(item)}
        >
          <Text style={styles.buttonTextWhite}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.stateButton,
            { backgroundColor: item.estado ? "#cc0000" : "#34C759" }
          ]}
          onPress={() => cambiarEstado(item)}
        >
          <Text style={styles.buttonTextWhite}>
            {item.estado ? "Desactivar" : "Activar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prendas Particulares</Text>

      <TouchableOpacity
        style={[styles.button, styles.backButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#34C759" }]}
        onPress={() => setModalCrearVisible(true)}
      >
        <Text style={[styles.buttonText, {color: '#fff'}]}>+ Crear Prenda</Text>
      </TouchableOpacity>

      <FlatList
        data={prendas}
        keyExtractor={(item) => item.id}
        renderItem={renderPrenda}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Precio</Text>
            <Text style={styles.modalLabel}>
              Prenda: {prendaSeleccionada?.tipo}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={nuevoPrecio}
              onChangeText={setNuevoPrecio}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#34C759" }]}
                onPress={solicitarConfirmacion}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "gray" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirmar cambio</Text>
            <Text style={styles.confirmText}>
              ¿Deseas actualizar "{prendaSeleccionada?.tipo}" a ${nuevoPrecio}?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#34C759" }]}
                onPress={confirmarCambio}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "gray" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={modalCrearVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Prenda</Text>
            <TextInput
              style={styles.input}
              placeholder="Tipo de prenda"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />
            <TextInput
              style={styles.input}
              placeholder="Precio"
              keyboardType="numeric"
              value={nuevoPrecioCrear}
              onChangeText={setNuevoPrecioCrear}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#34C759" }]}
                onPress={crearNuevaPrenda}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "gray" }]}
                onPress={() => setModalCrearVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff6600',
    marginBottom: 15,
    marginTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  cardInfo: { flexDirection: 'column' },
  prendaNombre: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  prendaPrecio: { color: '#666', marginTop: 4, fontSize: 15 },
  editButton: {
    backgroundColor: '#ff6600',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6600',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalLabel: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  confirmModal: {
    backgroundColor: '#fff',
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6600',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
    button: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10, 
  },
  backButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ff6600"
  },
  buttonText: {
    color: "#ff6600",
    fontWeight: "bold"
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prendaNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  prendaPrecio: {
    color: "#888",
    fontSize: 15,
    marginTop: 3,
  },
  estadoBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonTextWhite: {
    color: "#fff",
    fontWeight: "700",
  },
  editButton: {
    backgroundColor: "#ff6600",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
  },
  stateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
  },
});
