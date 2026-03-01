import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Search, Filter, MapPin, Heart, Leaf } from 'lucide-react';
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

interface Product {
  _id: string;
  name: string;
  title?: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  locationText?: string;
  ecoCoinsGenerated?: number;
  estimatedCO2Saved?: number;
  images?: string[];
}

export function SearchPage() {
  const { user } = useAuth();
  const isSeller = Boolean(user?.roles?.includes('seller'));
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
  });

  const ALL_VALUE = '__all__';

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.condition) params.condition = filters.condition;
      if (filters.minPrice) params.minPrice = Number(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);

      const response = await api.searchProducts(params);
      
      if (response.success && response.data) {
        setProducts(response.data.products || []);
      }
    } catch (error: any) {
      toast.error('Error al cargar productos');
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleInterest = async (productId: string) => {
    try {
      await api.showInterest(productId);
      toast.success('¡Interés registrado! El vendedor será notificado.');
    } catch (error) {
      toast.error('Error al registrar interés');
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
        <h1 className="text-3xl font-bold mb-2">Buscar Productos</h1>
        <p className="text-gray-600">
          Encuentra productos sostenibles de segunda mano
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filters.category || ALL_VALUE}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value === ALL_VALUE ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas las categorías</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.condition || ALL_VALUE}
                onValueChange={(value) =>
                  setFilters({ ...filters, condition: value === ALL_VALUE ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las condiciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas las condiciones</SelectItem>
                  {CONDITIONS.map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {cond}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Precio mín."
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Precio máx."
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPrice: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilters({
                    search: '',
                    category: '',
                    condition: '',
                    minPrice: '',
                    maxPrice: '',
                  });
                  setTimeout(() => loadProducts(), 100);
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {products.length} productos encontrados
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No se encontraron productos con estos filtros
            </p>
            {isSeller && (
              <Button onClick={() => navigate('/dashboard/sell')} className="gap-2">
                <Leaf className="w-4 h-4" />
                Publica el primer producto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  <Leaf className="w-16 h-16 text-green-600 opacity-50" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {product.name || product.title}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{product.category}</Badge>
                    <Badge variant="outline">{product.condition}</Badge>
                  </div>
                  {product.locationText && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {product.locationText}
                    </div>
                  )}
                  {product.estimatedCO2Saved && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Leaf className="w-4 h-4" />
                      ~{product.estimatedCO2Saved.toFixed(1)}kg CO₂ ahorrado
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatPrice(product.price)}
                    </div>
                    {product.ecoCoinsGenerated && (
                      <div className="text-sm text-green-600">
                        +{product.ecoCoinsGenerated} EcoCoins
                      </div>
                    )}
                  </div>
                  <Button onClick={() => handleInterest(product._id)}>
                    Me interesa
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
