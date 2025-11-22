import React, { useState, useEffect } from 'react';
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

import { crearComanda, obtenerUltimaComandaPorTipo, obtenerNuevoNumeroOrdenPorTipo } from '../control/comandaControl';
import { obtenerClientesPorTipo, actualizarDireccionClientePorRut } from '../control/clienteControl';
import { obtenerPrendas } from '../control/prendaControl';
import { obtenerPreciosEmpresa } from '../control/prendaEmpresaControl';

const COSTO_DESPACHO = 3000;

export default function CrearComandaScreen({ route, navigation }) {
  const { usuario } = route.params;
  const [clientes, setClientes] = useState([]);
  const [tiposPrendas, setTiposPrendas] = useState([]);

  const [loading, setLoading] = useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [numeroOrden, setNumeroOrden] = useState('');
  const [prendas, setPrendas] = useState([{ tipo: '', cantidad: '' }]);
  const [observaciones, setObservaciones] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(new Date());
  const [mostrarFecha, setMostrarFecha] = useState(false);

  const [scrollHeight, setScrollHeight] = useState(0);

useEffect(() => {
  if (Platform.OS === 'web') {
    const header = document.querySelector('[data-header]')?.offsetHeight || 60;
    const bottomBar = document.querySelector('[data-bottom-bar]')?.offsetHeight || 80;

    setScrollHeight(window.innerHeight - header - bottomBar - 80);
  }
}, []);
  const [despacho, setdespacho] = useState(false);
  const [direccionDespacho, setDireccionDespacho] = useState('');

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
        if (usuario.rol === "administrador") {
          tipoFiltro = "Empresa";
        } else if (usuario.rol === "recepcionista") {
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
        if (usuario.rol === "recepcionista") {
          const data = await obtenerPrendas();
          const activas = data.filter(p => p.estado !== false);
          setTiposPrendas(activas);
          return;
        }
        if (usuario.rol === "administrador") {
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
          const prendasConvertidas = preciosEmpresa.prendas
            .filter(p => p.estado !== false)
            .map(p => ({
              id: p.idPrenda,
              tipo: p.tipo,
              precio: p.precio,
            }));

          setTiposPrendas(prendasConvertidas);
          return;
        }
        Alert.alert("Error", "Rol no reconocido");
        setTiposPrendas([]);
      } catch (e) {
        console.error("Error al cargar prendas:", e);
        Alert.alert("Error", "No se pudieron cargar las prendas.");
      }
    };

    cargarPrendas();
  }, [usuario, clienteSeleccionado]);

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const formWidth = isWeb ? (width > 800 ? 700 : '95%') : '95%';

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

  const calcularSubtotalPrendas = () =>
    prendas.reduce((acc, p) => {
      const prenda = tiposPrendas.find(t => t.tipo === p.tipo);
      const subtotal = prenda && p.cantidad ? prenda.precio * parseFloat(p.cantidad) : 0;
      return acc + subtotal;
    }, 0);

  const calcularTotal = () => {
    const subtotal = calcularSubtotalPrendas();
    return despacho ? subtotal + COSTO_DESPACHO : subtotal;
  };

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
    const direccionFinal = despacho
      ? (clienteSeleccionado.direccion && clienteSeleccionado.direccion.trim() !== ""
          ? clienteSeleccionado.direccion
          : direccionDespacho)
      : clienteSeleccionado.direccion;
    if (despacho && (!direccionFinal || direccionFinal.trim() === "")) {
      Alert.alert("Error", "Debes ingresar una dirección de despacho.");
      return;
    }
    if (despacho && direccionFinal !== clienteSeleccionado.direccion) {
      try {
        await actualizarDireccionClientePorRut(clienteSeleccionado.rut, direccionFinal);
        console.log("Dirección del cliente actualizada en clientes");
        setClienteSeleccionado(prev => ({ ...prev, direccion: direccionFinal }));
      } catch (e) {
        console.error("Error actualizando dirección:", e);
      }
    }
    const numeroGenerado = await obtenerNuevoNumeroOrdenPorTipo(clienteSeleccionado.tipo);
    const total = calcularTotal();
    let observacionesFinal = observaciones;
    if (despacho) {
      const notaDespacho = `\n[Despacho incluido: $${COSTO_DESPACHO}]`;
      observacionesFinal = observaciones.trim() 
        ? `${observaciones}${notaDespacho}` 
        : `Despacho incluido: $${COSTO_DESPACHO}`;
    }
    const clienteFiltrado = {
      correo: clienteSeleccionado.correo,
      direccion: direccionFinal,
      nombre: clienteSeleccionado.nombre,
      rut: clienteSeleccionado.rut,
      telefono: clienteSeleccionado.telefono,
      tipo: clienteSeleccionado.tipo
    };
    const prendasConPrecio = prendas.map((p) => {
      const prendaInfo = tiposPrendas.find(t => t.tipo === p.tipo);
      return {
        tipo: p.tipo,
        cantidad: p.cantidad,
        precioUnitario: prendaInfo?.precio || 0
      };
    });
    const nuevaComanda = {
      numeroOrden: numeroGenerado,
      cliente: clienteFiltrado,
      prendas: prendasConPrecio,
      observaciones: observacionesFinal,
      fechaEntrega,
      total,
      despacho,
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
      console.log('Guardando comanda:', nuevaComanda);
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
      setdespacho(false);
      setDireccionDespacho('');
    } catch (error) {
      console.error("Error al crear comanda:", error);
      Alert.alert('Error', 'No se pudo guardar la comanda');
    } finally {
      setLoading(false);
    }
  };
  const handleSeleccionarCliente = async (value) => {
    const cliente = clientes.find((c) => c.id === value);
    if (!cliente) {
      setClienteSeleccionado(null);
      setNumeroOrden('');
      setTiposPrendas([]);
      setDireccionDespacho('');
      return;
    }
    setClienteSeleccionado(cliente);
    setDireccionDespacho('');
    if (cliente.tipo === "Empresa") {
      console.log("Buscando precios empresa de:", cliente.nombre);
      const preciosEmpresa = await obtenerPreciosEmpresa(cliente.rut);
      if (preciosEmpresa) {
        console.log("Prendas empresa:", preciosEmpresa.prendas);
        setTiposPrendas(preciosEmpresa.prendas);
      } else {
        console.log(" No hay prendas configuradas para esta empresa");
        setTiposPrendas([]);
        Alert.alert("Atención", "Esta empresa aún no tiene precios configurados.");
      }
    } else {
      console.log("Cargando prendas normales");
      const prendasBase = await obtenerPrendas();
      const activas = prendasBase.filter(p => p.estado !== false);
      setTiposPrendas(activas);
    }
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
  const necesitaDireccion = despacho &&
    (!clienteSeleccionado?.direccion || clienteSeleccionado.direccion.trim() === "");
  return (
  <View style={{ flex: 1, width: '100%', height: '100%' }}>
    {Platform.OS === 'web' ? (
      <div
        style={{
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#f5f7fa',
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            overflowY: "auto",
            height: scrollHeight || "calc(100vh - 80px)",
            paddingBottom: 120,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <View style={[styles.container, { width: formWidth, maxWidth: 700 }]}>
            <Text style={styles.title}>Crear Comanda</Text>
            <Text style={styles.label}>Cliente</Text>
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
            {clienteSeleccionado && (
              <View style={styles.clientInfo}>
                <Text>📛 {clienteSeleccionado.nombre}</Text>
                <Text>📞 {clienteSeleccionado.telefono}</Text>
                <Text>🏷️ Tipo: {clienteSeleccionado.tipo}</Text>
                {clienteSeleccionado.direccion?.trim() !== "" && (
                  <Text>📍 Dirección: {clienteSeleccionado.direccion}</Text>
                )}
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
            <Text style={styles.label}>
              ¿La comanda tendrá despacho? (+ ${COSTO_DESPACHO})
            </Text>
            <View style={styles.despachoButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.despachoButton,
                  despacho && styles.despachoButtonActive
                ]}
                onPress={() => setdespacho(true)}
              >
                <Text style={[
                  styles.despachoButtonText,
                  despacho && styles.despachoButtonTextActive
                ]}>
                  Sí
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.despachoButton,
                  !despacho && styles.despachoButtonActive
                ]}
                onPress={() => setdespacho(false)}
              >
                <Text style={[
                  styles.despachoButtonText,
                  !despacho && styles.despachoButtonTextActive
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
            {necesitaDireccion && (
              <>
                <Text style={styles.label}>Dirección de despacho</Text>
                <TextInput
                  style={styles.input}
                  value={direccionDespacho}
                  onChangeText={setDireccionDespacho}
                  placeholder="Ingrese la dirección de despacho..."
                />
              </>
            )}
            <Text style={styles.label}>Observaciones</Text>
            <TextInput
              style={[styles.input, isWeb && styles.inputObservacionesWeb]}
              multiline
              value={observaciones}
              onChangeText={setObservaciones}
              placeholder="Ejemplo: manchas difíciles..."
            />
            <Text style={styles.label}>Fecha estimada de entrega</Text>
            <input
              type="date"
              value={fechaEntrega.toISOString().split('T')[0]}
              onChange={(e) => setFechaEntrega(new Date(e.target.value))}
              style={styles.webSelect}
            />
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
              <Text style={styles.resumenItem}>
                Subtotal prendas: ${calcularSubtotalPrendas()}
              </Text>
              {despacho && (
                <Text style={styles.resumenItem}>
                  Costo de despacho: ${COSTO_DESPACHO}
                </Text>
              )}
              <Text style={styles.totalText}>
                Total a pagar: ${calcularTotal()}
              </Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleGuardar}>
              <Text style={styles.buttonText}>Guardar Comanda</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.buttonText, { color: '#ff6600ff' }]}>← Volver</Text>
            </TouchableOpacity>
            {loading && (
              <View style={styles.overlay}>
                <View style={styles.overlayBox}>
                  <Text style={styles.overlayText}>Guardando comanda...</Text>
                </View>
              </View>
            )}
          </View>
        </div>
      </div>
    ) : (
      <ScrollView
        contentContainerStyle={styles.page}
        style={{ width: '100%', height: '100%' }}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.container, { width: formWidth }]}>
          <Text style={styles.title}>Crear Comanda</Text>
          <Text style={styles.label}>Cliente</Text>
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

          {clienteSeleccionado && (
            <View style={styles.clientInfo}>
              <Text>📛 {clienteSeleccionado.nombre}</Text>
              <Text>📞 {clienteSeleccionado.telefono}</Text>
              <Text>🏷️ Tipo: {clienteSeleccionado.tipo}</Text>
              {clienteSeleccionado.direccion && clienteSeleccionado.direccion.trim() !== "" && (
                <Text>📍 Dirección: {clienteSeleccionado.direccion}</Text>
              )}
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
          <Text style={styles.label}>¿La comanda tendrá despacho? (+ ${COSTO_DESPACHO})</Text>
          <View style={styles.despachoButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.despachoButton,
                despacho && styles.despachoButtonActive
              ]}
              onPress={() => setdespacho(true)}
            >
              <Text style={[
                styles.despachoButtonText,
                despacho && styles.despachoButtonTextActive
              ]}>
                Sí
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.despachoButton,
                !despacho && styles.despachoButtonActive
              ]}
              onPress={() => setdespacho(false)}
            >
              <Text style={[
                styles.despachoButtonText,
                !despacho && styles.despachoButtonTextActive
              ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
          {necesitaDireccion && (
            <>
              <Text style={styles.label}>Dirección de despacho</Text>
              <TextInput
                style={styles.input}
                value={direccionDespacho}
                onChangeText={setDireccionDespacho}
                placeholder="Ingrese la dirección de despacho..."
              />
            </>
          )}
          <Text style={styles.label}>Observaciones</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            multiline
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Ejemplo: manchas difíciles, prendas delicadas, etc."
          />
          <Text style={styles.label}>Fecha estimada de entrega</Text>
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
            <Text style={styles.resumenItem}>
              Subtotal prendas: ${calcularSubtotalPrendas()}
            </Text>
            {despacho && (
              <Text style={styles.resumenItem}>
                Costo de despacho: ${COSTO_DESPACHO}
              </Text>
            )}
            <Text style={styles.totalText}>Total a pagar: ${calcularTotal()}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleGuardar}>
            <Text style={styles.buttonText}>Guardar Comanda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: '#ff6600ff' }]}>← Volver</Text>
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
      
    )}
  </View>
);
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    alignItems: 'center',
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
    marginBottom: 40,
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
    boxSizing: 'border-box',
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
    overflow: 'hidden',
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
  inputObservacionesWeb: {
    height: 120,
    textAlignVertical: 'top',
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
  totalText: { 
    marginTop: 10, 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#ff6600ff',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
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
  despachoButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  despachoButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  despachoButtonActive: {
    backgroundColor: '#ff6600ff',
    borderColor: '#ff6600ff',
  },
  despachoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  despachoButtonTextActive: {
    color: '#fff',
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6600ff',
    marginTop: 15,
  },
});