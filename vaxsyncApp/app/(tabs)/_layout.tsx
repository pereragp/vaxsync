import { Slot } from 'expo-router';
import NavigationLayout from '../../components/NavigationLayout';

export default function TabLayout() {
  return (
    <NavigationLayout>
      <Slot />
    </NavigationLayout>
  );
}