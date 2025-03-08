import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BluetoothManager from './src/screens/BluetoothManager';
import DeviceControlScreen from './src/screens/DeviceControlScreen';
import KeyboardScreen from './src/screens/KeyboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BluetoothManager">
        <Stack.Screen 
          name="BluetoothManager" 
          component={BluetoothManager} 
          options={{ title: 'Bluetooth Устройства' }} 
        />
        <Stack.Screen 
          name="DeviceControlScreen" 
          component={DeviceControlScreen} 
          options={{ title: 'Управление устройством' }} 
        />
        <Stack.Screen 
          name="KeyboardScreen" 
          component={KeyboardScreen} 
          options={{ 
            title: 'Клавиатура',
            headerShown: false  // Скрываем заголовок, так как у нас есть свой в компоненте
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}