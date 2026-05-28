// App Navigation
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, FONT_SIZE, FONT_WEIGHT } from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ClientsScreen from '../screens/ClientsScreen';
import AddClientScreen from '../screens/AddClientScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import AddPaymentScreen from '../screens/AddPaymentScreen';
import QuotationScreen from '../screens/QuotationScreen';
import CreateQuotationScreen from '../screens/CreateQuotationScreen';
import QuotationPreviewScreen from '../screens/QuotationPreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';

import useStore from '../store/useStore';
import LoadingSpinner from '../components/LoadingSpinner';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// ===== Client Stack =====
const ClientStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientsList" component={ClientsScreen} />
      <Stack.Screen name="AddClient" component={AddClientScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <Stack.Screen name="AddProject" component={AddProjectScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
    </Stack.Navigator>
  );
};

// ===== Project Stack =====
const ProjectStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProjectsList" component={ProjectsScreen} />
      <Stack.Screen name="AddProject" component={AddProjectScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
    </Stack.Navigator>
  );
};

// ===== Quotation Stack =====
const QuotationStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuotationsList" component={QuotationScreen} />
      <Stack.Screen name="CreateQuotation" component={CreateQuotationScreen} />
      <Stack.Screen name="QuotationPreview" component={QuotationPreviewScreen} />
    </Stack.Navigator>
  );
};

// ===== Settings Stack =====
const SettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

// ===== Dashboard Stack =====
const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

// ===== Custom Drawer Content =====
const CustomDrawerContent = (props) => {
  const { user, logout } = useStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0, backgroundColor: colors.surface }}>
        {/* Header section */}
        <View style={{
          padding: 24,
          paddingTop: Math.max(insets?.top || 0, 20) + (Platform.OS === 'ios' ? 10 : 20),
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomRightRadius: 32,
          borderBottomLeftRadius: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
          marginBottom: 10,
        }}>
          <View style={{
            width: 86,
            height: 86,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 3,
            borderColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : user?.email?.toLowerCase() === 'nurul@docstec.com' ? (
              <Image source={require('../../assets/Nurul.png')} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : user?.email?.toLowerCase() === 'raiyan@docstec.com' ? (
              <Image source={require('../../assets/Raiyan.jpeg')} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : (
              <Text style={{ fontSize: 34, fontWeight: 'bold', color: colors.primary }}>
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4, letterSpacing: 0.5 }}>
            {user?.email?.toLowerCase() === 'raiyan@docstec.com' 
              ? 'Captain' 
              : user?.email?.toLowerCase() === 'nurul@docstec.com'
              ? 'Maester'
              : user?.email ? (user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)) : 'User'}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>{user?.email}</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: colors.surface, paddingHorizontal: 12, paddingTop: 8 }}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      
      {/* Footer Section */}
      <View style={{
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: colors.border + '40',
        backgroundColor: colors.surface,
      }}>
        <TouchableOpacity 
          onPress={logout} 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: colors.danger + '10',
            borderRadius: 12,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.danger, marginLeft: 8 }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ===== Main Drawer =====
const MainDrawer = () => {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        drawerPosition: 'right',
        swipeEnabled: false,
        drawerType: 'front',
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: FONT_SIZE.md,
          fontWeight: FONT_WEIGHT.semiBold,
          marginLeft: 0, // Reset margin so text isn't stuck to icon
        },
        drawerItemStyle: {
          borderRadius: 12,
          paddingVertical: 2,
          marginBottom: 4,
        },
        drawerIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'DashboardDrawer':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'ClientsDrawer':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'ProjectsDrawer':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'QuotationsDrawer':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'SettingsDrawer':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Drawer.Screen 
        name="DashboardDrawer" 
        component={DashboardStack} 
        options={{ title: 'Home' }} 
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.navigate('DashboardDrawer', { screen: 'DashboardMain' });
            navigation.closeDrawer();
          }
        })}
      />
      <Drawer.Screen 
        name="ClientsDrawer" 
        component={ClientStack} 
        options={{ title: 'Clients' }} 
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.navigate('ClientsDrawer', { screen: 'ClientsList' });
            navigation.closeDrawer();
          }
        })}
      />
      <Drawer.Screen 
        name="ProjectsDrawer" 
        component={ProjectStack} 
        options={{ title: 'Projects' }} 
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProjectsDrawer', { screen: 'ProjectsList' });
            navigation.closeDrawer();
          }
        })}
      />
      <Drawer.Screen 
        name="QuotationsDrawer" 
        component={QuotationStack} 
        options={{ title: 'Quotations' }} 
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.navigate('QuotationsDrawer', { screen: 'QuotationsList' });
            navigation.closeDrawer();
          }
        })}
      />
      <Drawer.Screen 
        name="SettingsDrawer" 
        component={SettingsStack} 
        options={{ title: 'Settings' }} 
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.navigate('SettingsDrawer', { screen: 'SettingsMain' });
            navigation.closeDrawer();
          }
        })}
      />
    </Drawer.Navigator>
  );
};

// ===== Auth Stack =====
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// ===== Root Navigator =====
const AppNavigator = () => {
  const { user, isAuthLoading } = useStore();
  const { colors } = useTheme();

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.style.setProperty('--autofill-text-color', colors.textPrimary);
    }
  }, [colors.textPrimary]);

  if (isAuthLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <NavigationContainer>
        {user ? <MainDrawer /> : <AuthStack />}
      </NavigationContainer>
    </View>
  );
};

export default AppNavigator;
