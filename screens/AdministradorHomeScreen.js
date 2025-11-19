import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  Modal,
  Platform,
  Alert,
  RefreshControl,
  Switch,
  TextInput
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

import { escucharComandasPorRut, handleLogout, cancelarComanda  } from '../control/comandaControl';

export default function AdministradorHomeScreen({ route, navigation }) {
  const { nombre, correo, numero, rut, rol} = route.params;
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [menuVisible, setMenuVisible] = useState(false);
  const [filtro, setFiltro] = useState('Todas');
  const [subFiltro, setSubFiltro] = useState(null);
  const [comandaSeleccionada, setComandaSeleccionada] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState(null);

  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.7)).current;

  const [refreshing, setRefreshing] = useState(false);

  const Administrador = {
    nombre,
    correo,
    numero,
    rut,
    rol,
    foto: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png',
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  useEffect(() => {
  setLoading(true);

  const unsubscribe = escucharComandasPorRut(rut, (data) => {
    setComandas(data);
    setLoading(false);
  });

  return () => unsubscribe();
}, [rut]);

  let comandasFiltradas = filtro === 'Todas' ? comandas : comandas.filter((c) => c.estado === filtro);
  if (filtro === 'En proceso' && subFiltro) {
    comandasFiltradas = comandasFiltradas.filter((c) => c.etapa === subFiltro);
  }

  const filtros = ['Todas', 'Pendiente', 'En proceso', 'Listo para entrega', 'Entregada', 'Cancelada'];
  const subFiltrosProceso = ['Lavado', 'Secado', 'Planchado', 'Empaque'];

  if (busqueda.trim() !== "") {
    comandasFiltradas = comandasFiltradas.filter((c) => {
      const nombre = c.cliente?.nombre?.toLowerCase() || "";
      const rutCliente = c.cliente?.rut?.toLowerCase() || "";
      const b = busqueda.toLowerCase();

      return nombre.includes(b) || rutCliente.includes(b);
    });
  }
  if (filtroFecha) {
    const fechaBase = new Date(filtroFecha);
    fechaBase.setHours(0,0,0,0);
    comandasFiltradas = comandasFiltradas.filter((c) => {
      if (!c.fechaCreacion) return false;
      const fechaComanda = new Date(c.fechaCreacion);
      fechaComanda.setHours(0,0,0,0);
      return fechaComanda.getTime() === fechaBase.getTime();
    });
  }

  const abrirMenu = () => {
    setMenuVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  };
  const cerrarMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -Dimensions.get('window').width * 0.7,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setMenuVisible(false));
  };

  const generarPDF = async (comanda) => {
  try {
    const html = `
      <html>
        <body style="font-family: Arial; padding: 25px; max-width: 600px; margin: auto;">
          <h2 style="text-align:center; margin-bottom: 5px;">Comprobante de Comanda</h2>
          <p style="text-align:center; font-size: 13px; margin-top: 0;">El Cobre Spa — Servicio de Lavandería</p>
          <hr />
          <h3 style="margin-bottom: 5px;">📌 Información General</h3>
          <div style="font-size: 14px; line-height: 1.4;">
            <p><b>N° Orden:</b> ${comanda.numeroOrden || '—'}</p>
            <p><b>Estado:</b> ${comanda.estado || '—'}</p>
            <p><b>Fecha de creación:</b> ${new Date(comanda.fechaCreacion).toLocaleString() || '—'}</p>
            <p><b>Fecha de entrega:</b> ${new Date(comanda.fechaEntrega).toLocaleString() || '—'}</p>
            <p><b>Observaciones:</b> ${comanda.observaciones || 'Ninguna'}</p>
          </div>
          <hr />
          <h3 style="margin-bottom: 5px;">👤 Cliente</h3>
          <div style="font-size: 14px; line-height: 1.4;">
            <p><b>Nombre:</b> ${comanda.cliente?.nombre || '—'}</p>
            <p><b>RUT:</b> ${comanda.cliente?.rut || '—'}</p>
            <p><b>Correo:</b> ${comanda.cliente?.correo || '—'}</p>
            <p><b>Teléfono:</b> ${comanda.cliente?.telefono || '—'}</p>
            <p><b>Dirección:</b> ${comanda.cliente?.direccion || '—'}</p>
            <p><b>Tipo:</b> ${comanda.cliente?.tipo || '—'}</p>
          </div>
          <hr />
          <h3 style="margin-bottom: 5px;">🧺 Prendas</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <th style="border-bottom: 1px solid #ccc; padding: 6px; text-align:left;">Tipo</th>
              <th style="border-bottom: 1px solid #ccc; padding: 6px; text-align:center;">Cantidad</th>
            </tr>
            ${
              comanda.prendas?.length
                ? comanda.prendas
                    .map(
                      (p) => `
                        <tr>
                          <td style="padding: 6px;">${p.tipo}</td>
                          <td style="padding: 6px; text-align:center;">${p.cantidad}</td>
                        </tr>`
                    )
                    .join('')
                : `<tr><td colspan="2" style="padding: 6px; text-align:center;">No hay prendas registradas</td></tr>`
            }
          </table>
          <hr />
          <h3 style="margin-bottom: 5px;">💰 Total</h3>
          <p style="font-size: 16px;"><b>$${comanda.total || 0}</b></p>
          <hr />
          <h3 style="margin-bottom: 5px;">👨‍💼 Atendido por</h3>
          <div style="font-size: 14px; line-height: 1.4;">
            <p><b>Nombre:</b> ${comanda.creadoPor?.nombre || '—'}</p>
            <p><b>Correo:</b> ${comanda.creadoPor?.correo || '—'}</p>
            <p><b>RUT:</b> ${comanda.creadoPor?.rut || '—'}</p>
            <p><b>Rol:</b> ${comanda.creadoPor?.rol || '—'}</p>
          </div>
          <hr />
          <p style="text-align:center; font-size: 13px; margin-top: 10px;">
            Gracias por preferirnos 🌟
          </p>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        dialogTitle: "Guardar o compartir comanda",
      });
    } else {
      Alert.alert("PDF generado", `Archivo temporal: ${uri}`);
    }
  } catch (error) {
    console.error("Error al generar PDF:", error);
    Alert.alert("Error", "No se pudo generar el PDF.");
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={abrirMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel del Administrador</Text>
      </View>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filtros.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filtro === f && styles.filterButtonActive]}
              onPress={() => {
                setFiltro(f);
                setSubFiltro(null);
              }}
            >
              <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {filtro === 'En proceso' && (
        <View style={styles.subFilterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subFilterContent}
          >
            {subFiltrosProceso.map((sf) => (
              <TouchableOpacity
                key={sf}
                style={[styles.subFilterButton, subFiltro === sf && styles.filterButtonActive]}
                onPress={() => setSubFiltro(sf)}
              >
                <Text style={[styles.filterText, subFiltro === sf && styles.filterTextActive]}>
                  {sf}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
        <TextInput
          placeholder="Buscar por nombre o RUT..."
          value={busqueda}
          onChangeText={setBusqueda}
          style={{
            backgroundColor: '#fff',
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#ccc'
          }}
        />
      </View>
      <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setMostrarPicker(true)}
            style={{
              flex: 1,
              backgroundColor: "#ff6600",
              padding: 10,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Seleccionar fecha de creación
            </Text>
          </TouchableOpacity>
          {filtroFecha && (
            <TouchableOpacity
              onPress={() => setFiltroFecha(null)}
              style={{
                flex: 1,
                backgroundColor: "#d9534f",
                padding: 10,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>
                Limpiar fecha
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {filtroFecha && (
        <Text
          style={{
            marginTop: 8,
            color: "#333",
            textAlign: "center",
          }}
        >
          Fecha seleccionada: {new Date(filtroFecha).toLocaleDateString()}
        </Text>
        )}
      </View>
      {mostrarPicker && (
        <DateTimePicker
          value={filtroFecha || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setMostrarPicker(false);
            if (date) {
              setFiltroFecha(date);
            }
          }}
        />
      )}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 180 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6600']} />
        }
      >
        <Text style={styles.sectionTitle}>Estado comandas: {filtro}</Text>
        {comandasFiltradas.length > 0 ? (
          comandasFiltradas.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setComandaSeleccionada(c)}>
              <View style={styles.comandaCard}>
                <Text style={styles.comandaCliente}>🧾 ID: {c.numeroOrden || c.id}</Text>
                <Text style={styles.comandaCliente}>👕 Cliente: {c.cliente?.nombre}</Text>
                <Text style={styles.comandaFecha}>📅 Fecha Entrega: {new Date(c.fechaEntrega).toLocaleDateString()}</Text>
                <Text style={styles.comandaEstado}>
                  Estado: <Text style={{ fontWeight: 'bold' }}>{c.estado}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No hay comandas con ese filtro</Text>
        )}
      </ScrollView>
      <Modal visible={!!comandaSeleccionada} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setComandaSeleccionada(null)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          {comandaSeleccionada && (
            <>
              <Text style={styles.modalTitle}>Detalles de la Comanda</Text>
              <Text>🧾 ID: {comandaSeleccionada.numeroOrden}</Text>
              <Text>👤 Cliente: {comandaSeleccionada.cliente?.nombre}</Text>
              <Text>📅 Fecha entrega: {new Date(comandaSeleccionada.fechaEntrega).toLocaleDateString()}</Text>
              <Text>🧺 Servicio: {comandaSeleccionada.tipoServicio}</Text>
              <Text>🧩 Estado: {comandaSeleccionada.estado}</Text>
              {comandaSeleccionada.etapa && <Text>🔧 Etapa: {comandaSeleccionada.etapa}</Text>}
              <Text style={{ marginTop: 10 }}>👕 Prendas:</Text>
                {comandaSeleccionada.prendas?.map((p, i) => (
                  <Text key={i}>        • {p.tipo} ({p.cantidad})</Text>
                ))}
              <Text>💰 Total: ${comandaSeleccionada.total}</Text>
              <Text>🔎 Observaciones: {comandaSeleccionada.observaciones}</Text>
              <View style={{ marginTop: 20 }}>
                <Button title="Descargar PDF" onPress={() => generarPDF(comandaSeleccionada)} />
              </View>
              {comandaSeleccionada.estado === "Pendiente" && (
                <View style={{ marginTop: 10 }}>
                  <Button
                    title="Cancelar Comanda"
                    color="#d9534f"
                    onPress={() => {
                      Alert.alert(
                        "Confirmar cancelación",
                        "¿Deseas cancelar esta comanda?",
                        [
                          { text: "No", style: "cancel" },
                          {
                            text: "Sí",
                            onPress: async () => {
                              const tipo = comandaSeleccionada.cliente.tipo;
                              const id = comandaSeleccionada.id;
                              const result = await cancelarComanda(tipo, id);
                              if (result.success) {
                                Alert.alert("Comanda cancelada", "La comanda fue marcada como cancelada.");
                                setComandaSeleccionada(null);
                              } else {
                                Alert.alert("Error", "No se pudo cancelar la comanda.");
                              }
                            }
                          }
                        ]
                      );
                    }}
                  />
                </View>
              )}
              <View style={{ marginTop: 10 }}>
                <Button title="Cerrar" color="gray" onPress={() => setComandaSeleccionada(null)} />
              </View>
            </>
          )}
        </View>
      </Modal>
      <View style={styles.bottomBar}>
        <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: '#ffb700ff' }]}
            onPress={() => navigation.navigate('PrendasParticulares')}
        >
            <Text style={styles.bottomText}>Prendas Particulares</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: '#ffb700ff' }]}
            onPress={() => navigation.navigate('PrendasEmpresas')}
        >
            <Text style={styles.bottomText}>Prendas Empresas</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: '#ff6600ff' }]}
            onPress={() => navigation.navigate('RegistrarCliente', {
              usuario: Administrador,
            })
          }
        >
            <Text style={styles.bottomText}>Registrar Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: '#34C759' }]}
          onPress={() =>
            navigation.navigate('CrearComanda', {
              usuario: Administrador,
            })
          }
        >
          <Text style={[styles.bottomText, { color: '#000' }]}>Crear Comanda</Text>
        </TouchableOpacity>
        </View>
      {menuVisible && (
        <>
          <TouchableWithoutFeedback onPress={cerrarMenu}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sideMenu, { left: slideAnim }]}>
            <View style={styles.menuHeader}>
              <Image source={{ uri: Administrador.foto }} style={styles.avatar} />
              <Text >{Administrador.rol}:</Text>
              <Text style={styles.nombre}>{Administrador.nombre}</Text>
              <Text >Correo:</Text>
              <Text style={styles.correo}>{Administrador.correo}</Text>
              <Text >Numero:</Text>
              <Text style={styles.numero}>{Administrador.numero}</Text>
              <Text >Rut:</Text>
              <Text style={styles.rut}>{Administrador.rut}</Text>
            </View>
            <View style={styles.menuBody}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  cerrarMenu();
                  navigation.navigate("Perfil", { usuario: Administrador });
                }}
              >
                <Text style={styles.menuText}>Editar perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  const result = await handleLogout();
                  if (result.success) {
                    navigation.replace("Login");
                  } else {
                    Alert.alert("Error", "No se pudo cerrar sesión");
                  }
                }}
              >
                <Text style={styles.menuText}>Cerrar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={cerrarMenu}>
                <Text style={styles.closeText}>Cerrar Menú</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    subFilterWrapper: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 6,
    alignItems: 'center',
  },
  subFilterContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  subFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 90,
    alignItems: 'center',
  },
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6600ff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  menuIcon: { fontSize: 26, color: '#fff', marginRight: 15 },
  headerTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  subFilterContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterButtonActive: {
    backgroundColor: '#ff6600ff',
    borderColor: '#ff6600ff',
  },
  filterText: { color: '#555' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  scrollArea: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  comandaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  comandaCliente: { fontSize: 16, fontWeight: '600', color: '#333' },
  comandaFecha: { color: '#666', marginTop: 4 },
  comandaEstado: { marginTop: 6, color: '#ff6600ff' },
  noResults: { textAlign: 'center', color: '#999', marginTop: 20 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#eee',
    paddingVertical: 10,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingBottom: Platform.OS === "android" ? 30 : 30,
    },
    bottomButton: {
    width: '48%',
    marginHorizontal: '1%',
    marginVertical: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    },
    bottomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    },
    sideMenu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: '#f7f7f7',
    zIndex: 3,
    elevation: 10,
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  menuHeader: {
    backgroundColor: '#ff6600ff',
    paddingVertical: 40,
    alignItems: 'center',
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  nombre: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  correo: { color: '#f0f0f0', fontSize: 14 },
  numero: { color: '#f0f0f0', fontSize: 14 },
  rut: { color: '#e0e0e0', fontSize: 13 },
  menuBody: { padding: 20 },
  menuItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#ddd' },
  menuText: { fontSize: 16, color: '#333' },
  closeButton: { marginTop: 20, alignSelf: 'center' },
  closeText: { color: '#ff6600ff', fontWeight: 'bold' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
extraButtonsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  extraButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  extraButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
