import React,  { useState,useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { crearComanda, obtenerUltimaComandaPorTipo,obtenerNuevoNumeroOrdenPorTipo } from '../control/comandaControl';
import { obtenerClientesPorTipo } from '../control/clienteControl';
import { obtenerPrendas } from '../control/prendaControl';
import { obtenerPreciosEmpresa } from '../control/prendaEmpresaControl';

export default function CrearComandaScreen({ route, navigation }) {
  const { usuario } = route.params;
  const [clientes, setClientes] = useState([]);
  const [tiposPrendas, setTiposPrendas] = useState([]);

  const [loading, setLoading] = useState(false);

  const handleEliminarPrenda = (index) => {
  const nuevas = prendas.filter((_, i) => i !== index);
  setPrendas(nuevas);
};

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        if (!usuario || !usuario.rol) {
          console.log("No se recibió administrador o rol");
          return;
        }
        let tipoFiltro = "";
        if (usuario.rol === "Administrador") {
          tipoFiltro = "Empresa";
        } else if (usuario.rol === "Recepcionista") {
          tipoFiltro = "Particular";
        } else {
          Alert.alert("Error", "Rol no reconocido");
          return;
        }
        const data = await obtenerClientesPorTipo(tipoFiltro);
        setClientes(data);
      } catch (e) {
        console.error("Error al obtener clientes filtrados:", e);
        Alert.alert("Error", "No se pudieron cargar los clientes.");
      }
    };
    cargarClientes();
  }, [usuario]);

  useEffect(() => {
  const cargarPrendas = async () => {
    try {
      if (usuario.rol === "Recepcionista") {
        const data = await obtenerPrendas();
        setTiposPrendas(data);
        return;
      }
      if (usuario.rol === "Administrador") {
        if (!clienteSeleccionado) {
          setTiposPrendas([]);
          return;
        }
        const empresaRut = clienteSeleccionado.rut;
        const preciosEmpresa = await obtenerPreciosEmpresa(empresaRut);
        if (!preciosEmpresa) {
          Alert.alert(
            "Aviso",
            `La empresa "${clienteSeleccionado.nombre}" aún no tiene precios configurados.`
          );
          setTiposPrendas([]);
          return;
        }
        const prendasConvertidas = preciosEmpresa.prendas.map(p => ({
          id: p.idPrenda,
          tipo: p.tipo,
          precio: p.precio
        }));
        setTiposPrendas(prendasConvertidas);
      }
    } catch (e) {
      console.error("Error al cargar prendas:", e);
      Alert.alert("Error", "No se pudieron cargar las prendas.");
    }
  };

  cargarPrendas();
}, [usuario, clienteSeleccionado]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [numeroOrden, setNumeroOrden] = useState('');
  const [prendas, setPrendas] = useState([{ tipo: '', cantidad: '' }]);
  const [observaciones, setObservaciones] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(new Date());
  const [mostrarFecha, setMostrarFecha] = useState(false);

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const formWidth = isWeb ? (width > 600 ? 500 : '90%') : '95%';
  const generarNumeroOrden = async (tipoCliente) => {
  const ultima = await obtenerUltimaComandaPorTipo(tipoCliente);
  
  const prefix = tipoCliente === 'Empresa' ? 'EMP' : 'PART';
  let nuevoNumero = 1;

  if (ultima && typeof ultima === 'string') {
    const partes = ultima.split('-');
    if (partes.length === 2) {
      const num = parseInt(partes[1]);
      if (!isNaN(num)) {
        nuevoNumero = num + 1;
      }
    }
  }
  return `${prefix}-${nuevoNumero}`;
};

  const calcularTotal = () =>
    prendas.reduce((acc, p) => {
      const prenda = tiposPrendas.find(t => t.tipo === p.tipo);
      const subtotal = prenda && p.cantidad ? prenda.precio * parseFloat(p.cantidad) : 0;
      return acc + subtotal;
    }, 0);
  const handleAgregarPrenda = () => {
    setPrendas([...prendas, { tipo: '', cantidad: '' }]);
  };
  const handleGuardar = async () => {
    if (!clienteSeleccionado || prendas.length === 0) {
      Alert.alert('Error', 'Debes seleccionar un cliente y agregar al menos una prenda.');
      return;
    }
    for (let p of prendas) {
      if (!p.tipo || !p.cantidad || parseInt(p.cantidad) <= 0) {
        Alert.alert("Error", "Todas las prendas deben tener tipo y una cantidad válida.");
        return;
      }
    }
    const numeroGenerado = await obtenerNuevoNumeroOrdenPorTipo(clienteSeleccionado.tipo);
    const total = calcularTotal();
    const clienteFiltrado = {
      correo: clienteSeleccionado.correo,
      direccion: clienteSeleccionado.direccion,
      nombre: clienteSeleccionado.nombre,
      rut: clienteSeleccionado.rut,
      telefono: clienteSeleccionado.telefono,
      tipo: clienteSeleccionado.tipo
    };
    const nuevaComanda = {
      numeroOrden: numeroGenerado,
      cliente: clienteFiltrado,
      prendas,
      observaciones,
      fechaEntrega,
      total,
      creadoPor: {
        nombre: usuario.nombre,
        correo: usuario.correo,
        rut: usuario.rut,
        rol: usuario.rol,
      },
      fechaCreacion: new Date(),
      estado: "Pendiente",
    };
    try {
      setLoading(true);
      console.log('🧾 Guardando comanda:', nuevaComanda);
      const idGenerado = await crearComanda(nuevaComanda);
      const comandaConID = { ...nuevaComanda, id: idGenerado };
      setLoading(false);
      Alert.alert(
        "Comanda creada",
        `Se guardó correctamente para ${clienteSeleccionado.nombre}\nNúmero de orden: ${numeroGenerado}`,
        [
          {
            text: "Imprimir",
            onPress: () => generarPDF(comandaConID)
          },
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
      setClienteSeleccionado(null);
      setNumeroOrden('');
      setPrendas([{ tipo: '', cantidad: '' }]);
      setObservaciones('');
      setFechaEntrega(new Date());
    } catch (error) {
      console.error("Error al crear comanda:", error);
      Alert.alert('Error', 'No se pudo guardar la comanda');
    }finally {
      setLoading(false);
    }
  };
  const handleSeleccionarCliente = async (value) => {
  const cliente = clientes.find((c) => c.id === value);
  if (!cliente) {
    setClienteSeleccionado(null);
    setNumeroOrden('');
    setTiposPrendas([]);
    return;
  }

  setClienteSeleccionado(cliente);
  if (cliente.tipo === "Empresa") {
    console.log("Buscando precios empresa de:", cliente.nombre);
    const preciosEmpresa = await obtenerPreciosEmpresa(cliente.rut);
    if (preciosEmpresa) {
      console.log("📦 Prendas empresa:", preciosEmpresa.prendas);
      setTiposPrendas(preciosEmpresa.prendas);
    } else {
      console.log("⚠ No hay prendas configuradas para esta empresa");
      setTiposPrendas([]);  
      Alert.alert("Atención", "Esta empresa aún no tiene precios configurados.");
    }
  } else {
    console.log("Cargando prendas normales");
    const prendasBase = await obtenerPrendas();
    setTiposPrendas(prendasBase);
  }
};

const generarPDF = async (comanda) => {
  try {
    const html = `
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h2 style="text-align:center;">Comprobante de Comanda</h2>
          <hr />
          <p><b>ID:</b> ${comanda.id}</p>
          <p><b>N° Orden:</b> ${comanda.numeroOrden}</p>
          <p><b>Cliente:</b> ${comanda.cliente?.nombre || '—'}</p>
          <p><b>RUT:</b> ${comanda.cliente?.rut || '—'}</p>
          <p><b>Fecha creación:</b> ${
            comanda.fechaCreacion?.toDate
              ? comanda.fechaCreacion.toDate().toLocaleString()
              : new Date(comanda.fechaCreacion).toLocaleString()
          }</p>
          <p><b>Fecha entrega:</b> ${
            comanda.fechaEntrega?.toDate
              ? comanda.fechaEntrega.toDate().toLocaleDateString()
              : new Date(comanda.fechaEntrega).toLocaleDateString()
          }</p>
          <p><b>Estado:</b> ${comanda.estado || '—'}</p>
          <h3>🧺 Prendas</h3>
          <ul>
            ${
              comanda.prendas?.length
                ? comanda.prendas
                    .map(p => `<li>${p.tipo} — Cantidad: ${p.cantidad}</li>`)
                    .join('')
                : '<li>No hay prendas registradas</li>'
            }
          </ul>
          <p><b>Total:</b> $${comanda.total || 0}</p>
          <hr />
          <p style="text-align:center;">El Cobre Spa — Servicio de Lavandería</p>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Guardar o compartir comanda',
      });
    } else {
      Alert.alert('PDF generado', `Archivo temporal: ${uri}`);
    }
  } catch (error) {
    console.error('Error al generar PDF:', error);
    Alert.alert('Error', 'No se pudo generar el PDF.');
  }
};

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={[styles.container, { width: formWidth }]}>
        <Text style={styles.title}>Crear Comanda</Text>
        {/* Cliente */}
        <Text style={styles.label}>Cliente</Text>
        {isWeb ? (
          <select
            value={clienteSeleccionado?.id || ''}
            onChange={(e) => handleSeleccionarCliente(e.target.value)}
            style={styles.webSelect}
          >
            <option value="">Seleccione un cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo === 'Empresa' ? 'Empresa' : 'Particular'})
              </option>
            ))}
          </select>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={clienteSeleccionado?.id || ''}
              onValueChange={handleSeleccionarCliente}
            >
              <Picker.Item label="Seleccione un cliente..." value="" />
              {clientes.map((c) => (
                <Picker.Item
                  key={c.id}
                  label={`${c.nombre} (${c.tipo === 'Empresa' ? 'Empresa' : 'Particular'})`}
                  value={c.id}
                />
              ))}
            </Picker>
          </View>
        )}
        {clienteSeleccionado && (
          <View style={styles.clientInfo}>
            <Text>📛 {clienteSeleccionado.nombre}</Text>
            <Text>📞 {clienteSeleccionado.telefono}</Text>
            <Text>🏷️ Tipo: {clienteSeleccionado.tipo}</Text>
          </View>
        )}
        <Text style={styles.label}>Prendas</Text>
        {prendas.map((p, index) => {
          const prendasUsadas = prendas.map(pr => pr.tipo);
          const prendasDisponibles = tiposPrendas.filter(
            t => !prendasUsadas.includes(t.tipo) || t.tipo === p.tipo
          );

          return (
            <View key={index} style={styles.prendaRow}>
              <View style={styles.prendaPicker}>
                {isWeb ? (
                  <select
                    value={p.tipo}
                    onChange={(e) => {
                      const nuevas = [...prendas];
                      nuevas[index].tipo = e.target.value;
                      setPrendas(nuevas);
                    }}
                    style={styles.webSelect}
                  >
                    <option value="">Seleccione prenda...</option>
                    {prendasDisponibles.map((t) => (
                      <option key={t.id} value={t.tipo}>
                        {t.tipo} (${t.precio})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Picker
                    selectedValue={p.tipo}
                    onValueChange={(value) => {
                      const nuevas = [...prendas];
                      nuevas[index].tipo = value;
                      setPrendas(nuevas);
                    }}
                  >
                    <Picker.Item label="Seleccione prenda..." value="" />
                    {prendasDisponibles.map((t) => (
                      <Picker.Item key={t.id} label={`${t.tipo} ($${t.precio})`} value={t.tipo} />
                    ))}
                  </Picker>
                )}
              </View>
              <TextInput
                style={styles.inputCantidad}
                keyboardType="numeric"
                placeholder="Cant."
                value={p.cantidad.toString()}
                onChangeText={(text) => {
                  const nuevas = [...prendas];
                  nuevas[index].cantidad = text.replace(/[^0-9.]/g, '');
                  setPrendas(nuevas);
                }}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleEliminarPrenda(index)}
              >
                <Text style={styles.deleteButtonLabel}>X</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <TouchableOpacity style={styles.addButton} onPress={handleAgregarPrenda}>
          <Text style={styles.addButtonText}>+ Añadir otra prenda</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Observaciones</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          multiline
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Ejemplo: manchas difíciles, prendas delicadas, etc."
        />
        <Text style={styles.label}>Fecha estimada de entrega</Text>
        {isWeb ? (
          <input
            type="date"
            value={fechaEntrega.toISOString().split('T')[0]}
            onChange={(e) => setFechaEntrega(new Date(e.target.value))}
            style={styles.webSelect}
          />
        ) : (
          <>
            <TouchableOpacity onPress={() => setMostrarFecha(true)} style={styles.dateButton}>
              <Text style={styles.dateText}>{fechaEntrega.toLocaleDateString('es-CL')}</Text>
            </TouchableOpacity>
            {mostrarFecha && (
              <DateTimePicker
                value={fechaEntrega}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setMostrarFecha(false);
                  if (date) setFechaEntrega(date);
                }}
              />
            )}
          </>
        )}
        <View style={styles.resumenBox}>
          <Text style={styles.resumenTitle}>Resumen de Pago</Text>
          {prendas.map((p, i) => {
            const prenda = tiposPrendas.find(t => t.tipo === p.tipo);
            if (!prenda || !p.cantidad) return null;
            const subtotal = prenda.precio * parseFloat(p.cantidad);
            return (
              <Text key={i} style={styles.resumenItem}>
                • {p.cantidad} × {p.tipo} (${prenda.precio}) = ${subtotal}
              </Text>
            );
          })}
          <Text style={styles.totalText}>Total a pagar: ${calcularTotal()}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleGuardar}>
          <Text style={styles.buttonText}>Guardar Comanda</Text>
        </TouchableOpacity>
        {loading && (
          <View style={styles.overlay}>
            <View style={styles.overlayBox}>
              <Text style={styles.overlayText}>Guardando comanda...</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
    paddingVertical: 40,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ff6600ff',
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  webSelect: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
  },
  prendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prendaPicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  inputCantidad: {
    width: 70,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 8,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#E5F1FF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: { color: '#ff6600ff', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateText: { fontSize: 16, color: '#333' },
  resumenBox: {
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  resumenTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ff6600ff',
  },
  resumenItem: { color: '#333', marginVertical: 2 },
  totalText: { marginTop: 10, fontWeight: 'bold', fontSize: 16, color: '#ff6600ff' },
  button: {
    backgroundColor: '#ff6600ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  orderText: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 10,
  },
  clientInfo: {
    backgroundColor: '#E5F1FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },

  deleteButtonLabel: {
    color: "white",
    fontWeight: "bold",
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  overlayBox: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },

  overlayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
