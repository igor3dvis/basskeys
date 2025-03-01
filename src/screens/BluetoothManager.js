import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, Alert, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const BluetoothManager = ({ navigation }) => {
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [deviceList, setDeviceList] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Проверяем состояние Bluetooth при загрузке
    checkBluetoothStatus();
  }, []);

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS или другие платформы
  };

  const checkBluetoothStatus = async () => {
    try {
      // Проверяем, включен ли Bluetooth
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      setIsBluetoothEnabled(enabled);
      
      if (enabled) {
        const hasPermissions = await requestBluetoothPermissions();
        if (hasPermissions) {
          getBondedDevices();
        } else {
          Alert.alert('Разрешения не предоставлены', 'Необходимы разрешения для работы с Bluetooth');
        }
      }
    } catch (error) {
      console.error('Ошибка проверки статуса Bluetooth:', error);
      Alert.alert('Ошибка', 'Не удалось проверить статус Bluetooth');
    }
  };

  const enableBluetooth = async () => {
    try {
      // Запрашиваем включение Bluetooth
      await RNBluetoothClassic.requestBluetoothEnabled();
      setIsBluetoothEnabled(true);
      getBondedDevices();
    } catch (error) {
      console.error('Ошибка включения Bluetooth:', error);
      Alert.alert('Ошибка', 'Не удалось включить Bluetooth');
    }
  };

  const getBondedDevices = async () => {
    try {
      setIsScanning(true);
      // Получаем список сопряженных устройств
      const devices = await RNBluetoothClassic.getBondedDevices();
      setDeviceList(devices);
      console.log('Сопряженные устройства:', devices);
    } catch (error) {
      console.error('Ошибка получения сопряженных устройств:', error);
      Alert.alert('Ошибка', 'Не удалось получить список устройств');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = (device) => {
    // Переходим на экран управления устройством
    navigation.navigate('DeviceControlScreen', { device });
  };

  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.deviceItem} 
      onPress={() => connectToDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name || 'Неизвестное устройство'}</Text>
      <Text style={styles.deviceAddress}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Bluetooth: {isBluetoothEnabled ? 'Включен' : 'Выключен'}
        </Text>
        {!isBluetoothEnabled && (
          <Button title="Включить Bluetooth" onPress={enableBluetooth} />
        )}
      </View>

      <View style={styles.actionsContainer}>
        <Button 
          title={isScanning ? "Сканирование..." : "Обновить список устройств"} 
          onPress={getBondedDevices}
          disabled={!isBluetoothEnabled || isScanning}
        />
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Доступные устройства:</Text>
        {deviceList.length > 0 ? (
          <FlatList
            data={deviceList}
            renderItem={renderDeviceItem}
            keyExtractor={item => item.address}
          />
        ) : (
          <Text style={styles.emptyListText}>
            {isBluetoothEnabled 
              ? 'Нет сопряженных устройств. Выполните сопряжение в настройках устройства.' 
              : 'Включите Bluetooth для поиска устройств'}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#886622',
  },
  deviceItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#226622',
  },
  deviceAddress: {
    color: '#666',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
});

export default BluetoothManager;