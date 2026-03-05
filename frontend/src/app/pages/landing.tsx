import { Link, Navigate } from 'react-router';
import {
  ArrowRight,
  Award,
  BarChart3,
  Coins,
  FileText,
  Globe,
  Heart,
  Leaf,
  Mail,
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
              Intercambia, vende y recicla.
              <br />
              <span className="text-chart-2">Gana ecoCoins.</span>
            </h1>

            <p className="mt-6 text-pretty text-base text-muted-foreground md:text-lg">
              EcoTrade es una plataforma de economía circular donde publicas productos, realizas transacciones
              sostenibles y recibes recompensas. Entra, entiende y empieza en minutos.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Comenzar Gratis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#empezar">
                <Button size="lg" variant="outline">
                  Guía rápida
                </Button>
              </a>
            </div>

            <div className="mx-auto mt-4 max-w-3xl rounded-2xl border bg-background/60 p-3 text-left backdrop-blur sm:mt-6 sm:p-4">
              <div className="text-sm font-medium">Por qué existe EcoTrade</div>
              <blockquote className="mt-2 border-l-2 border-chart-2/30 pl-4 text-pretty text-base text-muted-foreground italic leading-relaxed">
                “La basura no desaparece.
                <br className="hidden sm:block" />
                Y en realidad nunca existió.
                <br className="hidden sm:block" />
                Solo existe un sistema que todavía no aprendió a verla como recurso.”
              </blockquote>
            </div>

            <div className="mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-3 text-left md:grid-cols-2">
              {[
                {
                  title: '¿Qué hace?',
                  text: 'Publica, encuentra e intercambia productos y registra transacciones de forma clara.',
                },
                {
                  title: '¿Cómo te ayuda?',
                  text: 'Ahorra con reutilización, genera ingresos extra vendiendo y reduce residuos.',
                },
                {
                  title: 'Valor inmediato',
                  text: 'Ganas ecoCoins por participar (regla base: 1 ecoCoin por cada 10 unidades, con bonificaciones según el caso).',
                },
                {
                  title: 'Cómo empezar',
                  text: 'Regístrate, publica o busca, completa una transacción y revisa tu perfil/ecoCoins.',
                },
              ].map((item) => (
                <Card key={item.title} className="bg-background/70">
                  <CardContent className="flex gap-3 p-4">
                    <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-chart-2/10">
                      <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{item.text}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <ShoppingBag className="h-5 w-5 text-chart-2" />
                </div>
                <div className="text-2xl font-semibold">Marketplace</div>
                <div className="text-center text-sm text-muted-foreground">Compra y venta sostenible</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Users className="h-5 w-5 text-chart-3" />
                </div>
                <div className="text-2xl font-semibold">Comunidad</div>
                <div className="text-center text-sm text-muted-foreground">Intercambios con propósito</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Leaf className="h-5 w-5 text-chart-2" />
                </div>
                <div className="text-2xl font-semibold">Impacto</div>
                <div className="text-center text-sm text-muted-foreground">Reutiliza y reduce residuos</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Recycle className="h-5 w-5 text-chart-5" />
                </div>
                <div className="text-2xl font-semibold">Reciclaje</div>
                <div className="text-center text-sm text-muted-foreground">Puntos y reportes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick start */}
      <section id="empezar" className="py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Guía rápida: empieza en 4 pasos</h2>
            <p className="mt-3 text-muted-foreground">
              Tiempo es lo más valioso: aquí tienes el camino corto para entrar y ver valor sin perderte.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-4">
            {[
              { n: '1', title: 'Regístrate', text: 'Crea tu cuenta y accede al panel.' },
              { n: '2', title: 'Publica o busca', text: 'Sube un producto o explora el marketplace.' },
              { n: '3', title: 'Transacciona', text: 'Completa una compra/venta o intercambio.' },
              { n: '4', title: 'Revisa ecoCoins', text: 'Consulta recompensas e historial en tu perfil.' },
            ].map((step) => (
              <Card key={step.title}>
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10">
                    <span className="text-sm font-semibold text-chart-2">{step.n}</span>
                  </div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <CardDescription>{step.text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Crear cuenta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Ya tengo cuenta
              </Button>
            </Link>
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
                Acumula ecoCoins con cada acción y úsalos como beneficio dentro de la plataforma
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
                  <div className="mt-6 text-4xl font-semibold">Seguro</div>
                  <div className="mt-2 text-lg font-medium">Acceso y permisos</div>
                </CardContent>
              </Card>

              <Card className="bg-chart-3 text-primary-foreground">
                <CardContent className="p-6">
                  <Zap className="h-7 w-7" />
                  <div className="mt-6 text-4xl font-semibold">Simple</div>
                  <div className="mt-2 text-lg font-medium">Flujo directo</div>
                </CardContent>
              </Card>

              <Card className="bg-chart-1 text-primary-foreground">
                <CardContent className="p-6">
                  <Heart className="h-7 w-7" />
                  <div className="mt-6 text-4xl font-semibold">Comunidad</div>
                  <div className="mt-2 text-lg font-medium">Intercambios responsables</div>
                </CardContent>
              </Card>

              <Card className="bg-chart-5 text-primary-foreground">
                <CardContent className="p-6">
                  <Globe className="h-7 w-7" />
                  <div className="mt-6 text-4xl font-semibold">Impacto</div>
                  <div className="mt-2 text-lg font-medium">Economía circular</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="confianza" className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Confianza y transparencia</h2>
            <p className="mt-3 text-muted-foreground">
              Explicaciones claras, contacto directo y un resumen simple de privacidad/uso.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <Card id="contacto">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10">
                  <Mail className="h-5 w-5 text-chart-3" />
                </div>
                <CardTitle>Contacto</CardTitle>
                <CardDescription>
                  Soporte, dudas o reportes: <a className="underline" href="mailto:jesusjcopes@gmail.com">jesusjcopes@gmail.com</a>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card id="privacidad">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10">
                  <Shield className="h-5 w-5 text-chart-2" />
                </div>
                <CardTitle>Privacidad (resumen)</CardTitle>
                <CardDescription>
                  Usamos datos de cuenta y actividad (publicaciones y transacciones) para operar EcoTrade. Puedes solicitar
                  actualización o eliminación de tu cuenta por contacto.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card id="terminos">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-chart-5/10">
                  <FileText className="h-5 w-5 text-chart-5" />
                </div>
                <CardTitle>Uso y reglas</CardTitle>
                <CardDescription>
                  La plataforma facilita intercambios responsables. Se aplican reglas de convivencia y medidas ante abuso para
                  proteger a la comunidad.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mx-auto mt-8 max-w-5xl">
            <Card className="bg-secondary/30">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm font-medium">¿Cómo se calculan los ecoCoins?</div>
                  <div className="text-sm text-muted-foreground">
                    Regla base: 1 ecoCoin por cada 10 unidades. Puede haber multiplicadores según categoría, condición y bonificaciones.
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <li><a className="underline" href="#como-funciona">Cómo funciona</a></li>
                  <li><a className="underline" href="#confianza">Confianza</a></li>
                  <li><a className="underline" href="#contacto">Contacto</a></li>
                </ul>
              </div>

              <div>
                <div className="font-medium">Legal</div>
                <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
                  <li><a className="underline" href="#privacidad">Privacidad</a></li>
                  <li><a className="underline" href="#terminos">Términos</a></li>
                  <li><span>Cookies</span></li>
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
