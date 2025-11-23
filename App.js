import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';

import { auth, db } from './firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import LoginScreen from './screens/LoginScreen';
import AdministradorHomeScreen from './screens/AdministradorHomeScreen';
import RecepcionistaHomeScreen from './screens/RecepcionistaHomeScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [userData, setUserData] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Cargando...');
  const [isError, setIsError] = useState(false);

  const INTRANET_URL = "https://lavanderia-el-cobre.vercel.app/intranet/dashboard";

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const url = await Linking.getInitialURL();

        if (url) {
          let token = null;
          if (url.includes('token=')) {
            const queryString = url.split('?')[1];
            if (queryString) {
              const pairs = queryString.split('&');
              for (const pair of pairs) {
                const [key, value] = pair.split('=');
                if (key === 'token' || key === 'auth_token') {
                  token = value;
                  break;
                }
              }
            }
          }

          if (token) {
            setStatusMessage('Verificando credenciales...');

            await signOut(auth);

            const userDoc = await getDoc(doc(db, 'usuarios', token));

            if (userDoc.exists()) {
              const data = userDoc.data();
              const rol = data.rol;

              setUserData(data);

              if (rol === 'administrador') {
                setInitialRoute('AdministradorHome');
              } else if (rol === 'recepcionista') {
                setInitialRoute('RecepcionistaHome');
              } else {
                console.warn('Rol no reconocido:', rol);
                setIsError(true);
                setStatusMessage('Rol no autorizado.');
                setTimeout(() => window.location.href = INTRANET_URL, 3000);
                return;
              }

              setIsLoading(false);
              return;
            } else {
              setIsError(true);
              setStatusMessage('Credenciales inválidas.');
              setTimeout(() => window.location.href = INTRANET_URL, 3000);
              return;
            }
          }
        }

        // Si no hay token, vamos al login normal
        setIsLoading(false);

      } catch (error) {
        console.error("Error verificando token:", error);
        setIsError(true);
        setStatusMessage('Error de conexión.');
        setTimeout(() => setIsLoading(false), 2000);
      }
    };

    handleDeepLink();
  }, []);

  if (isLoading || isError) {
    return (
      <View style={styles.loadingContainer}>
        {isError ? (
          <Text style={styles.errorIcon}>⚠️</Text>
        ) : (
          <ActivityIndicator size="large" color="#f97316" style={styles.spinner} />
        )}

        <Text style={[styles.loadingText, isError && styles.errorText]}>
          {statusMessage}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen
          name="AdministradorHome"
          component={AdministradorHomeScreen}
          initialParams={userData}
        />

        <Stack.Screen
          name="RecepcionistaHome"
          component={RecepcionistaHomeScreen}
          initialParams={userData}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    transform: [{ scale: 1.5 }],
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ea580c',
    fontFamily: 'System',
  },
  errorText: {
    color: '#dc2626',
  },
  errorIcon: {
    fontSize: 50,
    marginBottom: 20,
  }
});