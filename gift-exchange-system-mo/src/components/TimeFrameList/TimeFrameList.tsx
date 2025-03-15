import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from 'react-native';

interface Coordinates {
  latitude: string;
  longitude: string;
}

interface Address {
  addressId: string;
  address: string;
  addressCoordinates: Coordinates;
}

interface User {
  id: string;
  name: string;
  image: string;
}

interface Item {
  itemId: string;
  itemName: string;
  itemVideo: string | null;
  itemImages: string[];
  itemQuantity: number;
}

interface Transaction {
  id: string;
  status: string;
  requestId: string;
  requestNote: string | null;
  requester: User;
  requesterItem: Item | null;
  charitarian: User;
  charitarianItem: Item;
  createdAt: string;
  updateAt: string;
  appointmentDate: string;
  requesterAddress: Address;
  requesterPhone: string;
  charitarianAddress: Address;
  charitarianPhone: string;
  rejectMessage: string | null;
  transactionImages: string[];
  arrivedAtDestination: boolean;
  isVerifiedTransaction: boolean;
}

interface VolunteerTransactionByAddress {
  addressId: string;
  address: string;
  addressCoordinates: Coordinates;
  totalItem: number;
  transactions: Transaction[];
}

interface TimeFrame {
  timeFrame: string;
  volunteerTransactionByAddresses: VolunteerTransactionByAddress[];
}

interface TimeFrameListProps {
  timeFrames: TimeFrame[];
}

const TimeFrameList: React.FC<TimeFrameListProps> = ({ timeFrames }) => {
  const [expandedFrames, setExpandedFrames] = useState<Record<string, boolean>>({});
  const [expandedAddresses, setExpandedAddresses] = useState<Record<string, boolean>>({});

  const toggleTimeFrame = (timeFrame: string) => {
    setExpandedFrames(prev => ({
      ...prev,
      [timeFrame]: !prev[timeFrame]
    }));
  };

  const toggleAddress = (addressId: string) => {
    setExpandedAddresses(prev => ({
      ...prev,
      [addressId]: !prev[addressId]
    }));
  };

  const getTotalItems = (addresses: VolunteerTransactionByAddress[]): number => {
    return addresses.reduce((total, address) => total + address.totalItem, 0);
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'In_Progress':
        return '#2196F3';
      case 'Canceled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Image
          source={{ uri: item.charitarian.image }}
          style={styles.userImage}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{item.charitarian.name}</Text>
          <Text style={[
            styles.status,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.charitarianItem.itemName}</Text>
        <Text style={styles.quantity}>
          Qty: {item.charitarianItem.itemQuantity}
        </Text>
      </View>

      {item.requestNote && (
        <Text style={styles.note}>Note: {item.requestNote}</Text>
      )}

      <Text style={styles.appointmentTime}>
        Appointment: {formatTime(item.appointmentDate)}
      </Text>
    </View>
  );

  const renderAddress = ({ item }: { item: VolunteerTransactionByAddress }) => (
    <View style={styles.addressContainer}>
      <TouchableOpacity
        style={styles.addressHeader}
        onPress={() => toggleAddress(item.addressId)}
      >
        <View style={styles.addressInfo}>
          <Text style={styles.addressText}>{item.address}</Text>
          <Text style={styles.itemCount}>{item.totalItem} items</Text>
        </View>
        <Text style={styles.expandIcon}>
          {expandedAddresses[item.addressId] ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {expandedAddresses[item.addressId] && (
        <FlatList
          data={item.transactions}
          renderItem={renderTransaction}
          keyExtractor={transaction => transaction.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderTimeFrame = ({ item }: { item: TimeFrame }) => (
    <View style={styles.timeFrameContainer}>
      <TouchableOpacity
        style={styles.timeFrameHeader}
        onPress={() => toggleTimeFrame(item.timeFrame)}
      >
        <View style={styles.timeFrameInfo}>
          <Text style={styles.timeFrameText}>{item.timeFrame}</Text>
          <Text style={styles.totalItems}>
            ({getTotalItems(item.volunteerTransactionByAddresses)} items)
          </Text>
        </View>
        <Text style={styles.expandIcon}>
          {expandedFrames[item.timeFrame] ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {expandedFrames[item.timeFrame] && (
        <FlatList
          data={item.volunteerTransactionByAddresses}
          renderItem={renderAddress}
          keyExtractor={address => address.addressId}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <FlatList
      data={timeFrames}
      renderItem={renderTimeFrame}
      keyExtractor={item => item.timeFrame}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeFrameContainer: {
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timeFrameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeFrameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeFrameText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  totalItems: {
    fontSize: 14,
    color: '#666',
  },
  addressContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  transactionCard: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
});

export default TimeFrameList;