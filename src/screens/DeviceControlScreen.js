import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const DeviceControlScreen = ({ route, navigation }) => {
  const { device } = route.params;
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    let connectionListener = null;
    
    const connectToDevice = async () => {
      try {
        const connected = await RNBluetoothClassic.connectToDevice(device.address);
        console.log('Подключено:', connected);
        setIsConnected(true);
        
        // Настраиваем прослушивание данных
        connectionListener = RNBluetoothClassic.onDeviceDataReceived(
          device.address,
          onDataReceived
        );
        
        // Добавляем приветственное сообщение
        addMessage('Устройство подключено!', 'system');
      } catch (error) {
        console.error(`Ошибка при подключении к ${device.name}:`, error);
        Alert.alert('Ошибка', `Не удалось подключиться к устройству: ${error.message}`);
        navigation.goBack();
      }
    };
    
    connectToDevice();
    
    // Очистка при размонтировании
    return () => {
      if (connectionListener) {
        connectionListener.remove();
      }
      disconnectFromDevice();
    };
  }, [device]);

  const onDataReceived = (data) => {
    console.log('Получены данные:', data);
    addMessage(data.data, 'received');
  };
  
  const addMessage = (text, type) => {
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      text, 
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const disconnectFromDevice = async () => {
    if (isConnected) {
      try {
        await RNBluetoothClassic.disconnectFromDevice(device.address);
        console.log(`Отключено от устройства: ${device.name}`);
        setIsConnected(false);
      } catch (error) {
        console.error('Ошибка при отключении:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    try {
      const success = await RNBluetoothClassic.writeToDevice(
        device.address,
        inputMessage
      );
      
      if (success) {
        addMessage(inputMessage, 'sent');
        setInputMessage('');
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      Alert.alert('Ошибка', `Сбой отправки: ${error.message}`);
    }
  };

  const sendSliderValue = async () => {
    try {
      const valueStr = sliderValue.toString();
      const success = await RNBluetoothClassic.writeToDevice(
        device.address,
        valueStr
      );
      
      if (success) {
        addMessage(`Отправлено значение: ${valueStr}`, 'sent');
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить значение');
      }
    } catch (error) {
      console.error('Ошибка при отправке значения ползунка:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceAddress}>{device.address}</Text>
        <Text style={[
          styles.connectionStatus, 
          { color: isConnected ? '#4CAF50' : '#F44336' }
        ]}>
          {isConnected ? 'Подключено' : 'Отключено'}
        </Text>
      </View>
      
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesList}
        ref={ref => {this.scrollView = ref}}
        onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}
      >
        {messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageItem,
              message.type === 'sent' && styles.sentMessage,
              message.type === 'received' && styles.receivedMessage,
              message.type === 'system' && styles.systemMessage,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.messageTime}>{message.timestamp}</Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.controlsContainer}>
        <Text style={styles.sliderLabel}>Значение: {sliderValue}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={sliderValue}
          onValueChange={setSliderValue}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#9E9E9E"
          thumbTintColor="#2196F3"
        />
        <TouchableOpacity 
          style={styles.sliderButton}
          onPress={sendSliderValue}
          disabled={!isConnected}
        >
          <Text style={styles.buttonText}>Отправить значение</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Введите сообщение..."
          placeholderTextColor="#9E9E9E"
        />
        <TouchableOpacity 
          style={[styles.sendButton, !isConnected && styles.disabledButton]}
          onPress={sendMessage}
          disabled={!isConnected || !inputMessage.trim()}
        >
          <Text style={styles.buttonText}>Отправить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  deviceInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceAddress: {
    color: '#757575',
    marginTop: 4,
  },
  connectionStatus: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  systemMessage: {
    backgroundColor: '#F5F5F5',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DeviceControlScreen;