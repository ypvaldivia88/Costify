import { MobileClientDataProvider } from '@/client-data/MobileClientDataProvider';
import { AppNavigator } from '@/navigation/AppNavigator';

export default function App() {
  return (
    <MobileClientDataProvider>
      <AppNavigator />
    </MobileClientDataProvider>
  );
}
