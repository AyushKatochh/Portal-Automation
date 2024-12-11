import React, { useEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, ScrollView, StyleSheet } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useGlobalSearchParams } from 'expo-router';


export default function ApplicationStatus() {
  const params = useGlobalSearchParams();
  const { id } = params


  const [application, setApplication] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axios.get(`http://192.168.68.32:5000/api/track-application/${id}`);
        const data = response.data.logs_id;
        // console.log('Fetched Application Data:', data);

        if (data) {
          setApplication(data);
          setStatusLogs(data.status_logs || []);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      }
    };
    
    fetchApplication();
 
 
  }, [id]);
  
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
  
    try {
      const date = new Date(isoDate);
      if (isNaN(date)) throw new Error("Invalid Date");
  
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error("Date formatting error:", error.message);
      return "Invalid Date";
    }
  };
  

  const renderStage = (stageName, stageData) => (
    <Card style={styles.card} key={stageName}>
      <View style={styles.cardContent}>
        <Icon
          name={stageData.is_completed ? 'check-circle' : 'hourglass-empty'}
          size={24}
          color={stageData.is_completed ? 'green' : 'orange'}
        />
        <View style={styles.textContent}>
          <Text style={styles.cardTitle}>{stageName}</Text>
          <Text style={styles.cardText}>{stageData.is_completed ? 'Evaluation is completed for this stage' : (stageData.is_allocated ? 'Application is allocated to the Evaluator' : '')} </Text>
          <Text style={styles.cardText}>{stageData.deadline && `Deadline: ${formatDate(stageData.deadline)}`}</Text>
          <Text style={styles.cardText}>{stageData.is_completed && `Remark: ${stageData.remark}`}</Text>
          <Text style={styles.cardText}>
            Status: {stageData.is_completed ? (stageData.success ? 'Approved' : 'Rejected') : 'Pending'}
          </Text>
          <Text style={styles.cardText}>
            {stageData.verification_timestamp && `Verification Date: ${formatDate(stageData.verification_timestamp)}`}
            
          </Text>
        </View>
      </View>
      <ProgressBar
        progress={stageData.is_completed ? 1 : 0.5}
        color={stageData.is_completed ? 'green' : 'orange'}
        style={styles.progressBar}
      />
    </Card>
  );


  

  return (
    <SafeAreaView style={styles.container}>
      {application ? (
        <ScrollView>
          <Text style={styles.header}>{application.status}</Text>

          <Text style={styles.title}>Stages</Text>
          {Object.entries(application.stage || {}).map(([stageName, stageData]) =>
            renderStage(stageName, stageData)
          )}

          <Text style={styles.title}>Status Logs</Text>
          {statusLogs.length > 0 ? (
            <FlatList
              data={statusLogs}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.logCard}>
                  <Text style={styles.logText}>{item.message}</Text>
                  <Text style={styles.logTimestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={styles.noLogs}>No logs available</Text>
          )}
        </ScrollView>
      ) : (
        <Text style={styles.loading}>Loading application data...</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
    color: 'red',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  card: {
    marginBottom: 12,
    marginRight:12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#007BFF',
  },
  cardText: {
    fontSize: 14,
    marginBottom: 2,
    color: '#555',
  },
  progressBar: {
    marginTop: 8,
    height: 6,
  },
  logCard: {
    padding: 8,
    marginRight:12,
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  logText: {
    fontSize: 14,
    color: '#333',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  noLogs: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
    marginVertical: 8,
  },
  loading: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
});
