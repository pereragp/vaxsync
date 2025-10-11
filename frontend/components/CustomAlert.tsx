import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  onClose?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  icon = 'info',
  onClose
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const iconConfig = {
    success: { name: 'checkmark-circle', color: '#10b981', bgColor: '#d1fae5' },
    error: { name: 'close-circle', color: '#ef4444', bgColor: '#fee2e2' },
    warning: { name: 'warning', color: '#f59e0b', bgColor: '#fef3c7' },
    info: { name: 'information-circle', color: '#3b82f6', bgColor: '#dbeafe' },
    question: { name: 'help-circle', color: '#8b5cf6', bgColor: '#ede9fe' }
  }[icon];

  const handleButtonPress = (button: CustomAlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: '100%',
            maxWidth: 400,
          }}
        >
          <View className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Icon Header */}
            <LinearGradient
              colors={[iconConfig.bgColor, '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="items-center py-6"
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: iconConfig.bgColor }}
              >
                <Ionicons
                  name={iconConfig.name as any}
                  size={48}
                  color={iconConfig.color}
                />
              </View>
            </LinearGradient>

            {/* Content */}
            <View className="px-6 pb-6">
              <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                {title}
              </Text>
              <Text className="text-base text-gray-600 text-center leading-6 mb-6">
                {message}
              </Text>

              {/* Buttons */}
              <View className="space-y-2">
                {buttons.map((button, index) => {
                  const buttonStyle =
                    button.style === 'destructive'
                      ? 'bg-red-500'
                      : button.style === 'cancel'
                      ? 'bg-gray-500'
                      : 'bg-blue-500';

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleButtonPress(button)}
                      className={`${buttonStyle} rounded-xl py-4 px-6 shadow-lg`}
                      style={{
                        elevation: 4,
                      }}
                    >
                      <Text className="text-white text-center font-semibold text-base">
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

