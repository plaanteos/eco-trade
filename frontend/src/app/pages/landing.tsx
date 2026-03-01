import { Link, Navigate } from 'react-router';
import {
  ArrowRight,
  Award,
  BarChart3,
  Coins,
  Globe,
  Heart,
  Leaf,
  Recycle,
  Shield,
  ShoppingBag,
  Users,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { useAuth } from '../lib/auth-context';

export function LandingPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chart-2/15">
                <Leaf className="h-5 w-5 text-chart-2" />
              </div>
              <span className="text-lg font-semibold">EcoTrade</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link to="/register">
                <Button className="gap-2">
                  Registrarse <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-chart-2/10 px-4 py-2 text-sm text-chart-2">
              <Leaf className="h-4 w-4" />
              Economía Circular Sostenible
            </div>

            <h1 className="mt-8 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Compra, Vende y Recicla.
              <br />
              <span className="text-chart-2">Gana Recompensas.</span>
            </h1>

            <p className="mt-6 text-pretty text-base text-muted-foreground md:text-lg">
              La plataforma que convierte tus acciones sostenibles en recompensas.
              Únete a la revolución de la economía circular y contribuye a un planeta más verde.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Comenzar Gratis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="outline">
                  Ver Cómo Funciona
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <ShoppingBag className="h-5 w-5 text-chart-2" />
                </div>
                <div className="text-2xl font-semibold">10K+</div>
                <div className="text-center text-sm text-muted-foreground">Productos Vendidos</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Users className="h-5 w-5 text-chart-3" />
                </div>
                <div className="text-2xl font-semibold">5K+</div>
                <div className="text-center text-sm text-muted-foreground">Usuarios Activos</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Leaf className="h-5 w-5 text-chart-2" />
                </div>
                <div className="text-2xl font-semibold">50 Ton</div>
                <div className="text-center text-sm text-muted-foreground">CO₂ Ahorrado</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Recycle className="h-5 w-5 text-chart-5" />
                </div>
                <div className="text-2xl font-semibold">100+</div>
                <div className="text-center text-sm text-muted-foreground">Puntos de Reciclaje</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Todo lo que necesitas para ser más sostenible
            </h2>
            <p className="mt-3 text-muted-foreground">
              Una plataforma completa que te recompensa por tus acciones ecológicas
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10">
                  <ShoppingBag className="h-5 w-5 text-chart-2" />
                </div>
                <CardTitle>Marketplace Sostenible</CardTitle>
                <CardDescription>
                  Compra y vende productos de segunda mano de calidad. Dale una segunda vida a lo que ya no usas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10">
                  <Coins className="h-5 w-5 text-chart-3" />
                </div>
                <CardTitle>Gana EcoCoins</CardTitle>
                <CardDescription>
                  Cada transacción te recompensa con EcoCoins que puedes usar en futuras compras o canjear por beneficios.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/15">
                  <Recycle className="h-5 w-5 text-chart-4" />
                </div>
                <CardTitle>Puntos de Reciclaje</CardTitle>
                <CardDescription>
                  Encuentra puntos de reciclaje cercanos y obtén recompensas adicionales por reciclar correctamente.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-5/10">
                  <BarChart3 className="h-5 w-5 text-chart-5" />
                </div>
                <CardTitle>Impacto Medible</CardTitle>
                <CardDescription>
                  Visualiza tu contribución al medio ambiente con estadísticas de CO₂, energía y agua ahorrada.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10">
                  <Award className="h-5 w-5 text-chart-1" />
                </div>
                <CardTitle>Sistema de Logros</CardTitle>
                <CardDescription>
                  Completa desafíos, gana logros y mejora tu puntuación de sostenibilidad.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Globe className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle>Comunidad Global</CardTitle>
                <CardDescription>
                  Únete a miles de usuarios comprometidos con la economía circular y el consumo responsable.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">¿Cómo funciona?</h2>
            <p className="mt-3 text-muted-foreground">Tres simples pasos para empezar a ganar recompensas</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chart-2 text-primary-foreground">
                <span className="text-xl font-semibold">1</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Regístrate Gratis</h3>
              <p className="mt-2 text-muted-foreground">
                Crea tu cuenta en menos de 2 minutos y recibe tus primeros EcoCoins de bienvenida
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chart-3 text-primary-foreground">
                <span className="text-xl font-semibold">2</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Compra, Vende o Recicla</h3>
              <p className="mt-2 text-muted-foreground">
                Publica productos, compra artículos sostenibles o lleva tus materiales a puntos de reciclaje
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chart-1 text-primary-foreground">
                <span className="text-xl font-semibold">3</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Gana y Canjea</h3>
              <p className="mt-2 text-muted-foreground">
                Acumula EcoCoins con cada acción y canjéalos por descuentos, beneficios y más
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why EcoTrade */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">¿Por qué elegir EcoTrade?</h2>
              <p className="mt-4 text-muted-foreground">
                Somos más que un marketplace. Somos una comunidad comprometida con el futuro del planeta y tu bienestar económico.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  'Reduce tu huella de carbono',
                  'Ahorra dinero comprando usado',
                  'Genera ingresos extra vendiendo',
                  'Conecta con una comunidad verde',
                  'Recibe recompensas por ser sostenible',
                  'Acceso a estadísticas de impacto',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-chart-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link to="/register">
                  <Button size="lg" className="gap-2">
                    Unirse Ahora <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card className="bg-chart-2 text-primary-foreground">
                <CardContent className="p-6">
                  <Shield className="h-7 w-7" />
                  <div className="mt-6 text-4xl font-semibold">100%</div>
                  <div className="mt-2 text-lg font-medium">Seguro y Confiable</div>
                </CardContent>
              </Card>

              <Card className="bg-chart-3 text-primary-foreground">
                <CardContent className="p-6">
                  <Zap className="h-7 w-7" />
                  <div className="mt-6 text-4xl font-semibold">24/7</div>
                  <div className="mt-2 text-lg font-medium">Disponible Siempre</div>
                </CardContent>
              </Card>

              <Card className="bg-chart-1 text-primary-foreground">
                <CardContent className="p-6">
                  <Heart className="h-7 w-7" />
                  <div className="mt-6 text-4xl font-semibold">5K+</div>
                  <div className="mt-2 text-lg font-medium">Usuarios Felices</div>
                </CardContent>
              </Card>

              <Card className="bg-chart-5 text-primary-foreground">
                <CardContent className="p-6">
                  <Globe className="h-7 w-7" />
                  <div className="mt-6 text-4xl font-semibold">8</div>
                  <div className="mt-2 text-lg font-medium">Países Activos</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA + Footer */}
      <section className="bg-gradient-to-r from-chart-2 to-chart-3 py-16 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10">
              <span className="h-5 w-5 rounded-full border-2 border-primary-foreground/60" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold md:text-5xl">Comienza tu viaje sostenible hoy</h2>
            <p className="mt-4 text-primary-foreground/80">
              Únete a miles de usuarios que ya están haciendo la diferencia. Cada acción cuenta, cada decisión importa.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Crear Cuenta Gratis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-14 border-t border-primary-foreground/15 pt-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-semibold">EcoTrade</span>
                </div>
                <p className="mt-4 text-sm text-primary-foreground/70">
                  Plataforma de economía circular para un futuro sostenible.
                </p>
              </div>

              <div>
                <div className="font-medium">Producto</div>
                <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
                  <li>Marketplace</li>
                  <li>EcoCoins</li>
                  <li>Reciclaje</li>
                </ul>
              </div>

              <div>
                <div className="font-medium">Compañía</div>
                <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
                  <li>Sobre Nosotros</li>
                  <li>Blog</li>
                  <li>Contacto</li>
                </ul>
              </div>

              <div>
                <div className="font-medium">Legal</div>
                <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
                  <li>Privacidad</li>
                  <li>Términos</li>
                  <li>Cookies</li>
                </ul>
              </div>
            </div>

            <div className="mt-10 text-center text-sm text-primary-foreground/60">
              © 2026 EcoTrade. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
