import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, 
  Platform, useWindowDimensions, Alert, TouchableOpacity
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { handleLogin,handlePasswordReset  } from '../control/loginControl';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");


  const { width } = useWindowDimensions(); 
  const navigation = useNavigation();

  const isWeb = Platform.OS === 'web';
  const containerWidth = isWeb ? (width > 600 ? 400 : '80%') : '90%';

  const onLogin = async () => {
    console.log(" Validando usuario...");
    setLoading(true); 
    const result = await handleLogin(email, password);
    setLoading(false);
    if (!result.success) {
    if (result.needsVerification) {
    Alert.alert(
      "Correo no verificado",
      "Tu correo no está verificado. ¿Quieres reenviar el correo de verificación?",
      [
        { text: "Cancelar" },
        {
          text: "Reenviar",
          onPress: async () => {
            try {
              await auth.currentUser.sendEmailVerification();
              Alert.alert("Enviado", "Te enviamos nuevamente el correo de verificación.");
            } catch (err) {
              Alert.alert("Error", "No se pudo enviar el correo de verificación.");
            }
          }
        }
      ]
    );
    return;
  }
    Alert.alert("Error", result.message);
    return;
  }
    const { rol, nombre, correo, numero, rut, uid } = result.user;
    if (rol === "administrador") {
      navigation.reset({
        index: 0,
        routes: [
          { 
            name: "AdministradorHome", 
            params: { uid, nombre, correo, numero, rut, rol } 
          }
        ],
      });
    }
    else if (rol === "gerente") {
      navigation.reset({
        index: 0,
        routes: [
          { 
            name: "Gerente", 
            params: { uid, nombre, correo, numero, rut, rol } 
          }
        ],
      });
    } 
    else if (rol === "recepcionista") {
      navigation.reset({
        index: 0,
        routes: [
          { 
            name: "RecepcionistaHome", 
            params: { uid, nombre, correo, numero, rut, rol } 
          }
        ],
      });
    } 
    else {
      Alert.alert("Error", "Rol desconocido");
      console.log("Rol desconocido:", rol);
    }
  };

  return (
    <View style={styles.page}>
      <View style={[styles.container, { width: containerWidth }]}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.button}>
          <Button title="Ingresar" onPress={onLogin} color="#ff6600ff" />
        </View>
        <TouchableOpacity onPress={() => setShowResetModal(true)} style={{ marginBottom: 15 }}>
          <Text style={{ color: "#0066cc", fontSize: 14 }}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>© 2025 El Cobre Spa</Text>
      </View>
      {loading && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <Text style={styles.overlayText}>Iniciando sesión...</Text>
          </View>
        </View>
      )}
      {showResetModal && (
        <View style={styles.overlay}>
          <View style={styles.resetBox}>
            <Text style={styles.resetTitle}>Recuperar contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu correo"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
            />
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              
              <TouchableOpacity 
                style={[styles.resetButton, { backgroundColor: "#ccc" }]}
                onPress={() => setShowResetModal(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.resetButton, { backgroundColor: "#ff6600" }]}
                onPress={async () => {
                  if (!resetEmail) {
                    Alert.alert("Error", "Ingresa un correo.");
                    return;
                  }
                  const { success, message } = await handlePasswordReset(resetEmail);
                  Alert.alert(success ? "Correo enviado" : "Error", message);
                  setShowResetModal(false);
                }}
              >
                <Text style={{ color: "#fff" }}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    marginTop: 5,
    marginBottom: 15,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
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

    resetBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },

  resetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  resetButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  }

});