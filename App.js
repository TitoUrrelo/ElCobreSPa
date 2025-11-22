import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RecepcionistaHomeScreen from './screens/RecepcionistaHomeScreen';
import RegistrarClienteScreen from './screens/RegistrarClienteScreen';
import CrearComandaScreen from './screens/CrearComandaScreen';
import AdministradorHomeScreen from './screens/AdministradorHomeScreen';
import PrendasEmpresasScreen from './screens/PrendasEmpresasScreen';
import PrendasParticularesScreen from './screens/PrendasParticularesScreen';
import CreateUserScreen from './screens/CrearUsuarioScreen';
import PerfilScreen from './screens/perfilUsuarioScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AdministradorHome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RecepcionistaHome" component={RecepcionistaHomeScreen} />
        <Stack.Screen name="AdministradorHome" component={AdministradorHomeScreen} />
        <Stack.Screen name="RegistrarCliente" component={RegistrarClienteScreen} />
        <Stack.Screen name="CrearComanda" component={CrearComandaScreen} />

        <Stack.Screen name="PrendasParticulares" component={PrendasParticularesScreen} />
        <Stack.Screen name="PrendasEmpresas" component={PrendasEmpresasScreen} />

        <Stack.Screen name="CrearUsuario" component={CreateUserScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}