import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Package, Coins, AlertCircle, CheckCircle2, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Electrónicos',
  'Ropa y Accesorios',
  'Hogar y Jardín',
  'Deportes',
  'Libros',
  'Juguetes',
  'Muebles',
  'Otros',
];

const CONDITIONS = [
  'Nuevo',
  'Como nuevo',
  'Usado - Excelente',
  'Usado - Bueno',
  'Usado - Aceptable',
];

export function SellPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isSeller = Boolean(user?.roles?.includes('seller'));

  const handleActivateSeller = async () => {
    setIsActivating(true);
    try {
      const res = await api.activateSellerRole();
      if (res.success) {
        await refreshProfile();
        toast.success('Ventas activadas. Ya puedes publicar productos.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo activar el rol de vendedor');
    } finally {
      setIsActivating(false);
    }
  };

  if (!isSeller) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vender Producto</h1>
          <p className="text-gray-600">
            Tu cuenta aún no está habilitada para publicar productos.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Necesitas el rol <strong>seller</strong> para publicar productos.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Activar ventas</CardTitle>
            <CardDescription>
              Esto habilita tu cuenta para publicar productos en el marketplace.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-4">
            <Button onClick={handleActivateSeller} disabled={isActivating} className="flex-1">
              {isActivating ? 'Activando...' : 'Activar ventas'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Volver
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.createProduct({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
      });

      if (response.success) {
        setSuccess(true);
        toast.success('¡Producto publicado exitosamente!');

        // Reset form
        setTimeout(() => {
          setFormData({
            title: '',
            description: '',
            price: '',
            category: '',
            condition: '',
            location: '',
          });
          setSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al publicar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedEcoCoins = formData.price
    ? Math.floor(Number(formData.price) / 10)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vender Producto</h1>
        <p className="text-gray-600">
          Publica tu producto y gana EcoCoins por contribuir a la economía circular
        </p>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Producto publicado exitosamente!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalles del Producto
          </CardTitle>
          <CardDescription>
            Completa la información para publicar tu producto
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del producto *</Label>
              <Input
                id="title"
                placeholder="Ej: iPhone 12 Pro 128GB"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe el estado, características, razón de venta, etc."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condición *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleChange('condition', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la condición" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((cond) => (
                      <SelectItem key={cond} value={cond}>
                        {cond}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className="pl-7"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad, Estado"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>
            </div>

            {/* Estimated Rewards */}
            {estimatedEcoCoins > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-800 font-semibold">
                  <Coins className="w-5 h-5" />
                  Recompensas Estimadas
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>EcoCoins al vender:</span>
                    <strong>{estimatedEcoCoins}</strong>
                  </div>
                  <div className="flex items-start gap-2 text-green-700">
                    <Leaf className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Recibirás EcoCoins cuando se complete la transacción
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Publicando...' : 'Publicar Producto'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/search')}
            >
              Cancelar
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consejos para vender</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>
                Describe detalladamente el estado del producto para generar confianza
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>
                Establece un precio justo basado en la condición y el mercado
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>
                Responde rápidamente a los interesados para cerrar la venta
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>
                Cada venta contribuye a la economía circular y reduce tu huella de carbono
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
