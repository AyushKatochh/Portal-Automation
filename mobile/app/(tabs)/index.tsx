import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignIn from '../signIn';


export default function HomePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [applications, setApplications] = useState([]);
  const router = useRouter();
  const [userData, setuserData] = useState(null)

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return styles.statusApproved;
      case 'rejected':
        return styles.statusRejected;
      case 'pending':
      default:
        return styles.statusPending;
    }
  };

  const handleSignIn = async (confirm) => {
    if (confirm) {
      try {
        const userdata = JSON.parse(await AsyncStorage.getItem('userData'));
        setuserData(userdata)
        if (!userData || !userdata.instituteId) {
          Alert.alert('Error', 'Invalid user data.');
          return;
        }

        // Replace localhost with your laptop's IP address
        const backendUrl = 'http://192.168.27.32:5000/api/institute-applications';

        const response = await axios.get(backendUrl, {
          params: {
            institute_id: userData.instituteId,
            is_complete: true,
          },
        });
        console.log(response.data)
        setApplications(response.data); // Assuming API response is an array of applications
        setAuthenticated(true);
      } catch (error) {
        console.error('Error fetching applications:', error);
        Alert.alert('Error', 'Failed to load applications.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {authenticated ? (
        <>
          <Text style={styles.header}>{userData.instituteName}</Text>
          <Text style={styles.title}>Applications</Text>
          <FlatList
            data={applications}
            keyExtractor={(item) => item?.id?.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: './application/[id]',
                    params: { id: item._id },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.type}</Text>
                  <Text style={[styles.status, getStatusStyle('pending')]}>Pending</Text>
                </View>
                <Text style={styles.cardText}>
                  <Text style={styles.label}>ID: </Text>
                  {item?._id}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.label}>Academic Year: </Text>
                  {item?.academicYear || '2024-25'}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.label}>Last Modified: </Text>
                  {item?.lastModified || 'N/A'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <SignIn onAuth={handleSignIn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'darkred',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#333',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  cardText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  status: {
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 5,
    textTransform: 'capitalize',
  },
  statusApproved: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusRejected: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  label: {
    fontWeight: 'bold',
  },
});
