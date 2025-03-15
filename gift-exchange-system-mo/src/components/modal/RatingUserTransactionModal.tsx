import Colors from '@/src/constants/Colors';
import { TransactionRatingType } from '@/src/shared/type';
import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet 
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface UserRatingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmitRating: (ratingData: TransactionRatingType) => void;
  userTransactionToRate: { userId: string, userName: string; transactionId: string };
}

const UserRatingModal: React.FC<UserRatingModalProps> = ({ 
  isVisible, 
  onClose, 
  onSubmitRating, 
  userTransactionToRate 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleRatingSubmit = () => {
    if (rating > 0) {
      onSubmitRating({
        rating,
        comment,
        ratedUserId: userTransactionToRate.userId,
        transactionId: userTransactionToRate.transactionId
      });
      onClose();
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity 
        key={star} 
        onPress={() => setRating(star)}
      >
        <MaterialIcons 
          name="star" 
          size={30} 
          color={star <= rating ? '#FFD700' : '#D3D3D3'} 
        />
      </TouchableOpacity>
    ));
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            Đánh giá { userTransactionToRate.userName }
          </Text>
          
          <View style={styles.starContainer}>
            {renderStars()}
          </View>
          
          <TextInput
            style={styles.commentInput}
            placeholderTextColor="#c4c4c4"
            placeholder="Thêm nhận xét của bạn (không bắt buộc)"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Huỷ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.submitButton, 
                rating === 0 && styles.disabledButton
              ]}
              onPress={handleRatingSubmit}
              disabled={rating === 0}
            >
              <Text style={styles.buttonText}>Gửi đánh giá</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 15
  },
  commentInput: {
    borderColor: "#c4c4c4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    width: '48%',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
  },
  submitButton: {
    backgroundColor: Colors.orange500
  },
  disabledButton: {
    backgroundColor: '#A9A9A9'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default UserRatingModal;
