import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, NativeEventEmitter } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const DeviceControlScreen = ({ route, navigation }) => {
  // Извлекаем данные устройства из навигации, но очищаем их от несериализуемых свойств
  const rawDevice = route.params.device;
  // Создаем чистый объект устройства без несериализуемых свойств
  const device = {
    address: rawDevice.address,
    name: rawDevice.name || 'Неизвестное устройство',
    id: rawDevice.id,
    bonded: rawDevice.bonded
  };
  
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [receivedData, setReceivedData] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  
  // Функция для подключения к устройству
  const connectToDevice = async () => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      setConnectionError(null);
      
      console.log('Попытка подключения к устройству:', device.name);
      
      // Подключаемся к устройству
      await RNBluetoothClassic.connectToDevice(device.address);
      console.log('Успешно подключено к устройству');
      
      // Успешное подключение
      setConnected(true);
      
    } catch (error) {
      console.error('Ошибка подключения:', error);
      setConnectionError(`Ошибка: ${error.message}`);
      Alert.alert('Ошибка подключения', `Не удалось подключиться к устройству: ${error.message}`);
    } finally {
      setConnecting(false);
    }
  };
  
  // Отключение от устройства
  const disconnectFromDevice = async () => {
    try {
      await RNBluetoothClassic.disconnectFromDevice(device.address);
      console.log('Устройство отключено');
      setConnected(false);
    } catch (error) {
      console.error('Ошибка отключения:', error);
      Alert.alert('Ошибка', `Не удалось отключиться от устройства: ${error.message}`);
    }
  };
  
  // Отправка команды на устройство
  const sendCommand = async (command) => {
    if (!connected) {
      Alert.alert('Не подключено', 'Сначала подключитесь к устройству');
      return;
    }
    
    try {
      console.log('Отправка команды:', command);
      // Отправляем данные на устройство
      await RNBluetoothClassic.writeToDevice(device.address, command);
      
      // Добавляем отправленную команду в журнал
      setReceivedData(prev => [...prev, {
        message: `Отправлено: ${command}`,
        timestamp: new Date().toLocaleTimeString(),
        sent: true
      }]);
      
      // Через 1 секунду вручную проверяем ответ от устройства
      setTimeout(async () => {
        try {
          // Чтение данных с устройства
          const readData = await RNBluetoothClassic.readFromDevice(device.address);
          if (readData && readData.length > 0) {
            console.log('Получены данные:', readData);
            setReceivedData(prev => [...prev, {
              message: readData,
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        } catch (readError) {
          console.log('Ошибка при чтении данных:', readError);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Ошибка отправки:', error);
      Alert.alert('Ошибка', `Не удалось отправить команду: ${error.message}`);
    }
  };

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (connected) {
        RNBluetoothClassic.disconnectFromDevice(device.address)
          .catch(error => console.error('Ошибка отключения при выходе:', error));
      }
    };
  }, [connected, device.address]);

  // Настраиваем опрос устройства для получения данных
  useEffect(() => {
    let isActive = true;
    let pollInterval = null;
    
    if (connected) {
      // Функция для чтения данных с устройства
      const pollDevice = async () => {
        try {
          const available = await RNBluetoothClassic.available(device.address);
          if (available > 0) {
            const data = await RNBluetoothClassic.readFromDevice(device.address);
            console.log('Прочитаны данные:', data);
            
            if (isActive && data) {
              setReceivedData(prev => [...prev, {
                message: data,
                timestamp: new Date().toLocaleTimeString()
              }]);
            }
          }
        } catch (error) {
          console.error('Ошибка при опросе устройства:', error);
        }
      };
      
      // Начинаем опрос устройства каждые 2 секунды
      pollInterval = setInterval(pollDevice, 2000);
    }
    
    return () => {
      isActive = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [connected, device.address]);

  return (
    <View style={styles.container}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceAddress}>{device.address}</Text>
        <Text style={styles.connectionStatus}>
          Статус: {connecting ? 'Подключение...' : (connected ? 'Подключено' : 'Отключено')}
        </Text>
        {connectionError && (
          <Text style={styles.errorText}>{connectionError}</Text>
        )}
      </View>

      <View style={styles.connectionActions}>
        {!connected ? (
          <Button
            title={connecting ? "Подключение..." : "Подключиться"}
            onPress={connectToDevice}
            disabled={connecting}
          />
        ) : (
          <Button
            title="Отключиться"
            onPress={disconnectFromDevice}
            color="#ff5252"
          />
        )}
      </View>

      <View style={styles.controlPanel}>
        <Text style={styles.sectionTitle}>Управление устройством</Text>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, styles.onButton]}
            onPress={() => sendCommand('1')}
            disabled={!connected}
          >
            <Text style={styles.buttonText}>Включить LED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.offButton]}
            onPress={() => sendCommand('0')}
            disabled={!connected}
          >
            <Text style={styles.buttonText}>Выключить LED</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.sectionTitle}>Журнал данных</Text>
        {connecting && (
          <ActivityIndicator size="large" color="#0066cc" />
        )}
        <ScrollView style={styles.dataLog}>
          {receivedData.length > 0 ? (
            receivedData.map((item, index) => (
              <View 
                key={index}
                style={[
                  styles.dataItem,
                  item.sent ? styles.sentData : styles.receivedData
                ]}
              >
                <Text style={styles.timestamp}>{item.timestamp}</Text>
                <Text style={styles.dataText}>{item.message}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyDataText}>
              {connected ? 'Нет данных. Попробуйте отправить команду.' : 'Подключитесь к устройству для получения данных.'}
            </Text>
          )}
        </ScrollView>
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
  deviceInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#226622',
  },
  deviceAddress: {
    color: '#666',
    marginBottom: 8,
  },
  connectionStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#226622',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
  connectionActions: {
    marginBottom: 16,
  },
  controlPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#226622',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  onButton: {
    backgroundColor: '#4caf50',
  },
  offButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dataContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  dataLog: {
    flex: 1,
  },
  dataItem: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  sentData: {
    backgroundColor: '#e3f2fd',
  },
  receivedData: {
    backgroundColor: '#e8f5e9',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 14,
    color: '#666',
  },
  emptyDataText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
});

export default DeviceControlScreen;