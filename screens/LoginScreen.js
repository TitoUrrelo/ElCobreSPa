import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform, useWindowDimensions } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { width } = useWindowDimensions(); 

  const isWeb = Platform.OS === 'web';
  const containerWidth = isWeb ? (width > 600 ? 400 : '80%') : '90%';

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
          <Button title="Ingresar" onPress={() => {}} color="#ff6600ff" />
        </View>

        <Text style={styles.footerText}>© 2025 El Cobre Spa</Text>
      </View>
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
});
