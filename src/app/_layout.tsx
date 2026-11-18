import React from 'react';
import AppTabs from '@/components/app-tabs';
import { NavigationProvider } from '@/context/NavigationContext';

export default function TabLayout() {
  return (
    <NavigationProvider>
      <AppTabs />
    </NavigationProvider>
  );
}
