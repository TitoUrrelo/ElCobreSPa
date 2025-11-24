import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Button,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { obtenerComandasHistoricas } from '../control/comandaControl';

export default function ComandasHistoricasScreen({ navigation }) {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoCliente, setTipoCliente] = useState('Todas');
  const [busqueda, setBusqueda] = useState("");
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState(null);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [comandaSeleccionada, setComandaSeleccionada] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const header = document.querySelector('[data-header]')?.offsetHeight || 50;
      setScrollHeight(window.innerHeight - header - 240);
    }
  }, []);

  useEffect(() => {
    cargarComandas();
  }, []);

  const cargarComandas = async () => {
    try {
      setLoading(true);
      const data = await obtenerComandasHistoricas();
      console.log('Comandas cargadas:', data);
      setComandas(data);
    } catch (error) {
      console.error('Error al cargar comandas históricas:', error);
      Alert.alert('Error', 'No se pudieron cargar las comandas históricas');
    } finally {
      setLoading(false);
    }
  };
  let comandasFiltradas = comandas;

  if (tipoCliente !== 'Todas') {
    comandasFiltradas = comandasFiltradas.filter(
      (c) => c.cliente?.tipo === tipoCliente
    );
  }

  if (busqueda.trim() !== '') {
    comandasFiltradas = comandasFiltradas.filter((c) => {
      const nombre = c.cliente?.nombre?.toLowerCase() || '';
      const rutCliente = c.cliente?.rut?.toLowerCase() || '';
      const b = busqueda.toLowerCase();
      return nombre.includes(b) || rutCliente.includes(b);
    });
  }

  if (filtroFecha) {
    const fechaBase = new Date(filtroFecha);
    fechaBase.setHours(0, 0, 0, 0);
    comandasFiltradas = comandasFiltradas.filter((c) => {
      if (!c.fechaCreacion) return false;
      const fechaComanda = new Date(c.fechaCreacion);
      fechaComanda.setHours(0, 0, 0, 0);
      return fechaComanda.getTime() === fechaBase.getTime();
    });
  }

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

  const renderComanda = ({ item }) => (
    <TouchableOpacity onPress={() => setComandaSeleccionada(item)}>
      <View style={styles.comandaCard}>
        <Text style={styles.numeroOrden}>🧾 Orden: {item.numeroOrden}</Text>
        <Text style={styles.cliente}>👤 Cliente: {item.cliente.nombre}</Text>
        <Text style={styles.rut}>       RUT: {item.cliente.rut}</Text>
        <Text style={styles.fecha}>
          📅 Fecha: {new Date(item.fechaCreacion).toLocaleDateString()}
        </Text>
        <Text
          style={[
            styles.estado,
            {
              color: item.estado === 'Cancelada' ? '#d9534f' : '#34C759',
            },
          ]}
        >
          Estado: {item.estado}
        </Text>
        <Text style={styles.total}>💰 Total: ${item.total}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comandas Históricas</Text>
      </View>

      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButtonNew}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
        >
          {['Todas', 'Empresa', 'Particular'].map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[
                styles.filterButton,
                tipoCliente === tipo && styles.filterButtonActive,
              ]}
              onPress={() => setTipoCliente(tipo)}
            >
              <Text
                style={[
                  styles.filterText,
                  tipoCliente === tipo && styles.filterTextActive,
                ]}
              >
                {tipo === 'Todas' ? 'Todas' : tipo === 'Empresa' ? 'Empresas' : 'Particulares'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={{ paddingHorizontal: 15, marginTop: 10, marginBottom: 10 }}>
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
      <View style={{ paddingHorizontal: 15, marginBottom: 10 }}>
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
      {loading ? (
        <Text style={styles.loadingText}>Cargando comandas...</Text>
      ) : Platform.OS === 'web' ? (
        <div style={{ overflow: 'auto', height: scrollHeight }}>
          {comandasFiltradas.length > 0 ? (
            comandasFiltradas.map((c) => (
              <View key={c.id}>{renderComanda({ item: c })}</View>
            ))
          ) : (
            <Text style={styles.noResults}>No hay comandas históricas</Text>
          )}
        </div>
      ) : (
        <FlatList
          data={comandasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderComanda}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.noResults}>No hay comandas históricas</Text>
          }
        />
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
                <Text style={styles.detailText}>👤 Creado por: {comandaSeleccionada.creadoPor.nombre}</Text>
                <Text style={styles.detailText}>🛻 Despacho: {comandaSeleccionada.despacho === true ? "Sí" : "No"}</Text>
                <Text style={styles.detailText}>
                  📅 Fecha creación: {new Date(comandaSeleccionada.fechaCreacion).toLocaleDateString()}
                </Text>
                <Text style={styles.detailText}>
                  📅 Fecha entrega: {new Date(comandaSeleccionada.fechaEntrega).toLocaleDateString()}
                </Text>
                <Text style={styles.detailText}>🧩 Estado: {comandaSeleccionada.estado}</Text>
                <Text style={[styles.detailText, { marginTop: 10 }]}>
                  👕 Prendas:
                </Text>
                {comandaSeleccionada.prendas?.map((p, i) => (
                  <Text key={i} style={styles.detailText}>
                    • {p.tipo} ({p.cantidad})
                  </Text>
                ))}
                <Text style={styles.detailText}>💰 Total: ${comandaSeleccionada.total}</Text>
                <Text style={styles.detailText}>
                  🔎 Observaciones: {comandaSeleccionada.observaciones || "Ninguna"}
                </Text>
                <View style={{ marginTop: 20 }}>
                  <Button 
                    title="Descargar PDF" 
                    onPress={() => generarPDF(comandaSeleccionada)} 
                  />
                </View>
                <View style={{ marginTop: 10 }}>
                  <Button 
                    title="Cerrar" 
                    color="gray" 
                    onPress={() => setComandaSeleccionada(null)} 
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6600ff',
    paddingTop: Platform.OS === 'web' ? 10 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  backButtonContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  backButtonNew: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff6600ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#ff6600ff',
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterButtonActive: {
    backgroundColor: '#ff6600ff',
    borderColor: '#ff6600ff',
  },
  filterText: {
    color: '#555',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  numeroOrden: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  cliente: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rut: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fecha: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  estado: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  total: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ff6600',
    marginTop: 6,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontSize: 16,
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
    paddingHorizontal: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 10,
  },
  bottomSheetScroll: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  detailText: {
    fontSize: 15,
    marginBottom: 8,
    color: '#333',
    lineHeight: 22,
  },
});