// App с навигацией /////////////////////////////////////////////////////////////////////////

import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BluetoothManager from './src/screens/BluetoothManager';
import DeviceControlScreen from './src/screens/DeviceControlScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <Stack.Navigator initialRouteName="BluetoothManager">
          <Stack.Screen 
            name="BluetoothManager" 
            component={BluetoothManager} 
            options={{ title: 'Bluetooth Устройства' }} 
          />
          <Stack.Screen 
            name="DeviceControl" 
            component={DeviceControlScreen} 
            options={{ title: 'Управление устройством' }} 
          />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;


//*********************************************************************************** */
// import React from 'react';
// import { SafeAreaView, StatusBar, StyleSheet, Text } from 'react-native';
// import BluetoothManager from './src/screens/BluetoothManager';

// //import TryScreen from './src/screens/TryScreen.js';
// // import OldApp from './App.old.tsx';

// const App = () => {
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
//       <BluetoothManager />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
// });

// export default App;
