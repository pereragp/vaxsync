import React, { ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationLayoutProps {
  children: ReactNode;
}

export default function NavigationLayout({ children }: NavigationLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Animation refs
  const tabAnimations = useRef<{ [key: string]: Animated.Value }>({});

  const colors = {
    primary: '#1e40af',
    secondary: '#3b82f6', 
    tertiary: '#60a5fa',
    dark: '#1f2937',
    white: '#FFFFFF',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  };

  const tabs = [
    { id: 'schedule', name: 'Schedule', icon: 'calendar', route: '/schedule', color: '#10b981' },
    { id: 'vaccines', name: 'Records', icon: 'shield-checkmark', route: '/vaccines', color: '#3b82f6' },
    { id: 'services', name: 'Services', icon: 'medical', route: '/health-services', color: '#8b5cf6' },
    { id: 'profile', name: 'Profile', icon: 'person', route: '/profile', color: '#ef4444' },
  ];

  const handleTabPress = (route: any, tabId: string) => {
    // Initialize animation if not exists
    if (!tabAnimations.current[tabId]) {
      tabAnimations.current[tabId] = new Animated.Value(1);
    }

    // Animate tab press
    Animated.sequence([
      Animated.timing(tabAnimations.current[tabId], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnimations.current[tabId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    router.push(route);
  };

  const getActiveTab = () => {
    switch(pathname) {
      case '/vaccines':
        return 'vaccines';
      case '/schedule':
        return 'schedule';
      case '/profile':
        return 'profile';
      case '/health-services':
        return 'services';
      default:
        return 'schedule';
    }
  };

  // Check if current page should show navigation
  const shouldShowNavigation = () => {
    const noNavRoutes = ['/login', '/register', '/'];
    return !noNavRoutes.includes(pathname);
  };

  const useScrollView = !['/vaccination-center'].includes(pathname);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>

        {/* Main Content Area */}
        {useScrollView ? (
          <ScrollView
            style={{
              flex: 1,
              paddingBottom: shouldShowNavigation() ? 80 : 0,
              backgroundColor: colors.white,
            }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.white }}>
            {children}
          </View>
        )}

        {/* Enhanced Bottom Tab Navigation */}
        {shouldShowNavigation() && (
        <View 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.gray[200],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          {/* Gradient Background */}
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(249,250,251,0.98)', 'rgba(255,255,255,1)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          {/* Tab Container */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              paddingTop: 12,
              paddingHorizontal: 8,
              paddingBottom: 8,
            }}
          >
            {tabs.map((tab) => {
              const isActive = getActiveTab() === tab.id;
              const animationValue = tabAnimations.current[tab.id] || new Animated.Value(1);
              
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleTabPress(tab.route, tab.id)}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 16,
                    minWidth: 60,
                    position: 'relative',
                  }}
                  activeOpacity={0.7}
                >
                  {/* Active Background Indicator */}
                  {isActive && (
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: `${tab.color}15`,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: `${tab.color}30`,
                      }}
                    />
                  )}

                  {/* Icon Container */}
                  <Animated.View
                    style={{
                      transform: [{ scale: animationValue }],
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? `${tab.color}20` : 'transparent',
                      }}
                    >
                      <Ionicons 
                        name={tab.icon as any}
                        size={isActive ? 22 : 20} 
                        color={isActive ? tab.color : colors.gray[400]}
                      />
                    </View>
                  </Animated.View>

                  {/* Label */}
                  <Text 
                    style={{
                      fontSize: 11,
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? tab.color : colors.gray[500],
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {tab.name}
                  </Text>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: tab.color,
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Safety Area Bottom Padding */}
          <View style={{ height: 8 }} />
        </View>
        )}
      </View>
    </SafeAreaView>
  );
}