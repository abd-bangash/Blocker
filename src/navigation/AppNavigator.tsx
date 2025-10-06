import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import UsageLimitScreen from '../screens/UsageLimitScreen';
import WebsiteBlockerScreen from '../screens/WebsiteBlockerScreen';


export type RootStackParamList = {
  Home: undefined;
  UsageLimit: undefined;
  WebsiteBlocker: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
         <Stack.Screen name="UsageLimit" component={UsageLimitScreen} />
         <Stack.Screen name="WebsiteBlocker" component={WebsiteBlockerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
