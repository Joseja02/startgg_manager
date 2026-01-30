import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsAuthenticating(true);
      toast({
        title: 'Autenticando...',
        description: 'Verificando credenciales',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    // OAuth real: redirigir al backend
    setIsAuthenticating(true);
    toast({
      title: 'Iniciando sesión...',
      description: 'Redirigiendo a start.gg',
    });
    const base = import.meta.env.VITE_API_BASE_URL;
    const normalized =
      !base || base === 'undefined' || base === 'null' ? '' : base;
    window.location.href = normalized ? `${normalized}/auth/login` : '/auth/login';
  };

  const handleAdminLogin = () => {
    sessionStorage.setItem('auth_token', 'mock_admin_token_' + Date.now());
    sessionStorage.setItem('mock_admin', 'true');
    setIsAuthenticating(true);
    toast({
      title: 'Iniciando sesión como Admin...',
      description: 'Redirigiendo a start.gg',
    });
    
    setTimeout(() => {
      window.location.href = '/dashboard?token=mock_admin_token';
    }, 1000);
  };

  return (
    <AuthLayout>
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-primary p-4">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Start.gg Bracket Manager</CardTitle>
          <CardDescription>
            Gestiona tus brackets de Smash Ultimate con facilidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="w-full bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            {isAuthenticating ? 'Autenticando...' : 'Iniciar sesión con start.gg'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Demo Mode</span>
            </div>
          </div>

          <Button
            onClick={handleAdminLogin}
            disabled={isAuthenticating}
            variant="outline"
            className="w-full"
          >
            Login como Admin (Demo)
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Conecta tu cuenta de start.gg para acceder a tus eventos y sets
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
