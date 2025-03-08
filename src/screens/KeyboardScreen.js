import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  SafeAreaView,
  Button,
  PanResponder,
  Dimensions
} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const KeyboardScreen = ({ route, navigation }) => {
  const { device } = route.params;
  const [lastTouchCoordinates, setLastTouchCoordinates] = useState(Array(7).fill(0));
  const [connected, setConnected] = useState(true);
  const [isAnyTouchActive, setIsAnyTouchActive] = useState(false);
  
  // Ref для родительского элемента и таймера отправки
  const klavierParentRef = useRef(null);
  const sendIntervalRef = useRef(null);
  const activeTouchesRef = useRef(new Set());
  
  // Используем ref для хранения текущих координат, чтобы их можно было использовать в таймере
  const currentCoordinatesRef = useRef(Array(7).fill(0));
  
  // Функция для обновления определенной координаты
  const updateCoordinate = (index, value) => {
    const newCoordinates = [...lastTouchCoordinates];
    newCoordinates[index] = value;
    currentCoordinatesRef.current = newCoordinates;
    setLastTouchCoordinates(newCoordinates);
    return newCoordinates;
  };
  
  // Функция для отправки координат на устройство
  const sendCoordinates = async (coordinates) => {
    if (!connected) return;
    
    try {
      // Форматируем координаты в строку (добавляем символ новой строки)
      const coordString = `X:${coordinates.join(',')}\n`;
      
      // console.log('Отправка координат:', coordString);
      
      // Отправляем данные на устройство
      await RNBluetoothClassic.writeToDevice(device.address, coordString);
    } catch (error) {
      console.error('Ошибка отправки координат:', error);
      setConnected(false);
    }
  };
  
  // Настраиваем интервал для периодической отправки координат
  useEffect(() => {
    // Устанавливаем интервал отправки данных каждые 50 мс
    sendIntervalRef.current = setInterval(() => {
      if (activeTouchesRef.current.size > 0 || isAnyTouchActive) {
        sendCoordinates(currentCoordinatesRef.current);
      }
    }, 50);
    
    // Очистка при размонтировании компонента
    return () => {
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
    };
  }, [isAnyTouchActive]);
  
  // Функция для возврата на экран управления
  const goBack = () => {
    // Перед возвратом обнуляем все координаты
    const zeroCoordinates = Array(7).fill(0);
    sendCoordinates(zeroCoordinates);
    navigation.goBack();
  };
  
  // Получаем размеры экрана
  const screenWidth = Dimensions.get('window').width;
  
  // Создаем PanResponder для каждого блока
  const createResponderForBlock = (index) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        // Начало касания
        const { locationX } = evt.nativeEvent;
        // Нормализуем координату X относительно ширины блока (пропорционально от 0 до 300)
        const normalizedX = Math.round((locationX / (screenWidth - 32)) * 300);
        
        // Обновляем набор активных касаний
        activeTouchesRef.current.add(index);
        setIsAnyTouchActive(true);
        
        // Обновляем координату
        updateCoordinate(index, normalizedX);
      },
      
      onPanResponderMove: (evt) => {
        // Движение пальца
        const { locationX } = evt.nativeEvent;
        // Нормализуем координату X относительно ширины блока (пропорционально от 0 до 300)
        const normalizedX = Math.round((locationX / (screenWidth - 32)) * 300);
        
        // Обновляем координату
        updateCoordinate(index, normalizedX);
      },
      
      onPanResponderRelease: () => {
        // Конец касания - обнуляем только значение для этого блока
        updateCoordinate(index, 0);
        
        // Удаляем из набора активных касаний
        activeTouchesRef.current.delete(index);
        if (activeTouchesRef.current.size === 0) {
          setIsAnyTouchActive(false);
        }
      },
      
      onPanResponderTerminate: () => {
        // Касание прервано - обнуляем только значение для этого блока
        updateCoordinate(index, 0);
        
        // Удаляем из набора активных касаний
        activeTouchesRef.current.delete(index);
        if (activeTouchesRef.current.size === 0) {
          setIsAnyTouchActive(false);
        }
      }
    });
  };
  
  // Создаем блоки клавиатуры с индивидуальными PanResponder
  const renderKeyboardBlocks = () => {
    const blocks = [];
    
    for (let i = 0; i < 7; i++) {
      const panResponder = createResponderForBlock(i);
      
      blocks.push(
        <View
          key={`klave${i+1}`}
          style={[
            styles.keyboardBlock,
            lastTouchCoordinates[i] > 0 ? styles.activeBlock : null
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.blockText}>{`Klave ${i+1}`}</Text>
          <Text style={styles.coordinateText}>
            X: {lastTouchCoordinates[i]}
          </Text>
        </View>
      );
    }
    
    return blocks;
  };
  
  // Эффект для обнуления координат при размонтировании
  useEffect(() => {
    return () => {
      // Отправляем нули перед размонтированием компонента
      const zeroCoordinates = Array(7).fill(0);
      sendCoordinates(zeroCoordinates);
    };
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Клавиатура</Text>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.touchStatus}>
          {isAnyTouchActive ? 'Активное касание' : 'Нет активных касаний'}
        </Text>
      </View>
      
      <View 
        style={styles.klavierParent}
        ref={klavierParentRef}
      >
        {renderKeyboardBlocks()}
      </View>
      
      <View style={styles.footer}>
        <Button
          title="Вернуться к управлению устройством"
          onPress={goBack}
          color="#2196F3"
        />
        
        {!connected && (
          <Text style={styles.connectionError}>
            Соединение потеряно. Вернитесь на экран управления.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  touchStatus: {
    fontSize: 12,
    color: '#0066cc',
    marginTop: 4,
  },
  klavierParent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  keyboardBlock: {
    width: '100%',
    height: '12%',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  activeBlock: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  blockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  coordinateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  connectionError: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default KeyboardScreen;