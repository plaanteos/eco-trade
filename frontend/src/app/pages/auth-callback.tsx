import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithSupabaseAccessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (!supabase) {
          setError('Supabase no está configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
          return;
        }

        // PKCE flow: intercambia el `code` por session si corresponde.
        const url = window.location.href;
        if (url.includes('code=')) {
          await supabase.auth.exchangeCodeForSession(url);
        }

        const { data } = await supabase.auth.getSession();
        const accessToken = data?.session?.access_token;
        if (!accessToken) {
          setError('No se pudo obtener sesión OAuth. Intenta nuevamente.');
          return;
        }

        await loginWithSupabaseAccessToken(accessToken);
        navigate('/', { replace: true });
      } catch (e: any) {
        setError(e?.message || 'Error procesando login OAuth');
      }
    };

    run();
  }, [loginWithSupabaseAccessToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Conectando tu cuenta...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!error ? (
              <p className="text-sm text-gray-600">Finalizando inicio de sesión con Google.</p>
            ) : (
              <>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  className="text-sm text-green-700 underline"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  Volver al login
                </button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
