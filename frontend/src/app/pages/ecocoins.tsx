import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Coins,
  TrendingUp,
  Gift,
  Award,
  ShoppingBag,
  Recycle,
  Leaf,
  Trophy,
} from 'lucide-react';

interface UserStats {
  ecoCoins: number;
  transactionsCount: number;
  sustainabilityScore: number;
  monthlyGrowth: number;
}

export function EcoCoinsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBalance = user?.ecoCoins || stats?.ecoCoins || 0;
  const sustainabilityScore = user?.sustainabilityScore || stats?.sustainabilityScore || 0;

  const rewards = [
    {
      id: 1,
      name: 'Descuento 10%',
      cost: 100,
      icon: Gift,
      description: 'En tu próxima compra',
    },
    {
      id: 2,
      name: 'Descuento 25%',
      cost: 250,
      icon: Gift,
      description: 'En cualquier producto',
    },
    {
      id: 3,
      name: 'Envío Gratis',
      cost: 150,
      icon: ShoppingBag,
      description: 'En tu próximo pedido',
    },
    {
      id: 4,
      name: 'Planta un Árbol',
      cost: 500,
      icon: Leaf,
      description: 'Contribuye al planeta',
    },
  ];

  const achievements = [
    {
      id: 1,
      name: 'Primer Paso',
      description: 'Realiza tu primera venta',
      icon: Award,
      earned: true,
      coins: 50,
    },
    {
      id: 2,
      name: 'Eco Guerrero',
      description: 'Alcanza 500 EcoCoins',
      icon: Trophy,
      earned: currentBalance >= 500,
      coins: 100,
    },
    {
      id: 3,
      name: 'Reciclador Pro',
      description: 'Completa 5 reciclajes',
      icon: Recycle,
      earned: false,
      coins: 200,
    },
    {
      id: 4,
      name: 'Vendedor Estrella',
      description: 'Vende 10 productos',
      icon: TrendingUp,
      earned: false,
      coins: 300,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">EcoCoins</h1>
        <p className="text-gray-600">
          Tus recompensas por contribuir a la economía circular
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-green-600 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-6 h-6" />
              Balance Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-4">{currentBalance}</div>
            <div className="flex items-center gap-2 text-green-100">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">
                {stats?.monthlyGrowth || 0}% este mes
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Puntuación de Sostenibilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{sustainabilityScore}/100</div>
            <Progress value={sustainabilityScore} className="mb-2" />
            <p className="text-sm text-gray-600">
              {sustainabilityScore < 30 && 'Sigue participando para mejorar'}
              {sustainabilityScore >= 30 && sustainabilityScore < 70 && 'Buen progreso'}
              {sustainabilityScore >= 70 && '¡Excelente contribución!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const Icon = reward.icon;
              const canAfford = currentBalance >= reward.cost;

              return (
                <Card key={reward.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Icon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{reward.name}</CardTitle>
                          <CardDescription>{reward.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold">{reward.cost}</span>
                      </div>
                      <Button disabled={!canAfford} size="sm">
                        {canAfford ? 'Canjear' : 'Insuficiente'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;

              return (
                <Card
                  key={achievement.id}
                  className={achievement.earned ? 'border-green-500' : ''}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            achievement.earned
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {achievement.name}
                            </CardTitle>
                            {achievement.earned && (
                              <Badge variant="default" className="bg-green-600">
                                Completado
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {achievement.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Coins className="w-4 h-4 text-green-600" />
                      <span>Recompensa: {achievement.coins} EcoCoins</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de EcoCoins</CardTitle>
              <CardDescription>
                Tus transacciones y recompensas recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Demo history items */}
                {[
                  {
                    id: 1,
                    type: 'earn',
                    description: 'Producto vendido',
                    amount: 50,
                    date: '2026-02-20',
                  },
                  {
                    id: 2,
                    type: 'earn',
                    description: 'Registro completado',
                    amount: 50,
                    date: '2026-02-15',
                  },
                  {
                    id: 3,
                    type: 'spend',
                    description: 'Descuento canjeado',
                    amount: -100,
                    date: '2026-02-10',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-gray-500">{item.date}</div>
                    </div>
                    <div
                      className={`flex items-center gap-1 font-semibold ${
                        item.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.amount > 0 ? '+' : ''}
                      {item.amount}
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* How to Earn More */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            ¿Cómo ganar más EcoCoins?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <ShoppingBag className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Vende productos de segunda mano</span>
            </li>
            <li className="flex items-start gap-2">
              <Recycle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Recicla en puntos autorizados</span>
            </li>
            <li className="flex items-start gap-2">
              <Award className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Completa logros y desafíos</span>
            </li>
            <li className="flex items-start gap-2">
              <Gift className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Compra productos sostenibles</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
