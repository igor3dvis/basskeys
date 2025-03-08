import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const DeviceControlScreen = ({ route, navigation }) => {
  // Извлекаем данные устройства из навигации, но очищаем их от несериализуемых свойств
  const rawDevice = route.params.device;
  const device = {
    address: rawDevice.address,
    name: rawDevice.name || 'Неизвестное устройство',
    id: rawDevice.id,
    bonded: rawDevice.bonded
  };
  
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastPingStatus, setLastPingStatus] = useState(null);
  
  // Используем useRef для сохранения таймера между рендерами
  const connectionCheckTimerRef = useRef(null);
  
  // Функция для проверки статуса соединения
  const checkConnectionStatus = async () => {
    if (!connected) return;
    
    try {
      // Проверяем, действительно ли устройство подключено
      const isConnected = await RNBluetoothClassic.isDeviceConnected(device.address);
      
      // Обновляем статус последнего пинга
      const timestamp = new Date().toLocaleTimeString();
      
      if (isConnected) {
        setLastPingStatus(`Соединение активно (${timestamp})`);
        console.log('Проверка соединения: устройство подключено');
      } else {
        setLastPingStatus(`Соединение потеряно (${timestamp})`);
        console.log('Проверка соединения: устройство отключено');
        setConnected(false);
      }
      
    } catch (error) {
      console.error('Ошибка при проверке соединения:', error);
      setLastPingStatus(`Ошибка соединения (${new Date().toLocaleTimeString()})`);
      setConnected(false);
    }
  };
  
  // Эффект для настройки периодической проверки соединения
  useEffect(() => {
    // Очистим предыдущий таймер если он существует
    if (connectionCheckTimerRef.current) {
      clearInterval(connectionCheckTimerRef.current);
      connectionCheckTimerRef.current = null;
    }
    
    // Если устройство подключено, начинаем периодическую проверку
    if (connected) {
      // Выполняем первую проверку сразу
      checkConnectionStatus();
      
      // Устанавливаем периодическую проверку каждые 5 секунд
      connectionCheckTimerRef.current = setInterval(checkConnectionStatus, 5000);
    }
    
    // Очистка при размонтировании или изменении состояния подключения
    return () => {
      if (connectionCheckTimerRef.current) {
        clearInterval(connectionCheckTimerRef.current);
        connectionCheckTimerRef.current = null;
      }
    };
  }, [connected, device.address]);
  
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
      setLastPingStatus(`Подключено (${new Date().toLocaleTimeString()})`);
      
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
      setLastPingStatus(null);
    } catch (error) {
      console.error('Ошибка отключения:', error);
      Alert.alert('Ошибка', `Не удалось отключиться от устройства: ${error.message}`);
    }
  };
  
  // Отправка команды на устройство без ожидания ответа
  const sendCommand = async (command) => {
    if (!connected) {
      Alert.alert('Не подключено', 'Сначала подключитесь к устройству');
      return;
    }
    
    try {
      console.log('Отправка команды:', command);
      // Отправляем данные на устройство
      await RNBluetoothClassic.writeToDevice(device.address, command);
    } catch (error) {
      console.error('Ошибка отправки:', error);
      Alert.alert('Ошибка', `Не удалось отправить команду: ${error.message}`);
    }
  };

  // Переход на экран клавиатуры
  const goToKeyboard = () => {
    if (!connected) {
      Alert.alert('Не подключено', 'Сначала подключитесь к устройству');
      return;
    }
    
    navigation.navigate('KeyboardScreen', { device });
  };

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      // Остановка таймера проверки соединения
      if (connectionCheckTimerRef.current) {
        clearInterval(connectionCheckTimerRef.current);
      }
      
      // Отключение от устройства при выходе
      if (connected) {
        try {
          RNBluetoothClassic.disconnectFromDevice(device.address)
            .catch(error => console.error('Ошибка отключения при выходе:', error));
        } catch (e) {
          console.error('Ошибка при попытке отключения:', e);
        }
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
        {lastPingStatus && connected && (
          <Text style={styles.pingStatus}>{lastPingStatus}</Text>
        )}
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

      <View style={styles.keyboardSection}>
        <Text style={styles.sectionTitle}>Клавиатура</Text>
        <Button
          title="Перейти к клавиатуре"
          onPress={goToKeyboard}
          disabled={!connected}
          color="#2196F3"
        />
        <Text style={styles.keyboardDescription}>
          Используйте клавиатуру для отправки координат касания на устройство
        </Text>
      </View>

      {connecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Подключение...</Text>
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
  },
  pingStatus: {
    fontSize: 14,
    color: '#0066cc',
    marginTop: 4,
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
  keyboardSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  keyboardDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 8,
    fontSize: 16,
  },
});

export default DeviceControlScreen;