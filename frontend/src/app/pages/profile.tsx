import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  User,
  Mail,
  MapPin,
  Package,
  ShoppingBag,
  Coins,
  TrendingUp,
  Settings,
  Leaf,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface Product {
  _id: string;
  name: string;
  title?: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  createdAt: string;
}

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const isSeller = Boolean(user?.roles?.includes('seller'));
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  useEffect(() => {
    loadMyProducts();
  }, [isSeller]);

  useEffect(() => {
    const buildQr = async () => {
      if (!user?.recyclingCode) {
        setQrDataUrl(null);
        return;
      }
      try {
        const url = await QRCode.toDataURL(user.recyclingCode, {
          margin: 1,
          width: 180
        });
        setQrDataUrl(url);
      } catch (e) {
        setQrDataUrl(null);
      }
    };

    buildQr();
  }, [user?.recyclingCode]);

  const loadMyProducts = async () => {
    if (!isSeller) {
      setMyProducts([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.getMyProducts();
      if (response.success && response.data) {
        setMyProducts(response.data.products || response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.updateProfile(profileData);
      toast.success('Perfil actualizado exitosamente');
      await refreshProfile();
      setEditMode(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      toast.success('Producto eliminado');
      loadMyProducts();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Administra tu cuenta y actividad</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.profileImage} alt={user?.username} />
              <AvatarFallback className="text-2xl">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  {user?.country || 'No especificado'}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Package className="w-3 h-3" />
                  {user?.productsSold || 0} vendidos
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  {user?.productsBought || 0} comprados
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                  <Coins className="w-6 h-6" />
                  {user?.ecoCoins || 0}
                </div>
                <div className="text-sm text-gray-600">EcoCoins</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                  {user?.sustainabilityScore || 0}
                </div>
                <div className="text-sm text-gray-600">Sostenibilidad</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identificación para puntos de recolección */}
      <Card>
        <CardHeader>
          <CardTitle>Mi identificación para reciclaje</CardTitle>
          <CardDescription>
            Presenta este código/QR en el punto para que un operador registre tu entrega.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="w-full md:w-auto">
            <Label className="text-sm text-gray-600">Código</Label>
            <div className="mt-2 font-mono text-lg border rounded-md px-3 py-2 bg-white">
              {user?.recyclingCode || '—'}
            </div>
          </div>
          <div className="w-full md:w-auto">
            <Label className="text-sm text-gray-600">QR</Label>
            <div className="mt-2 border rounded-md p-3 bg-white flex items-center justify-center w-[200px] h-[200px]">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR de identificación" className="w-[180px] h-[180px]" />
              ) : (
                <div className="text-sm text-gray-500 text-center">
                  No disponible
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Mis Productos</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Productos Publicados
              </CardTitle>
              <CardDescription>
                Productos que has puesto en venta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-gray-500">
                  Cargando productos...
                </p>
              ) : myProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    {isSeller
                      ? 'No has publicado productos aún'
                      : 'Aún no tienes ventas activadas'}
                  </p>
                  {isSeller && (
                    <Button onClick={() => window.location.href = '/sell'}>
                      Publicar Producto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {myProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {product.name || product.title}
                          </h3>
                          <Badge
                            variant={
                              product.status === 'Disponible'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span>{product.category}</span>
                          <span>•</span>
                          <span>{product.condition}</span>
                          <span>•</span>
                          <span>{formatPrice(product.price)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Historial de Transacciones
              </CardTitle>
              <CardDescription>
                Tus compras y ventas completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tienes transacciones aún</p>
                <p className="text-sm mt-2">
                  Empieza comprando o vendiendo productos sostenibles
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración de la Cuenta
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          username: e.target.value,
                        })
                      }
                      className="pl-10"
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="pl-10"
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {!editMode ? (
                    <Button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="flex-1"
                    >
                      Editar Perfil
                    </Button>
                  ) : (
                    <>
                      <Button type="submit" disabled={isLoading} className="flex-1">
                        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setProfileData({
                            username: user?.username || '',
                            email: user?.email || '',
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-green-600" />
                    Total de EcoCoins ganados
                  </span>
                  <strong>{user?.ecoCoins || 0}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Productos vendidos
                  </span>
                  <strong>{user?.productsSold || 0}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    Productos comprados
                  </span>
                  <strong>{user?.productsBought || 0}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    Puntuación de sostenibilidad
                  </span>
                  <strong>{user?.sustainabilityScore || 0}/100</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
