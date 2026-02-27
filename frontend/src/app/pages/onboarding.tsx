import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Leaf, AlertCircle } from 'lucide-react';

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

type AccountType = 'individual' | 'company';
type Goal = 'buy' | 'sell' | 'both';
type PreferredDeliveryMethod = 'pickup' | 'delivery' | 'shipping' | 'meetup';
type PreferredPaymentMethod = 'Efectivo' | 'Transferencia' | 'MercadoPago' | 'EcoCoins' | 'Mixto';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isLoading, refreshProfile } = useAuth();

  const alreadyCompleted = Boolean(user?.preferences?.onboardingCompleted || (user as any)?.onboardingCompleted);

  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [goal, setGoal] = useState<Goal>('both');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [maxDeliveryDistance, setMaxDeliveryDistance] = useState<string>('');
  const [preferredDeliveryMethod, setPreferredDeliveryMethod] = useState<PreferredDeliveryMethod>('pickup');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<PreferredPaymentMethod>('Efectivo');
  const [recyclingInterest, setRecyclingInterest] = useState<boolean>(true);
  const [companyName, setCompanyName] = useState<string>('');
  const [companyIndustry, setCompanyIndustry] = useState<string>('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const initialCategories = useMemo(() => {
    const c = user?.preferences?.categories;
    return Array.isArray(c) ? c.filter((x: any) => typeof x === 'string') : [];
  }, [user?.preferences?.categories]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;

    if (alreadyCompleted) {
      navigate('/', { replace: true });
      return;
    }

    if (user.accountType === 'company' || user.accountType === 'individual') {
      setAccountType(user.accountType);
    }

    setCity(String(user.location?.city || ''));
    setProvince(String(user.location?.province || ''));
    setCategories(initialCategories);

    const savedGoal = user.preferences?.goal;
    if (savedGoal === 'buy' || savedGoal === 'sell' || savedGoal === 'both') {
      setGoal(savedGoal);
    }

    const savedMax = user.preferences?.maxDeliveryDistance;
    if (typeof savedMax === 'number' && Number.isFinite(savedMax)) {
      setMaxDeliveryDistance(String(savedMax));
    }

    const savedDelivery = user.preferences?.preferredDeliveryMethod;
    if (savedDelivery === 'pickup' || savedDelivery === 'delivery' || savedDelivery === 'shipping' || savedDelivery === 'meetup') {
      setPreferredDeliveryMethod(savedDelivery);
    }

    const savedPayment = user.preferences?.preferredPaymentMethod;
    if (savedPayment === 'Efectivo' || savedPayment === 'Transferencia' || savedPayment === 'MercadoPago' || savedPayment === 'EcoCoins' || savedPayment === 'Mixto') {
      setPreferredPaymentMethod(savedPayment);
    }

    const savedRecycling = user.preferences?.recyclingInterest;
    if (typeof savedRecycling === 'boolean') setRecyclingInterest(savedRecycling);

    setCompanyName(String(user.preferences?.companyName || ''));
    setCompanyIndustry(String(user.preferences?.companyIndustry || ''));

    const notifEmail = user.preferences?.notifications?.email;
    if (typeof notifEmail === 'boolean') setEmailNotifications(notifEmail);
  }, [alreadyCompleted, initialCategories, isLoading, navigate, user]);

  const toggleCategory = (category: string) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accountType) {
      setError('Selecciona un tipo de cuenta');
      return;
    }

    setIsSaving(true);
    try {
      const parsedMax = maxDeliveryDistance.trim() ? Number(maxDeliveryDistance) : undefined;
      if (parsedMax !== undefined && (!Number.isFinite(parsedMax) || parsedMax <= 0)) {
        setError('La distancia máxima debe ser un número válido');
        setIsSaving(false);
        return;
      }

      if (accountType === 'company' && !companyName.trim()) {
        setError('Para empresa, ingresa el nombre (puede ser tu marca)');
        setIsSaving(false);
        return;
      }

      await api.completeOnboarding({
        accountType,
        location: {
          city: city.trim(),
          province: province.trim(),
        },
        preferences: {
          categories,
          goal,
          maxDeliveryDistance: parsedMax,
          preferredDeliveryMethod,
          preferredPaymentMethod,
          recyclingInterest,
          companyName: accountType === 'company' ? companyName.trim() : '',
          companyIndustry: accountType === 'company' ? companyIndustry.trim() : '',
          notifications: {
            email: emailNotifications,
          },
        },
      });

      await refreshProfile();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'No se pudo completar el onboarding');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Bienvenido a EcoTrade</CardTitle>
              <CardDescription>
                Completa esta introducción para personalizar tu experiencia.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Tipo de cuenta</Label>
              <Select
                value={accountType}
                onValueChange={(v) => setAccountType(v as AccountType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Persona</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accountType === 'company' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de empresa/marca</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: EcoTrade Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyIndustry">Rubro (opcional)</Label>
                  <Input
                    id="companyIndustry"
                    value={companyIndustry}
                    onChange={(e) => setCompanyIndustry(e.target.value)}
                    placeholder="Ej: Electrónica, muebles, retail"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>¿Para qué vas a usar EcoTrade?</Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Comprar</SelectItem>
                  <SelectItem value="sell">Vender</SelectItem>
                  <SelectItem value="both">Comprar y vender</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad (opcional)</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: CDMX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia/Estado (opcional)</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Ej: Jalisco"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDistance">Distancia máxima de entrega (km, opcional)</Label>
              <Input
                id="maxDistance"
                type="number"
                min={1}
                max={200}
                value={maxDeliveryDistance}
                onChange={(e) => setMaxDeliveryDistance(e.target.value)}
                placeholder="Ej: 20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entrega preferida</Label>
                <Select
                  value={preferredDeliveryMethod}
                  onValueChange={(v) => setPreferredDeliveryMethod(v as PreferredDeliveryMethod)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Retiro en persona</SelectItem>
                    <SelectItem value="meetup">Punto de encuentro</SelectItem>
                    <SelectItem value="delivery">Entrega a domicilio</SelectItem>
                    <SelectItem value="shipping">Envío por paquetería</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Método de pago preferido</Label>
                <Select
                  value={preferredPaymentMethod}
                  onValueChange={(v) => setPreferredPaymentMethod(v as PreferredPaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="MercadoPago">MercadoPago</SelectItem>
                    <SelectItem value="EcoCoins">EcoCoins</SelectItem>
                    <SelectItem value="Mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Categorías de interés</Label>
                <p className="text-sm text-gray-600">Esto ayuda a priorizar resultados y sugerencias.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={categories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Notificaciones</Label>
                <p className="text-sm text-gray-600">Puedes cambiarlo luego en tu perfil.</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={emailNotifications}
                  onCheckedChange={(v) => setEmailNotifications(Boolean(v))}
                />
                <span>Recibir notificaciones por email</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Reciclaje</Label>
                <p className="text-sm text-gray-600">Esto habilita sugerencias del módulo de reciclaje.</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={recyclingInterest}
                  onCheckedChange={(v) => setRecyclingInterest(Boolean(v))}
                />
                <span>Me interesa participar en reciclaje</span>
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Finalizar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
