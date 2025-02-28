import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const BluetoothManager = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);

  useEffect(() => {
    // Проверяем статус Bluetooth при монтировании компонента
    checkBluetoothStatus();
    console.log("Доступные методы Bluetooth:", Object.keys(RNBluetoothClassic));

    // Подписываемся на события изменения состояния Bluetooth
    const bluetoothStateListener = RNBluetoothClassic.onStateChanged((event) => {
      setIsEnabled(event.enabled);
      console.log(`Bluetooth состояние изменено: ${event.enabled}`);
    });

    // Очистка подписок
    return () => {
      if (bluetoothStateListener) {
        bluetoothStateListener.remove();
      }
      if (connectedDevice) {
        disconnectFromDevice();
      }
    };
  }, []);

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        if (
          grants[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
          grants[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          grants[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Все разрешения получены');
          return true;
        } else {
          console.log('Разрешения отклонены');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else if (Platform.OS === 'android' && Platform.Version < 31) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const checkBluetoothStatus = async () => {
    try {
      const available = await RNBluetoothClassic.isBluetoothAvailable();
      console.log(`Bluetooth доступен: ${available}`);

      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      console.log(`Bluetooth включен: ${enabled}`);
      
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Ошибка при проверке статуса Bluetooth:', error);
    }
  };

  const enableBluetooth = async () => {
    if (!(await requestBluetoothPermissions())) {
      Alert.alert('Ошибка', 'Требуются разрешения для использования Bluetooth');
      return;
    }

    try {
      const enabled = await RNBluetoothClassic.requestBluetoothEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Ошибка при включении Bluetooth:', error);
    }
  };

  const startDiscovery = async () => {
    if (!(await requestBluetoothPermissions())) {
      return;
    }

    try {
      setDiscovering(true);
      setDevices([]);
      
      // Получаем список сопряженных устройств
      const paired = await RNBluetoothClassic.getBondedDevices();
      console.log('Сопряженные устройства:', paired);
      
      setDevices(paired);

      // Запускаем обнаружение новых устройств
      console.log('Начинаем поиск устройств...');
      const discovered = await RNBluetoothClassic.startDiscovery();
      
      // Объединяем списки устройств, избегая дубликатов
      const newDevices = [...paired];
      discovered.forEach(device => {
        if (!newDevices.some(d => d.address === device.address)) {
          newDevices.push(device);
        }
      });
      
      setDevices(newDevices);
      console.log('Найдено устройств:', newDevices.length);
    } catch (error) {
      console.error('Ошибка при поиске устройств:', error);
      Alert.alert('Ошибка', `Не удалось выполнить поиск устройств: ${error.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const connectToDevice = async (device) => {
    try {
      console.log(`Подключение к устройству: ${device.name}`);
      const connected = await RNBluetoothClassic.connectToDevice(device.address);
      console.log('Подключено:', connected);
      
      setConnectedDevice(connected);
      
      // Настраиваем прослушивание данных
      const connectionListener = RNBluetoothClassic.onDeviceDataReceived(
        connected.address,
        onDataReceived
      );
      
      return connected;
    } catch (error) {
      console.error(`Ошибка при подключении к ${device.name}:`, error);
      Alert.alert('Ошибка', `Не удалось подключиться к устройству: ${error.message}`);
      return null;
    }
  };

  const disconnectFromDevice = async () => {
    if (!connectedDevice) return;
    
    try {
      await RNBluetoothClassic.disconnectFromDevice(connectedDevice.address);
      console.log(`Отключено от устройства: ${connectedDevice.name}`);
      setConnectedDevice(null);
    } catch (error) {
      console.error('Ошибка при отключении:', error);
    }
  };

  const onDataReceived = (data) => {
    console.log('Получены данные:', data);
    // Здесь можно обрабатывать полученные данные
  };

  const sendData = async (data) => {
    if (!connectedDevice) return;
    
    try {
      const success = await connectedDevice.write(data);
      console.log('Данные отправлены:', success);
      return success;
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
      return false;
    }
  };

  const renderDeviceItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.deviceItem}
        onPress={() => connectToDevice(item)}
      >
        <Text style={styles.deviceName}>{item.name || 'Неизвестное устройство'}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Управление Bluetooth</Text>
      
      <View style={styles.statusContainer}>
        <Text>Статус Bluetooth: {isEnabled ? 'Включен' : 'Выключен'}</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, !isEnabled ? styles.primaryButton : styles.disabledButton]}
          onPress={enableBluetooth}
          disabled={isEnabled}
        >
          <Text style={styles.buttonText}>Включить Bluetooth</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, discovering && styles.disabledButton]}
          onPress={startDiscovery}
          disabled={!isEnabled || discovering}
        >
          <Text style={styles.buttonText}>
            {discovering ? 'Поиск...' : 'Найти устройства'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {connectedDevice ? (
        <View style={styles.connectedContainer}>
          <Text style={styles.subtitle}>Подключено к устройству:</Text>
          <Text style={styles.deviceName}>{connectedDevice.name}</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={disconnectFromDevice}
          >
            <Text style={styles.buttonText}>Отключиться</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.devicesContainer}>
          <Text style={styles.subtitle}>Доступные устройства:</Text>
          {devices.length > 0 ? (
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.address}
              style={styles.devicesList}
            />
          ) : (
            <Text style={styles.noDevicesText}>
              {discovering
                ? 'Выполняется поиск устройств...'
                : 'Устройства не найдены'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#222222'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222222'
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#2196f3',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#b0bec5',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  devicesContainer: {
    flex: 1,
  },
  devicesList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222'
  },
  deviceAddress: {
    color: '#666',
  },
  noDevicesText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  connectedContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
});

export default BluetoothManager;