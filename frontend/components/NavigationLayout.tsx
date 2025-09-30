import React, {useState, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationLayoutProps {
  children: ReactNode;
}

export default function NavigationLayout({ children }: NavigationLayoutProps) {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
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
    { id: 'home', name: 'Home', icon: 'home', route: '/', color: '#f59e0b' },
    { id: 'services', name: 'Services', icon: 'medical', route: '/health-services', color: '#8b5cf6' },
    { id: 'profile', name: 'Profile', icon: 'person', route: '/profile', color: '#ef4444' },
  ];

  const sideMenuItems = [
    { icon: 'notifications', label: 'Notifications', badge: '3', action: 'notifications' },
    { icon: 'settings', label: 'Settings', action: 'settings' },
    { icon: 'help-circle', label: 'Help & Support', action: 'help' },
    { icon: 'log-out', label: 'Sign Out', action: 'logout' }
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

  const handleSideMenuAction = (action: any) => {
    setSideMenuOpen(false);
    
    switch(action) {
      case 'notifications':
        // Handle notifications
        console.log('Navigate to notifications');
        break;
      case 'settings':
        // Handle settings
        console.log('Navigate to settings');
        break;
      case 'help':
        // Handle help
        console.log('Navigate to help');
        break;
      case 'logout':
        // Handle logout
        console.log('Handle logout');
        break;
      default:
        break;
    }
  };

  const getActiveTab = () => {
    switch(pathname) {
      case '/':
        return 'home';
      case '/vaccines':
        return 'vaccines';
      case '/schedule':
        return 'schedule';
      case '/profile':
        return 'profile';
      case '/health-services':
        return 'services';
      default:
        return 'home';
    }
  };

  const useScrollView = !['/vaccination-center'].includes(pathname);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Enhanced Header */}
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[100],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        <TouchableOpacity 
          onPress={() => setSideMenuOpen(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.gray[50],
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.gray[200],
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ 
            fontWeight: '700', 
            fontSize: 20, 
            color: colors.primary,
            letterSpacing: -0.5,
          }}>
            VaxSync
          </Text>
          <Text style={{
            fontSize: 12,
            color: colors.gray[500],
            fontWeight: '500',
            marginTop: -2,
          }}>
            Health Management
          </Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

        {/* Main Content Area */}
        {useScrollView ? (
          <ScrollView
            style={{
              flex: 1,
              paddingBottom: 80,
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

        {/* Enhanced Bottom Tab Navigation with Proper Notch */}
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

          {/* Custom Notch Shape using SVG-like approach */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 30,
              overflow: 'hidden',
            }}
          >
            {/* Left side of notch */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: 30,
                backgroundColor: colors.white,
                marginRight: 35,
              }}
            />
            
            {/* Right side of notch */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: 30,
                backgroundColor: colors.white,
                marginLeft: 35,
              }}
            />

            {/* Rounded notch cut-out */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                marginLeft: -35,
                width: 70,
                height: 30,
                backgroundColor: 'transparent',
                borderTopLeftRadius: 35,
                borderTopRightRadius: 35,
                borderBottomWidth: 30,
                borderBottomColor: 'transparent',
                borderLeftWidth: 35,
                borderLeftColor: colors.white,
                borderRightWidth: 35,
                borderRightColor: colors.white,
              }}
            />
          </View>
          
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
              const isHomeTab = tab.id === 'home';
              
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
                  {/* Special Home Button - Elevated */}
                  {isHomeTab ? (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: colors.white,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 8,
                        borderWidth: 2,
                        borderColor: colors.gray[200],
                        marginTop: -15,
                      }}
                    >
                      {/* Active Background for Home */}
                      {isActive && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: `${tab.color}15`,
                            borderRadius: 25,
                            borderWidth: 2,
                            borderColor: `${tab.color}30`,
                          }}
                        />
                      )}

                      {/* Home Icon */}
                      <Animated.View
                        style={{
                          transform: [{ scale: animationValue }],
                        }}
                      >
                        <Ionicons 
                          name={tab.icon as any}
                          size={isActive ? 24 : 22} 
                          color={isActive ? tab.color : colors.gray[400]}
                        />
                      </Animated.View>
                    </View>
                  ) : (
                    /* Regular Tab Layout */
                    <>
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
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Safety Area Bottom Padding */}
          <View style={{ height: 8 }} />
        </View>

      {/* Side Menu Overlay */}
      {sideMenuOpen && (
        <Pressable 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50
          }}
          onPress={() => setSideMenuOpen(false)}
        >
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 35, 55, 0.5)'
            }}
          />
          
          {/* Side Menu */}
          <View 
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: 320,
              backgroundColor: colors.white,
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10
            }}
          >
            {/* Menu Header */}
            <View 
              style={{
                padding: 24,
                backgroundColor: colors.primary
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <View 
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.secondary,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Ionicons name="person" size={20} color={colors.white} />
                  </View>
                  <View>
                    <Text style={{
                      fontWeight: '600',
                      color: colors.white,
                      fontSize: 16
                    }}>
                      Sarah Johnson
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: colors.white,
                      opacity: 0.9
                    }}>
                      Premium Member
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setSideMenuOpen(false)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: 'transparent'
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu Items */}
            <View style={{ padding: 16 }}>
              {sideMenuItems.map((item, index) => {
                return (
                  <TouchableOpacity
                    key={index}
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderRadius: 8,
                      backgroundColor: 'transparent'
                    }}
                    onPress={() => handleSideMenuAction(item.action)}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                      <Text style={{
                        fontWeight: '500',
                        color: colors.dark,
                        fontSize: 16
                      }}>
                        {item.label}
                      </Text>
                    </View>
                    {item.badge && (
                      <View 
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: colors.secondary
                        }}
                      >
                        <Text style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                          color: colors.white
                        }}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Menu Footer */}
            <View style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16
            }}>
              <View 
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: `${colors.secondary}15`
                }}
              >
                <Text style={{
                  fontWeight: '600',
                  fontSize: 14,
                  marginBottom: 4,
                  color: colors.primary
                }}>
                  Need Help?
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#6B7280',
                  marginBottom: 8
                }}>
                  Contact our support team for assistance
                </Text>
                <TouchableOpacity>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.secondary
                  }}>
                    Get Support →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      )}
      </View>
    </SafeAreaView>
  );
}