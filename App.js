import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RecepcionistaHomeScreen from './screens/RecepcionistaHomeScreen';
import RegistrarClienteScreen from './screens/RegistrarClienteScreen';
import CrearComandaScreen from './screens/CrearComandaScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RecepcionistaHome" component={RecepcionistaHomeScreen} />
        <Stack.Screen name="RegistrarCliente" component={RegistrarClienteScreen} />
        <Stack.Screen name="CrearComanda" component={CrearComandaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
