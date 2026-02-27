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

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isLoading, refreshProfile } = useAuth();

  const alreadyCompleted = Boolean(user?.preferences?.onboardingCompleted || (user as any)?.onboardingCompleted);

  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
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
      await api.completeOnboarding({
        accountType,
        location: {
          city: city.trim(),
          province: province.trim(),
        },
        preferences: {
          categories,
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
