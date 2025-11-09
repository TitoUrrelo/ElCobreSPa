import React, { useState, useRef } from 'react';
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
} from 'react-native';
import * as Print from 'expo-print';

export default function AdministradorHomeScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [filtro, setFiltro] = useState('Todas');
  const [subFiltro, setSubFiltro] = useState(null);
  const [comandaSeleccionada, setComandaSeleccionada] = useState(null);
  const [showPrendasEmpresas, setShowPrendasEmpresas] = useState(false);

  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.7)).current;

  const Administrador = {
    nombre: 'María Antonia',
    correo: 'maria.Antonia@elcobre.cl',
    telefono: '+56 9 1234 5678',
    foto: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png',
  };

  // Comandas con ID tipo EMP-1001
  const comandas = [
    {
      id: 'EMP-1001',
      cliente: 'Juan Pérez',
      fecha: '12/10/2025',
      estado: 'En proceso',
      etapa: 'Lavado',
      tipoServicio: 'Lavado y secado',
      prendas: ['3 camisas', '2 pantalones', '1 chaqueta'],
      total: 8500,
    },
    {
      id: 'EMP-1002',
      cliente: 'Empresa Ruta Sur',
      fecha: '11/10/2025',
      estado: 'Entregada',
      tipoServicio: 'Lavado industrial',
      prendas: ['Uniformes de trabajo (10)'],
      total: 23000,
    },
    {
      id: 'EMP-1003',
      cliente: 'Ana Díaz',
      fecha: '10/10/2025',
      estado: 'Pendiente',
      tipoServicio: 'Lavado y planchado',
      prendas: ['5 blusas', '3 pantalones'],
      total: 12000,
    },
    {
      id: 'EMP-1004',
      cliente: 'Carlos Ruiz',
      fecha: '09/10/2025',
      estado: 'Cancelada',
      tipoServicio: 'Solo planchado',
      prendas: ['2 camisas'],
      total: 4000,
    },
    {
      id: 'EMP-1005',
      cliente: 'María Torres',
      fecha: '08/10/2025',
      estado: 'Listo para entrega',
      etapa: 'Planchado',
      tipoServicio: 'Lavado completo',
      prendas: ['3 blusas', '2 pantalones', '1 vestido'],
      total: 9800,
    },
  ];

  let comandasFiltradas = filtro === 'Todas' ? comandas : comandas.filter((c) => c.estado === filtro);
  if (filtro === 'En proceso' && subFiltro) {
    comandasFiltradas = comandasFiltradas.filter((c) => c.etapa === subFiltro);
  }

  const filtros = ['Todas', 'Pendiente', 'En proceso', 'Listo para entrega', 'Entregada', 'Cancelada'];
  const subFiltrosProceso = ['Lavado', 'Secado', 'Planchado', 'Empaque'];

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
    const html = `
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h2>Comprobante de Comanda</h2>
          <p><b>ID:</b> ${comanda.id}</p>
          <p><b>Cliente:</b> ${comanda.cliente}</p>
          <p><b>Fecha:</b> ${comanda.fecha}</p>
          <p><b>Estado:</b> ${comanda.estado}</p>
          ${comanda.etapa ? `<p><b>Etapa actual:</b> ${comanda.etapa}</p>` : ''}
          <p><b>Tipo de servicio:</b> ${comanda.tipoServicio}</p>
          <p><b>Prendas:</b> ${comanda.prendas.join(', ')}</p>
          <p><b>Total:</b> $${comanda.total}</p>
          <hr />
          <p>Atendido por: ${Administrador.nombre}</p>
          <p>El Cobre Spa - Servicio de Lavandería</p>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    Alert.alert('PDF generado', `Archivo guardado en: ${uri}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={abrirMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel del Administrador</Text>
      </View>

      {/* Filtros */}
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

      {/* Subfiltros */}
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

      {/* Lista de comandas */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 180 }}>
        <Text style={styles.sectionTitle}>Comandas {filtro}</Text>
        {comandasFiltradas.length > 0 ? (
          comandasFiltradas.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setComandaSeleccionada(c)}>
              <View style={styles.comandaCard}>
                <Text style={styles.comandaCliente}>🧾 ID: {c.id}</Text>
                <Text style={styles.comandaCliente}>👕 Cliente: {c.cliente}</Text>
                <Text style={styles.comandaFecha}>📅 {c.fecha}</Text>
                <Text style={styles.comandaEstado}>
                  Estado: <Text style={{ fontWeight: 'bold' }}>{c.estado}</Text>
                </Text>
                {c.estado === 'En proceso' && c.etapa && <Text>Etapa: {c.etapa}</Text>}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No hay comandas con ese filtro</Text>
        )}
      </ScrollView>

      {/* Modal detalles */}
      <Modal visible={!!comandaSeleccionada} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setComandaSeleccionada(null)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          {comandaSeleccionada && (
            <>
              <Text style={styles.modalTitle}>Detalles de la Comanda</Text>
              <Text>🧾 ID: {comandaSeleccionada.id}</Text>
              <Text>👤 Cliente: {comandaSeleccionada.cliente}</Text>
              <Text>📅 Fecha: {comandaSeleccionada.fecha}</Text>
              <Text>🧺 Servicio: {comandaSeleccionada.tipoServicio}</Text>
              <Text>🧩 Estado: {comandaSeleccionada.estado}</Text>
              {comandaSeleccionada.etapa && <Text>🔧 Etapa: {comandaSeleccionada.etapa}</Text>}
              <Text>👕 Prendas: {comandaSeleccionada.prendas.join(', ')}</Text>
              <Text>💰 Total: ${comandaSeleccionada.total}</Text>
              <View style={{ marginTop: 20 }}>
                <Button title="Descargar PDF" onPress={() => generarPDF(comandaSeleccionada)} />
              </View>
              <View style={{ marginTop: 10 }}>
                <Button title="Cerrar" color="gray" onPress={() => setComandaSeleccionada(null)} />
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Barra inferior */}
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
            onPress={() => navigation.navigate('RegistrarCliente')}
        >
            <Text style={styles.bottomText}>Registrar Cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: '#34C759' }]}
            onPress={() => navigation.navigate('CrearComanda')}
        >
            <Text style={[styles.bottomText, { color: '#000' }]}>Crear Comanda</Text>
        </TouchableOpacity>
        </View>

      {/* Menú lateral */}
      {menuVisible && (
        <>
          <TouchableWithoutFeedback onPress={cerrarMenu}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sideMenu, { left: slideAnim }]}>
            <View style={styles.menuHeader}>
              <Image source={{ uri: Administrador.foto }} style={styles.avatar} />
              <Text style={styles.nombre}>{Administrador.nombre}</Text>
              <Text style={styles.correo}>{Administrador.correo}</Text>
              <Text style={styles.telefono}>{Administrador.telefono}</Text>
            </View>
            <View style={styles.menuBody}>
              <TouchableOpacity style={styles.menuItem} onPress={() => alert('Perfil')}>
                <Text style={styles.menuText}>👤 Ver perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => alert('Configuración')}>
                <Text style={styles.menuText}>⚙️ Configuración</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => alert('Cerrar sesión')}>
                <Text style={styles.menuText}>🚪 Cerrar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={cerrarMenu}>
                <Text style={styles.closeText}>✖ Cerrar Menú</Text>
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
    flexWrap: 'wrap',      // <- permite que los botones se vayan a la segunda fila
    backgroundColor: '#eee',
    paddingVertical: 10,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#ccc',
    },
    bottomButton: {
    width: '48%',           // <- cada botón ocupa la mitad del ancho menos el margen
    marginHorizontal: '1%', // <- separación entre botones
    marginVertical: 5,      // <- separación entre filas
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
  nombre: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  correo: { color: '#f0f0f0', fontSize: 14 },
  telefono: { color: '#e0e0e0', fontSize: 13 },
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
