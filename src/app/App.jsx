import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';
import { WelcomeModal } from '@/components/layout/WelcomeModal';

export default function App() {
  return (
    <AppProviders>
      <>
        <RouterProvider router={router} />
        <WelcomeModal />
      </>
    </AppProviders>
  );
}
