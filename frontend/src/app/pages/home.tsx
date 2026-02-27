import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Leaf, Recycle, Coins, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Bienvenido a EcoTrade
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          La plataforma de economía circular que recompensa tu sostenibilidad
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/search">
            <Button size="lg" variant="secondary" className="gap-2">
              <ShoppingBag className="w-5 h-5" />
              Explorar Productos
            </Button>
          </Link>
          <Link to="/sell">
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20 gap-2">
              <Leaf className="w-5 h-5" />
              Vender Producto
            </Button>
          </Link>
        </div>
      </section>

      {/* User Stats (if logged in) */}
      {user && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Tu Impacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">EcoCoins</CardTitle>
                <Coins className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.ecoCoins || 0}</div>
                <p className="text-xs text-gray-500">
                  Recompensas por sostenibilidad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Puntuación de Sostenibilidad
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user.sustainabilityScore || 0}
                </div>
                <p className="text-xs text-gray-500">De 100 puntos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transacciones
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user.totalTransactions || 0}
                </div>
                <p className="text-xs text-gray-500">Compras y ventas totales</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">
          ¿Cómo funciona EcoTrade?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Compra y Vende
            </h3>
            <p className="text-gray-600">
              Encuentra productos de segunda mano de calidad o vende los que ya no uses
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Gana EcoCoins
            </h3>
            <p className="text-gray-600">
              Cada transacción te recompensa con EcoCoins que puedes usar en futuras compras
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Recycle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Recicla y Gana Más
            </h3>
            <p className="text-gray-600">
              Encuentra puntos de reciclaje cercanos y obtén recompensas adicionales
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gray-100 rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Únete a la Economía Circular
        </h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Cada compra, venta o reciclaje contribuye a un planeta más sostenible.
          Juntos podemos hacer la diferencia.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/recycling">
            <Button size="lg" className="gap-2">
              <Recycle className="w-5 h-5" />
              Ver Puntos de Reciclaje
            </Button>
          </Link>
          <Link to="/ecocoins">
            <Button size="lg" variant="outline" className="gap-2">
              <Coins className="w-5 h-5" />
              Ver Mis EcoCoins
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-3xl font-bold text-green-600">10K+</div>
          <div className="text-sm text-gray-600">Productos vendidos</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-blue-600">5K+</div>
          <div className="text-sm text-gray-600">Usuarios activos</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-purple-600">50 Ton</div>
          <div className="text-sm text-gray-600">CO₂ ahorrado</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-orange-600">100+</div>
          <div className="text-sm text-gray-600">Puntos de reciclaje</div>
        </div>
      </section>
    </div>
  );
}
