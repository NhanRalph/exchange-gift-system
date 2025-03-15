import React, { useEffect, useState } from 'react';
import { 
  View, 
  Image, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  TouchableWithoutFeedback 
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ImagesModalViewerProps {
  images: string[];
  initialIndex?: number;
  isVisible: boolean;
  onClose: () => void;
}

const ImagesModalViewer: React.FC<ImagesModalViewerProps> = ({ 
  images, 
  initialIndex = 0,
  isVisible, 
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const handleSwipeGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      // Vuốt sang trái
      if (translationX < -50 && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      
      // Vuốt sang phải
      if (translationX > 50 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          alignItems: 'center' 
        }}>
          <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
            <View style={{
              width: '100%', 
              height: '100%', 
              justifyContent: 'center', 
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Nút điều hướng trái */}
              {currentIndex > 0 && (
                <TouchableOpacity 
                  onPress={() => setCurrentIndex(currentIndex - 1)}
                  style={{
                    position: 'absolute', 
                    left: 20, 
                    top: '50%',
                    transform: [{ translateY: -35 }],
                    paddingVertical: 15,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    zIndex: 100
                  }}
                >
                  <Icon name="chevron-left" size={40} color="white" />
                </TouchableOpacity>
              )}

              {/* Nút điều hướng phải */}
              {currentIndex < images.length - 1 && (
                <TouchableOpacity 
                  onPress={() => setCurrentIndex(currentIndex + 1)}
                  style={{
                    position: 'absolute', 
                    right: 20, 
                    top: '50%',
                    transform: [{ translateY: -35 }],
                    paddingVertical: 15,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    zIndex: 100
                  }}
                >
                  <Icon name="chevron-right" size={40} color="white" />
                </TouchableOpacity>
              )}

              {/* Hình ảnh hiện tại */}
              <Image 
                source={{ uri: images[currentIndex] }}
                style={{ 
                  width: '90%', 
                  height: '90%', 
                  resizeMode: 'contain' 
                }}
              />
            </View>
          </PanGestureHandler>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ImagesModalViewer;
