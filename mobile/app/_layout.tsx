import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

// Custom Header Component
const CustomHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <Image
        source={require('./assets/aicte_logo.png')} // Replace with your image
        style={styles.logo}
        resizeMode="contain"

      />
      {/* <Text style={styles.headerTitle}>{title}</Text> */}
    </View>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false, // Default: Hide all headers
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            header: () => <CustomHeader/>, // Custom header
          }}
        />
        <Stack.Screen
          name="application/[id]/_layout"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" translucent={false} backgroundColor="white" />
    </>
  );
}

// Styles for Custom Header
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff', // Customize your header background color
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  logo: {
    width: 280, // Adjust width based on your image
    height: 55, // Adjust height based on your image
    marginLeft: 20,

  },
});
