import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignIn = ({ onAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [error, setError] = useState(null)



  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://192.168.68.32:5000/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data)

        // Store user data in AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify({
          userName: data.institute.userName,
          instituteName: data.institute.name,
          instituteId: data.institute._id,
        }));

        // Navigate to the next screen
        onAuth(true)
      } else {
        // Handle authentication error
        const errorData = await response.json();
        setError(errorData.message || 'Incorrect username or password');
        onAuth(false)
      }
    } catch (error) {
      // Handle network errors
      console.error('Error during authentication:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    } };


  return (
    <View style={styles.signInPage}>
      <View style={styles.signInContainer}>
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        )}
        <Image source={require('./assets/banner.jpg')} style={styles.aicteLogo} />
        <View style={styles.form}>
          <TextInput
            style={styles.inputField}
            placeholder="Username"
            placeholderTextColor="#87CEFA"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            placeholderTextColor="#87CEFA"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.signInButton} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.links}>
          <TouchableOpacity onPress={() => navigation.navigate('NewInstitute')}>
            <Text style={styles.link}>New Institute</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.link}>Forgot Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  signInPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  signInContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  aicteLogo: {
    width: 250,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  form: {
    width: '100%',
  },
  inputField: {
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: '#000',
    backgroundColor: '#fff',
  },
  signInButton: { 
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  links: {
    marginTop: 15,
  },
  link: {
    color: '#007bff',
    marginBottom: 10,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
