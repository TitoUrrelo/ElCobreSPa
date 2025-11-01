import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';

export default function PrendasParticularesScreen() {
  const [prendas, setPrendas] = useState([
    { id: 1, nombre: 'Camisa', precio: 1500 },
    { id: 2, nombre: 'Pantalón', precio: 2000 },
    { id: 3, nombre: 'Chaqueta', precio: 3000 },
    { id: 4, nombre: 'Vestido', precio: 2500 },
    { id: 5, nombre: 'Blusa', precio: 1800 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  const abrirEdicion = (prenda) => {
    setPrendaSeleccionada(prenda);
    setNuevoPrecio(prenda.precio.toString());
    setModalVisible(true);
  };

  const solicitarConfirmacion = () => {
    setConfirmVisible(true);
  };

  const confirmarCambio = () => {
    const prendasActualizadas = prendas.map((p) =>
      p.id === prendaSeleccionada.id
        ? { ...p, precio: parseFloat(nuevoPrecio) }
        : p
    );
    setPrendas(prendasActualizadas);
    setConfirmVisible(false);
    setModalVisible(false);
  };

  const renderPrenda = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.prendaNombre}>{item.nombre}</Text>
        <Text style={styles.prendaPrecio}>${item.precio.toLocaleString()}</Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => abrirEdicion(item)}
      >
        <Text style={styles.editButtonText}>✏️ Editar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prendas Particulares</Text>

      <FlatList
        data={prendas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPrenda}
        contentContainerStyle={{ paddingBottom: 50 }}
      />

      {/* Modal principal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Precio</Text>
            <Text style={styles.modalLabel}>
              Prenda: {prendaSeleccionada?.nombre}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={nuevoPrecio}
              onChangeText={setNuevoPrecio}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#34C759' }]}
                onPress={solicitarConfirmacion}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: 'gray' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación sobre el modal principal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirmar cambio</Text>
            <Text style={styles.confirmText}>
              ¿Deseas actualizar el precio de "{prendaSeleccionada?.nombre}" a ${nuevoPrecio}?
              {"\n"}Este cambio afectará las comandas futuras de clientes particulares.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#34C759', flex: 1 }]}
                onPress={confirmarCambio}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: 'gray', flex: 1 }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff6600',
    marginBottom: 15,
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
});
