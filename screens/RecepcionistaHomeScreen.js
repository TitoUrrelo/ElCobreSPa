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
  TextInput,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

import { escucharComandasPorRutPart, handleLogout, cancelarComanda } from '../control/comandaControl';

export default function RecepcionistaHomeScreen({ route, navigation }) {
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
  const [scrollHeight, setScrollHeight] = useState(0);

  // Cálculo de altura para Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const header = document.querySelector('[data-header]')?.offsetHeight || 50;
      const filters = document.querySelector('[data-filters]')?.offsetHeight || 200;
      const bottomBar = document.querySelector('[data-bottom-bar]')?.offsetHeight || 120;
      setScrollHeight(window.innerHeight - header - filters - bottomBar);
    }
  }, []);

  const Recepcionista = {
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
  
    const unsubscribe = escucharComandasPorRutPart(rut, (data) => {
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

  // filtro busqueda por nombre o rut
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
          <body style="font-family: Arial; padding: 28px; max-width: 620px; margin: auto; color:#333;">
            
            <h2 style="text-align:center; margin:0; letter-spacing:1px;">COMPROBANTE DE COMANDA</h2>
            <p style="text-align:center; font-size:12px; margin-top:4px;">
              El Cobre Spa · Servicio de Lavandería
            </p>
            <hr style="margin:18px 0;" />
            <!-- Información General -->
            <h3 style="margin:0 0 8px 0; font-size:17px;">Información General</h3>
            <table style="width:100%; font-size:14px; line-height:1.35;">
              <tr><td><b>N° Orden:</b></td><td>${comanda.numeroOrden || '—'}</td></tr>
              <tr><td><b>Despacho:</b></td><td>${comanda.despacho === true ? "Sí" : "No"}</td></tr>
              <tr><td><b>Fecha de creación:</b></td><td>${new Date(comanda.fechaCreacion).toLocaleString()}</td></tr>
              <tr><td><b>Fecha de entrega:</b></td><td>${new Date(comanda.fechaEntrega).toLocaleString()}</td></tr>
              <tr><td valign="top"><b>Observaciones:</b></td><td>${comanda.observaciones || 'Ninguna'}</td></tr>
            </table>
            <hr style="margin:18px 0;" />
            <!-- Cliente -->
            <h3 style="margin:0 0 8px 0; font-size:17px;">Cliente</h3>
            <table style="width:100%; font-size:14px; line-height:1.35;">
              <tr><td><b>Nombre:</b></td><td>${comanda.cliente?.nombre || '—'}</td></tr>
              <tr><td><b>RUT:</b></td><td>${comanda.cliente?.rut || '—'}</td></tr>
              <tr><td><b>Correo:</b></td><td>${comanda.cliente?.correo || '—'}</td></tr>
              <tr><td><b>Teléfono:</b></td><td>${comanda.cliente?.telefono || '—'}</td></tr>
              <tr><td><b>Dirección:</b></td><td>${comanda.cliente?.direccion || '—'}</td></tr>
              <tr><td><b>Tipo:</b></td><td>${comanda.cliente?.tipo || '—'}</td></tr>
            </table>
            <hr style="margin:18px 0;" />
            <!-- Prendas -->
            <h3 style="margin:0 0 8px 0; font-size:17px;">Detalle de Prendas</h3>
            <table style="width:100%; border-collapse: collapse; font-size:14px;">
              <tr>
                <th style="border-bottom:1px solid #bbb; text-align:left; padding:6px 2px;">Tipo</th>
                <th style="border-bottom:1px solid #bbb; text-align:center; padding:6px 2px;">Cantidad</th>
                <th style="border-bottom:1px solid #bbb; text-align:center; padding:6px 2px;">Precio Unitario</th>
              </tr>
              ${
                comanda.prendas?.length
                  ? comanda.prendas
                      .map(
                        (p) => `
                          <tr>
                            <td style="padding:6px 2px;">${p.tipo}</td>
                            <td style="padding:6px 2px; text-align:center;">${p.cantidad}</td>
                            <td style="padding:6px 2px; text-align:center;">$${p.precioUnitario || 0}</td>
                          </tr>`
                      )
                      .join('')
                  : `<tr><td colspan="3" style="padding:6px; text-align:center;">Sin prendas registradas</td></tr>`
              }
            </table>
            <!-- Total -->
            <hr style="margin:18px 0;" />
            ${
              comanda.despacho === true
                ? `<p style="font-size:15px; margin:0 0 10px 0;"><b>Valor despacho:</b> $3000</p>`
                : ""
            }
            <hr style="margin:18px 0;" />
            <p style="font-size:16px; margin:0 0 10px 0;">Total: <b>$${comanda.total || 0}</b></p>
            <hr style="margin:18px 0;" />
            <!-- Atendido por -->
            <h3 style="margin:0 0 6px 0; font-size:17px;">Atendido por</h3>
            <table style="width:100%; font-size:14px; line-height:1.35;">
              <tr><td><b>Nombre:</b></td><td>${comanda.creadoPor?.nombre || '—'}</td></tr>
              <tr><td><b>Correo:</b></td><td>${comanda.creadoPor?.correo || '—'}</td></tr>
              <tr><td><b>RUT:</b></td><td>${comanda.creadoPor?.rut || '—'}</td></tr>
              <tr><td><b>Rol:</b></td><td>${comanda.creadoPor?.rol || '—'}</td></tr>
            </table>
            <hr style="margin:16px 0;" />
            <p style="text-align:center; font-size:12px; margin-top:4px;">
              El Cobre Spa — Todos los derechos reservados
            </p>
          </body>
        </html>
      `;
      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        win.document.write(html);
        win.document.close();
        win.print();
        return;
      }
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
    <View style={{ flex: 1 }}>
      <View style={styles.header} data-header>
        <TouchableOpacity onPress={abrirMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel del Recepcionista</Text>
      </View>
      <View style={styles.filterContainer} data-filters>
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
        <View style={{ paddingHorizontal: 15, marginTop: 10, marginBottom: 10 }}>
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
      </View>
      {mostrarPicker && (
        Platform.OS === "web" ? (
          <input
            type="date"
            style={{
              marginTop: 10,
              marginHorizontal: 15,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
            onChange={(e) => {
              setMostrarPicker(false);
              const [year, month, day] = e.target.value.split("-");
              const fechaLocal = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
              );
              setFiltroFecha(fechaLocal);
            }}
          />
        ) : (
          <DateTimePicker
            value={filtroFecha || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setMostrarPicker(false);
              if (date) setFiltroFecha(date);
            }}
          />
        )
      )}
      {Platform.OS === 'web' ? (
        <div style={{
          overflow: 'auto',
          height: 'calc(100vh - 305px)',
          paddingBottom: '150px',
        }}>
          <Text style={styles.sectionTitle}>Comandas {filtro}</Text>
          {comandasFiltradas.length > 0 ? (
            comandasFiltradas.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setComandaSeleccionada(c)}>
                <View style={styles.comandaCard}>
                  <Text style={styles.comandaCliente}>🧾 Orden: {c.numeroOrden || c.id}</Text>
                  <Text style={styles.comandaCliente}>👤 Cliente: {c.cliente?.nombre}</Text>
                  <Text style={styles.comandaFecha}>
                    📅 Fecha Entrega: {new Date(c.fechaEntrega).toLocaleDateString()}
                  </Text>
                  <Text style={styles.comandaEstado}>
                    Estado: <Text style={{ fontWeight: "bold" }}>{c.estado}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResults}>No hay comandas con ese filtro</Text>
          )}
        </div>
      ) : (
        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ paddingBottom: 90 }}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6600']} />
          }
        >
          <Text style={styles.sectionTitle}>Comandas {filtro}</Text>
          {comandasFiltradas.length > 0 ? (
            comandasFiltradas.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setComandaSeleccionada(c)}>
                <View style={styles.comandaCard}>
                  <Text style={styles.comandaCliente}>🧾 Orden: {c.numeroOrden || c.id}</Text>
                  <Text style={styles.comandaCliente}>👤 Cliente: {c.cliente?.nombre}</Text>
                  <Text style={styles.comandaFecha}>
                    📅 Fecha Entrega: {new Date(c.fechaEntrega).toLocaleDateString()}
                  </Text>
                  <Text style={styles.comandaEstado}>
                    Estado: <Text style={{ fontWeight: "bold" }}>{c.estado}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResults}>No hay comandas con ese filtro</Text>
          )}
        </ScrollView>
      )}
      <Modal visible={!!comandaSeleccionada} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setComandaSeleccionada(null)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <ScrollView
            style={styles.bottomSheetScroll}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            {comandaSeleccionada && (
              <>
                <Text style={styles.modalTitle}>Detalles de la Comanda</Text>
                <Text style={styles.detailText}>🧾 Orden: {comandaSeleccionada.numeroOrden}</Text>
                <Text style={styles.detailText}>👤 Cliente: {comandaSeleccionada.cliente?.nombre}</Text>
                <Text style={styles.detailText}>🛻 Despacho: {comandaSeleccionada.despacho === true ? "Si" : "No"}</Text>
                <Text style={styles.detailText}>
                  📅 Fecha creación: {new Date(comandaSeleccionada.fechaCreacion).toLocaleDateString()}
                </Text>
                <Text style={styles.detailText}>
                  📅 Fecha entrega: {new Date(comandaSeleccionada.fechaEntrega).toLocaleDateString()}
                </Text>
                <Text style={styles.detailText}>🧩 Estado: {comandaSeleccionada.estado}</Text>
                {comandaSeleccionada.etapa && (
                  <Text style={styles.detailText}>🔧 Etapa: {comandaSeleccionada.etapa}</Text>
                )}
                <Text style={[styles.detailText, { marginTop: 10 }]}>
                  👕 Prendas:
                </Text>
                {comandaSeleccionada.prendas?.map((p, i) => (
                  <Text key={i} style={styles.detailText}>          • {p.tipo} ({p.cantidad})</Text>
                ))}
                <Text style={styles.detailText}>💰 Total: ${comandaSeleccionada.total}</Text>
                <Text style={styles.detailText}>
                  🔎 Observaciones: {comandaSeleccionada.observaciones || "Ninguna"}
                </Text>
                <View style={{ marginTop: 20 }}>
                  <Button title="Descargar PDF" onPress={() => generarPDF(comandaSeleccionada)} />
                </View>
                {comandaSeleccionada.estado === "Pendiente" && (
                  <View style={{ marginTop: 10 }}>
                    <Button
                      title="Cancelar Comanda"
                      color="#d9534f"
                      onPress={() => cancelarComandaModal()}
                    />
                  </View>
                )}
                <View style={{ marginTop: 10 }}>
                  <Button title="Cerrar" color="gray" onPress={() => setComandaSeleccionada(null)} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
      <View style={styles.bottomBar} data-bottom-bar>
        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: '#ff6600ff' }]}
          onPress={() => navigation.navigate('RegistrarCliente', {
            usuario: Recepcionista,
          })
        }
        >
          <Text style={styles.bottomText}>Registrar Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: '#34C759' }]}
          onPress={() => navigation.navigate('CrearComanda', {
            usuario: Recepcionista,
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
          <Animated.View
            style={[
              styles.sideMenu,
              Platform.OS === "web"
                ? { transform: [{ translateX: slideAnim }] }
                : { left: slideAnim }
            ]}
          >
            <View style={styles.menuHeader}>
              <Image source={{ uri: Recepcionista.foto }} style={styles.avatar} />
              <Text>{Recepcionista.rol}:</Text>
              <Text style={styles.nombre}>{Recepcionista.nombre}</Text>
              <Text>Correo:</Text>
              <Text style={styles.correo}>{Recepcionista.correo}</Text>
              <Text>Numero:</Text>
              <Text style={styles.numero}>{Recepcionista.numero}</Text>
              <Text>Rut:</Text>
              <Text style={styles.rut}>{Recepcionista.rut}</Text>
            </View>
            <View style={styles.menuBody}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  cerrarMenu();
                  navigation.navigate("Perfil", { usuario: Recepcionista });
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
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6600ff',
    paddingTop: Platform.OS === "web" ? 10 : 50,
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
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    color: '#333',
    paddingHorizontal: 15,
  },
  comandaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  comandaCliente: { fontSize: 16, fontWeight: '600', color: '#333' },
  comandaFecha: { color: '#666', marginTop: 4 },
  comandaEstado: { marginTop: 6, color: '#ff6600ff' },
  noResults: { 
    textAlign: 'center', 
    color: '#999', 
    marginTop: 20,
    paddingHorizontal: 15,
  },
  bottomBar: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "#eee",
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingBottom: Platform.OS === "android" ? 35 : 35,
  },
  bottomButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrollView: {
    backgroundColor: '#fff',
    maxHeight: '80%',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  bottomSheet: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  maxHeight: "80%",
  backgroundColor: "#fff",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingHorizontal: 20,
  paddingTop: 10,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 10,
},
bottomSheetHandle: {
  width: 40,
  height: 5,
  backgroundColor: "#ccc",
  borderRadius: 10,
  alignSelf: "center",
  marginBottom: 10,
},
bottomSheetScroll: {
  width: "100%",
},
modalTitle: {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 10,
},
detailText: {
  fontSize: 16,
  marginBottom: 5,
},
modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
},

});