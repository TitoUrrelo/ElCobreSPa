import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import {
  obtenerEmpresas,
  obtenerPrendas,
  obtenerPreciosEmpresa,
  crearPreciosEmpresa,
  actualizarPrecioEmpresa,
  actualizarEstadoPrendaEmpresa,
} from "../control/prendaEmpresaControl";

export default function PrendasEmpresasScreen({ navigation }) {

  const [listaEmpresas, setListaEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  const [prendasDisponibles, setPrendasDisponibles] = useState([]);
  const [prendasSeleccionadas, setPrendasSeleccionadas] = useState([]);

  const [preciosEmpresa, setPreciosEmpresa] = useState([]);
  const [idDocumentoPrecios, setIdDocumentoPrecios] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSeleccionPrendas, setModalSeleccionPrendas] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');


  // cargar  empresas
  useEffect(() => {
    async function cargarEmpresas() {
      const empresas = await obtenerEmpresas();
      setListaEmpresas(empresas);

      if (empresas.length > 0) {
        setEmpresaSeleccionada(listaEmpresas[0].rut)
      }
    }
    cargarEmpresas();
  }, []);


  // cargar datos
  const cargarDatos = async () => {
    const todas = await obtenerPrendas();
    todas.sort((a, b) => (a.tipo || "").localeCompare(b.tipo || ""));
    let precios = await obtenerPreciosEmpresa(empresaSeleccionada);

    if (!precios) {
      setIdDocumentoPrecios(null);
      setPreciosEmpresa([]);
      setPrendasDisponibles(todas);
      return;
    }

    setIdDocumentoPrecios(precios.id);
    setPreciosEmpresa(precios.prendas);

    // filtro prendas
    const idsAsignados = precios.prendas.map(p => p.idPrenda);
    const filtradas = todas.filter(p => !idsAsignados.includes(p.id));

    setPrendasDisponibles(filtradas);
  };

  useEffect(() => {
    if (empresaSeleccionada) {
      cargarDatos();
    }
  }, [empresaSeleccionada]);

  const abrirEdicion = (prenda) => {
    setPrendaSeleccionada(prenda);
    setNuevoPrecio(prenda.precio.toString());
    setModalVisible(true);
  };

  const confirmarCambio = async () => {
    await actualizarPrecioEmpresa(
      idDocumentoPrecios,
      prendaSeleccionada.idPrenda,
      parseFloat(nuevoPrecio)
    );

    const nuevosPrecios = preciosEmpresa.map((p) =>
      p.idPrenda === prendaSeleccionada.idPrenda
        ? { ...p, precio: parseFloat(nuevoPrecio) }
        : p
    );

    setPreciosEmpresa(nuevosPrecios);
    setConfirmVisible(false);
    setModalVisible(false);
  };

  const guardarPrendasSeleccionadas = async () => {
    if (prendasSeleccionadas.length === 0) {
      Alert.alert("Error", "Debe seleccionar al menos una prenda.");
      return;
    }

    const empresa = listaEmpresas.find(e => e.rut === empresaSeleccionada);

    await crearPreciosEmpresa(
      empresa.nombre,
      empresa.rut,
      prendasSeleccionadas
    );

    await cargarDatos();

    setPrendasSeleccionadas([]); 
    setModalSeleccionPrendas(false);
  };

  const cambiarEstado = async (prenda) => {
    const nuevoEstado = !prenda.estado;

    await actualizarEstadoPrendaEmpresa(
      idDocumentoPrecios,
      prenda.idPrenda,
      nuevoEstado
    );

    const nuevas = preciosEmpresa.map((p) =>
      p.idPrenda === prenda.idPrenda ? { ...p, estado: nuevoEstado } : p
    );

    setPreciosEmpresa(nuevas);
  };

  const renderPrenda = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.prendaNombre}>{item.tipo}</Text>
        <Text style={styles.prendaPrecio}>${item.precio}</Text>
        <Text style={{ color: item.estado ? "green" : "red", marginTop: 4 }}>
          {item.estado ? "Activo" : "Inactivo"}
        </Text>
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
      <Text style={styles.title}>Precios por Empresa</Text>
      <TouchableOpacity
        style={[styles.button, styles.backButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Seleccionar Empresa</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={empresaSeleccionada}
            onValueChange={(v) => setEmpresaSeleccionada(v)}
            style={styles.picker}
          >
            <Picker.Item label="Seleccione Empresa" value={null} />
            {listaEmpresas.map((e) => (
              <Picker.Item key={e.id} label={e.nombre} value={e.rut} />
            ))}
          </Picker>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalSeleccionPrendas(true)}
      >
        <Text style={styles.addButtonText}>Seleccionar Prendas</Text>
      </TouchableOpacity>
      <FlatList
        data={preciosEmpresa}
        keyExtractor={(item) => item.idPrenda}
        renderItem={renderPrenda}
      />
      <Modal visible={modalSeleccionPrendas} transparent animationType="fade">
        <View style={styles.selectOverlay}>
          <View style={styles.selectModal}>
            <Text style={styles.modalTitle}>Seleccionar Prendas</Text>
            {prendasDisponibles.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 16, color: "#555" }}>
                  No hay prendas para seleccionar
                </Text>
              </View>
            ) : (
              <FlatList
                data={prendasDisponibles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.selectItem,
                      prendasSeleccionadas.includes(item) && styles.selectItemActive
                    ]}
                    onPress={() => {
                      if (prendasSeleccionadas.includes(item)) {
                        setPrendasSeleccionadas(
                          prendasSeleccionadas.filter(p => p.id !== item.id)
                        );
                      } else {
                        setPrendasSeleccionadas([...prendasSeleccionadas, item]);
                      }
                    }}
                  >
                    <Text style={{ color: "#333" }}>{item.tipo}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={guardarPrendasSeleccionadas}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: "gray", marginTop: 10 }]}
              onPress={() => setModalSeleccionPrendas(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Precio</Text>
            <Text style={styles.modalLabel}>
              {prendaSeleccionada?.tipo}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={nuevoPrecio}
              onChangeText={setNuevoPrecio}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => setConfirmVisible(true)}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: "gray" }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.selectOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.modalTitle}>Confirmar cambio</Text>
            <Text style={styles.modalLabel}>
              ¿Actualizar precio a ${nuevoPrecio}?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1 }]}
                onPress={confirmarCambio}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: "gray", flex: 1 }]}
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
  container: { flex: 1, padding: 20, backgroundColor: "#f4f4f4" },
  title: { fontSize: 22, fontWeight: "bold", color: "#ff6600", marginBottom: 10,marginTop: 30, },
  pickerContainer: { marginBottom: 10 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: { height: 50 },
  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center"
  },
  backButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ff6600"
  },
  buttonText: { color: "#ff6600", fontWeight: "bold" },

  addButton: {
    backgroundColor: "#ff6600",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prendaNombre: { fontSize: 16, fontWeight: "bold" },
  prendaPrecio: { color: "#888" },
  editButton: {
    backgroundColor: "#ff6600",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: { color: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#ff6600", textAlign: "center" },
  modalLabel: { marginVertical: 10, fontSize: 16 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 8,
    marginBottom: 20,
  },

  saveButton: {
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  modalButtonText: { color: "#fff", fontWeight: "bold" },

  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectModal: {
    backgroundColor: "#fff",
    width: "80%",
    maxHeight: "80%",
    padding: 20,
    borderRadius: 12,
  },
  selectItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 6,
  },
  selectItemActive: {
    backgroundColor: "#ff660022",
    borderColor: "#ff6600",
  },

  confirmModal: {
    backgroundColor: "#fff",
    padding: 20,
    width: "75%",
    borderRadius: 12,
  },

  confirmButtons: {
    flexDirection: "row",
    gap: 10
  },
  stateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  stateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },

  buttonTextWhite: {
    color: "#fff",
    fontWeight: "bold",
  },

  editButton: {
    backgroundColor: "#ff6600",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },

  stateButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
});
