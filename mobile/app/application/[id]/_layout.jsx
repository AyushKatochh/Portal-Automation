import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Zocial from '@expo/vector-icons/Zocial';

export default function ApplicationLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        // headerTitle: 'My App',
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="Status"
        options={{
          title: 'Status',
          headerTitle:'Live Status Tracking',
          tabBarIcon: ({ color }) => <Zocial name="statusnet" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Chat"
        options={{
          title: 'Chat',
          headerTitle:'Sarthi',
          tabBarIcon: ({ color }) => <MaterialIcons name="chat" size={24} color={color} />,

        }}
      />
    </Tabs>
  );
}
