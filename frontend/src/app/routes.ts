import { createBrowserRouter } from 'react-router';
import { MainLayout } from './layouts/main-layout';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { SearchPage } from './pages/search';
import { SellPage } from './pages/sell';
import { EcoCoinsPage } from './pages/ecocoins';
import { RecyclingPage } from './pages/recycling';
import { ProfilePage } from './pages/profile';
import { AuthCallbackPage } from './pages/auth-callback';
import { OnboardingPage } from './pages/onboarding';

export const router = createBrowserRouter([
  {
    path: '/auth/callback',
    Component: AuthCallbackPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    path: '/',
    Component: MainLayout,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: 'onboarding',
        Component: OnboardingPage,
      },
      {
        path: 'search',
        Component: SearchPage,
      },
      {
        path: 'sell',
        Component: SellPage,
      },
      {
        path: 'ecocoins',
        Component: EcoCoinsPage,
      },
      {
        path: 'recycling',
        Component: RecyclingPage,
      },
      {
        path: 'profile',
        Component: ProfilePage,
      },
    ],
  },
]);
