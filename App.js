// App с навигацией /////////////////////////////////////////////////////////////////////////

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BluetoothManager from './src/screens/BluetoothManager';
import DeviceControlScreen from './src/screens/DeviceControlScreen';

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}


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
