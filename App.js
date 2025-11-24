import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';

import { auth, db } from './firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import LoginScreen from './screens/LoginScreen';
import AdministradorHomeScreen from './screens/AdministradorHomeScreen';
import RecepcionistaHomeScreen from './screens/RecepcionistaHomeScreen';
import RegistrarClienteScreen from './screens/RegistrarClienteScreen';
import CrearComandaScreen from './screens/CrearComandaScreen';
import PrendasEmpresasScreen from './screens/PrendasEmpresasScreen';
import PrendasParticularesScreen from './screens/PrendasParticularesScreen';
import PerfilScreen from './screens/perfilUsuarioScreen';
import ComandasHistoricasScreen from './screens/ComandasHistoricasScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [userData, setUserData] = useState(null);
  
  // URL de la Intranet para volver si falla
  const INTRANET_URL = "https://lavanderia-el-cobre.vercel.app/intranet/dashboard";

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        let token = null;

        if (url) {
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
                setTimeout(() => window.location.href = INTRANET_URL, 1000);
                return;
              }
              
              setIsLoading(false);
              return;
            } else {
              setTimeout(() => window.location.href = INTRANET_URL, 1000);
              return;
            }
          }
        }

        setIsLoading(false);

      } catch (error) {
        console.error("Error verificando token:", error);
        setIsLoading(false); 
      }
    };

    handleDeepLink();
  }, []);

  if (isLoading) {
    return null;
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
        <Stack.Screen name="RegistrarCliente" component={RegistrarClienteScreen} />
        <Stack.Screen name="CrearComanda" component={CrearComandaScreen} />
        <Stack.Screen name="PrendasParticulares" component={PrendasParticularesScreen} />
        <Stack.Screen name="PrendasEmpresas" component={PrendasEmpresasScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="ComandasHistoricas" component={ComandasHistoricasScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
});