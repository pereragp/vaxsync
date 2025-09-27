import React, {useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface NavigationLayoutProps {
  children: ReactNode;
}

export default function NavigationLayout({ children }: NavigationLayoutProps) {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const colors = {
    primary: '#175593',
    secondary: '#2B78C2', 
    dark: '#0F2337',
    white: '#FFFFFF'
  };

  const tabs = [
    { id: 'schedule', name: 'Schedule', icon: 'calendar', route: '/schedule' },
    { id: 'vaccines', name: 'Records', icon: 'shield', route: '/vaccines' },
    { id: 'home', name: 'Home', icon: 'home', route: '/' },
    { id: 'services', name: 'Services', icon: 'medkit', route: '/health-services' },
    { id: 'profile', name: 'Profile', icon: 'person', route: '/profile' },
  ];

  const sideMenuItems = [
    { icon: 'notifications', label: 'Notifications', badge: '3', action: 'notifications' },
    { icon: 'settings', label: 'Settings', action: 'settings' },
    { icon: 'help-circle', label: 'Help & Support', action: 'help' },
    { icon: 'log-out', label: 'Sign Out', action: 'logout' }
  ];

  const handleTabPress = (route: any) => {
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
      case 'health-services':
        return 'services';
      default:
        return 'home';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Header */}
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: colors.white,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        <TouchableOpacity 
          onPress={() => setSideMenuOpen(true)}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: 'transparent'
          }}
        >
          <Ionicons name="menu" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={{ 
          fontWeight: 'bold', 
          fontSize: 18, 
          color: colors.primary 
        }}>
          VaxSync
        </Text>
        
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content Area */}
      <ScrollView 
        style={{ 
          flex: 1, 
          paddingBottom: 80,
          backgroundColor: colors.white 
        }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {children}
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8
        }}
      >
        {tabs.map((tab) => {
          const isActive = getActiveTab() === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab.route)}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8
              }}
            >
              <Ionicons 
                name={tab.icon as any}
                size={20} 
                color={isActive ? colors.primary : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                marginTop: 4,
                color: isActive ? colors.primary : '#9CA3AF'
              }}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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