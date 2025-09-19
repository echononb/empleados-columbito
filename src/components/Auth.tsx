import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, register, loginWithGoogle, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        setSuccess('¡Inicio de sesión exitoso!');
      } else {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        await register(email, password);
        setSuccess('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Check if Firebase is properly configured
      if (!error.code) {
        setError('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.');
        return;
      }

      switch (error.code) {
        case 'auth/user-not-found':
          setError('Usuario no encontrado. Verifica tu email.');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta.');
          break;
        case 'auth/email-already-in-use':
          setError('Este email ya está registrado.');
          break;
        case 'auth/weak-password':
          setError('La contraseña es muy débil.');
          break;
        case 'auth/invalid-email':
          setError('Email inválido.');
          break;
        case 'auth/network-request-failed':
          setError('Error de conexión. Verifica tu conexión a internet.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos. Inténtalo más tarde.');
          break;
        case 'auth/operation-not-allowed':
          setError('Esta operación no está permitida. Contacta al administrador.');
          break;
        default:
          setError(`Error de autenticación: ${error.message || 'Inténtalo de nuevo.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await loginWithGoogle();
      setSuccess('¡Inicio de sesión exitoso!');
    } catch (error: any) {
      console.error('Google auth error:', error);
      setError('Error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(resetEmail);
      setSuccess('Se ha enviado un email para restablecer tu contraseña.');
      setShowResetPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No se encontró una cuenta con este email.');
      } else {
        setError('Error al enviar el email de restablecimiento.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Restablecer Contraseña</h2>
            <p>Ingresa tu email para recibir instrucciones</p>
          </div>

          <form onSubmit={handleResetPassword} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="resetEmail">Email</label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="auth-actions">
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Empleados ColumBito</h1>
          <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          )}

          <div className="auth-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </div>
        </form>

        <div className="auth-divider">
          <span>o</span>
        </div>

        <div className="auth-google">
          <button
            onClick={handleGoogleLogin}
            className="btn btn-google"
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className="auth-links">
          {isLogin ? (
            <>
              <button
                onClick={() => setShowResetPassword(true)}
                className="auth-link"
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className="auth-link"
                disabled={loading}
              >
                Crear cuenta nueva
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsLogin(true)}
              className="auth-link"
              disabled={loading}
            >
              Ya tengo cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;