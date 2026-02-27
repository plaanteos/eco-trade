import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import {
  Home,
  Search,
  Package,
  Coins,
  Recycle,
  User,
  LogOut,
  Leaf,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useEffect } from 'react';

export function MainLayout() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const isStaff = Boolean(user?.recyclingAccess?.isStaff);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!isStaff) return;

    const allowed = new Set(['/recycling', '/profile']);
    if (!allowed.has(location.pathname)) {
      navigate('/recycling', { replace: true });
    }
  }, [isStaff, isLoading, user, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = isStaff
    ? [{ to: '/recycling', icon: Recycle, label: 'Reciclaje' }]
    : [
        { to: '/', icon: Home, label: 'Inicio' },
        { to: '/search', icon: Search, label: 'Buscar' },
        { to: '/sell', icon: Package, label: 'Vender' },
        { to: '/ecocoins', icon: Coins, label: 'EcoCoins' },
        { to: '/recycling', icon: Recycle, label: 'Reciclaje' },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EcoTrade</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {user.ecoCoins || 0}
                  </span>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user?.profileImage} alt={user?.username} />
                      <AvatarFallback>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  {!isStaff && (
                    <DropdownMenuItem onClick={() => navigate('/ecocoins')}>
                      <Coins className="mr-2 h-4 w-4" />
                      EcoCoins: {user?.ecoCoins || 0}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden border-t border-gray-200 py-2 flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="flex flex-col h-auto py-2 gap-1"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">EcoTrade</span>
              </div>
              <p className="text-sm text-gray-600">
                Plataforma de economía circular para un futuro sostenible.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Enlaces rápidos</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link to="/search" className="hover:text-green-600">
                    Buscar productos
                  </Link>
                </li>
                <li>
                  <Link to="/recycling" className="hover:text-green-600">
                    Puntos de reciclaje
                  </Link>
                </li>
                <li>
                  <Link to="/ecocoins" className="hover:text-green-600">
                    EcoCoins
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Sobre nosotros</h3>
              <p className="text-sm text-gray-600">
                EcoTrade es una plataforma que conecta compradores y vendedores
                de productos de segunda mano, promoviendo la sostenibilidad.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            © 2026 EcoTrade. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}