import React, { useState } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { crearComanda } from '../control/comandaControl';
import { obtenerUltimaComandaPorTipo } from '../control/comandaControl';

export default function CrearComandaScreen() {
  // Clientes simulados
  const clientes = [
    { id: 1, nombre: 'Juan Pérez', telefono: '+56 9 1111 2222', tipo: 'particular' },
    { id: 2, nombre: 'Ana López', telefono: '+56 9 3333 4444', tipo: 'particular' },
    { id: 3, nombre: 'Ruta Sur Ltda', telefono: '+56 9 5555 6666', tipo: 'empresa' },
  ];

  // Tipos de prendas con su precio
  const tiposPrendas = [
    { tipo: 'Camisa', precio: 2000 },
    { tipo: 'Pantalón', precio: 2500 },
    { tipo: 'Chaqueta', precio: 3500 },
    { tipo: 'Vestido', precio: 4000 },
    { tipo: 'Sábana', precio: 3000 },
  ];

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [numeroOrden, setNumeroOrden] = useState('');
  const [prendas, setPrendas] = useState([{ tipo: '', cantidad: '' }]);
  const [observaciones, setObservaciones] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(new Date());
  const [mostrarFecha, setMostrarFecha] = useState(false);

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const formWidth = isWeb ? (width > 600 ? 500 : '90%') : '95%';

  // Generar número de orden segun el tipo de cliente
  const generarNumeroOrden = async (tipoCliente) => {
  const ultima = await obtenerUltimaComandaPorTipo(tipoCliente);
  
  const prefix = tipoCliente === 'empresa' ? 'EMP' : 'PART';
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
      const prenda = tiposPrendas.find((t) => t.tipo === p.tipo);
      const subtotal = prenda && p.cantidad ? prenda.precio * parseInt(p.cantidad) : 0;
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
    const total = calcularTotal();

    const nuevaComanda = {
      numeroOrden,
      cliente: clienteSeleccionado,
      prendas,
      observaciones,
      fechaEntrega,
      total
    };

    try {
      console.log('🧾 Comanda a guardar:', nuevaComanda);
      await crearComanda(nuevaComanda);
      Alert.alert('✅ Comanda creada', `Se guardó correctamente para ${clienteSeleccionado.nombre}`);
      setClienteSeleccionado(null);
      setNumeroOrden('');
      setPrendas([{ tipo: '', cantidad: '' }]);
      setObservaciones('');
      setFechaEntrega(new Date());
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comanda');
    }
  };

  const handleSeleccionarCliente = async (value) => {
  const cliente = clientes.find((c) => c.id === parseInt(value));
  if (cliente) {
    setClienteSeleccionado(cliente);
    const numero = await generarNumeroOrden(cliente.tipo);
    setNumeroOrden(numero);
  } else {
    setClienteSeleccionado(null);
    setNumeroOrden('');
  }
};

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={[styles.container, { width: formWidth }]}>
        <Text style={styles.title}>Crear Comanda</Text>

        {/* Número de comanda */}
        {numeroOrden ? (
          <Text style={styles.orderText}>
            Número de orden: <Text style={{ fontWeight: 'bold' }}>{numeroOrden}</Text>
          </Text>
        ) : (
          <Text style={styles.orderText}>Seleccione un cliente para generar el número de orden</Text>
        )}

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
                {c.nombre} ({c.tipo === 'empresa' ? 'Empresa' : 'Particular'})
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
                  label={`${c.nombre} (${c.tipo === 'empresa' ? 'Empresa' : 'Particular'})`}
                  value={c.id}
                />
              ))}
            </Picker>
          </View>
        )}

        {/* Info del cliente */}
        {clienteSeleccionado && (
          <View style={styles.clientInfo}>
            <Text>📛 {clienteSeleccionado.nombre}</Text>
            <Text>📞 {clienteSeleccionado.telefono}</Text>
            <Text>🏷️ Tipo: {clienteSeleccionado.tipo}</Text>
          </View>
        )}

        {/* Prendas */}
        <Text style={styles.label}>Prendas</Text>
        {prendas.map((p, index) => (
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
                  {tiposPrendas.map((t) => (
                    <option key={t.tipo} value={t.tipo}>
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
                  {tiposPrendas.map((t) => (
                    <Picker.Item key={t.tipo} label={`${t.tipo} ($${t.precio})`} value={t.tipo} />
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
                nuevas[index].cantidad = text.replace(/[^0-9]/g, '');
                setPrendas(nuevas);
              }}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAgregarPrenda}>
          <Text style={styles.addButtonText}>+ Añadir otra prenda</Text>
        </TouchableOpacity>

        {/* Observaciones */}
        <Text style={styles.label}>Observaciones</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          multiline
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Ejemplo: manchas difíciles, prendas delicadas, etc."
        />

        {/* Fecha */}
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

        {/* Resumen */}
        <View style={styles.resumenBox}>
          <Text style={styles.resumenTitle}>Resumen de Pago</Text>
          {prendas.map((p, i) => {
            const prenda = tiposPrendas.find((t) => t.tipo === p.tipo);
            if (!prenda || !p.cantidad) return null;
            const subtotal = prenda.precio * parseInt(p.cantidad);
            return (
              <Text key={i} style={styles.resumenItem}>
                • {p.cantidad} × {p.tipo} (${prenda.precio}) = ${subtotal}
              </Text>
            );
          })}
          <Text style={styles.totalText}>Total a pagar: ${calcularTotal()}</Text>
        </View>

        {/* Botones */}
        <TouchableOpacity style={styles.button} onPress={handleGuardar}>
          <Text style={styles.buttonText}>Guardar Comanda</Text>
        </TouchableOpacity>
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
});
