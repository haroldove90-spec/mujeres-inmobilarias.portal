import React, { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, LogOut, User, X } from 'lucide-react';
import { ClientSession } from '../types/portal';
import { loginClientAccount, registerClientAccount } from '../lib/portalStore';
import { BrandLogo } from './BrandLogo';

interface ClientAuthModalProps {
  open: boolean;
  session: ClientSession | null;
  onClose: () => void;
  onAuthenticated: (session: ClientSession) => void;
  onLogout: () => void;
}

export const ClientAuthModal: React.FC<ClientAuthModalProps> = ({
  open,
  session,
  onClose,
  onAuthenticated,
  onLogout,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const resetFields = () => {
    setError('');
    setPassword('');
    setShowPassword(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      fullName.trim().length < 2 ||
      !email.includes('@') ||
      username.trim().length < 3 ||
      password.length < 6 ||
      whatsapp.replace(/\D/g, '').length < 8
    ) {
      setError(
        'Completa nombre completo, correo válido, usuario (mín. 3), contraseña (mín. 6) y WhatsApp.'
      );
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await registerClientAccount({
        fullName,
        email,
        username,
        password,
        whatsapp,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      resetFields();
      onAuthenticated(result.session);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 4) {
      setError('Ingresa tu usuario o correo y contraseña.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await loginClientAccount(username, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      resetFields();
      onAuthenticated(result.session);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161513]/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-auth-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white border border-[#E6E2E8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E6E2E8] flex items-center justify-between gap-4">
          <BrandLogo className="h-9 w-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar acceso de clientes"
            className="w-9 h-9 inline-flex items-center justify-center border border-[#E6E2E8] text-[#161513] hover:border-[#892B84] hover:text-[#892B84] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {session ? (
          <div className="p-6 sm:p-7 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#892B84] text-white inline-flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-[#892B84] font-semibold">
                  Cuenta de Cliente Activa
                </p>
                <h2 id="client-auth-title" className="mt-1 text-xl font-medium text-[#161513]">
                  {session.fullName}
                </h2>
              </div>
            </div>

            <div className="border-t border-b border-[#E6E2E8] py-4 space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-[#57534E]">Usuario</span>
                <span className="font-mono font-semibold text-[#161513]">@{session.username}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#57534E]">Correo</span>
                <span className="text-[#161513] truncate">{session.email}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#57534E]">WhatsApp</span>
                <span className="font-mono text-[#161513]">{session.whatsapp}</span>
              </div>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed">
              Tus datos se utilizarán automáticamente al solicitar recorridos privados o asesoría sin
              costo en el portal.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer"
              >
                Continuar en el portal
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="py-2.5 px-4 border border-[#E6E2E8] text-xs font-semibold text-[#57534E] hover:text-[#161513] hover:border-[#892B84] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-7 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#892B84] font-semibold">
                Portal de Clientes
              </p>
              <h2 id="client-auth-title" className="mt-1 text-2xl font-medium text-[#161513]">
                {mode === 'register' ? 'Registro de cliente' : 'Acceso a tu cuenta'}
              </h2>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 border border-[#E6E2E8] p-1 bg-[#F9F8FA]">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetFields();
                }}
                className={`py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-[#892B84] text-white' : 'text-[#57534E]'
                }`}
              >
                Registrarme
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFields();
                }}
                className={`py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-[#892B84] text-white' : 'text-[#57534E]'
                }`}
              >
                Iniciar sesión
              </button>
            </div>

            {mode === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label htmlFor="client-fullname" className="block text-xs text-[#57534E] mb-1">
                    Nombre completo
                  </label>
                  <input
                    id="client-fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre y apellidos"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                  />
                </div>

                <div>
                  <label htmlFor="client-email" className="block text-xs text-[#57534E] mb-1">
                    Correo electrónico
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="client-username" className="block text-xs text-[#57534E] mb-1">
                      Usuario
                    </label>
                    <input
                      id="client-username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ej. mariana.ortega"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-whatsapp" className="block text-xs text-[#57534E] mb-1">
                      WhatsApp
                    </label>
                    <input
                      id="client-whatsapp"
                      type="tel"
                      autoComplete="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+52 442 000 0000"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="client-password" className="block text-xs text-[#57534E] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="client-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-3.5 pr-11 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-[#57534E] hover:text-[#892B84] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-[#DC2626]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{loading ? 'Creando cuenta...' : 'Crear cuenta de cliente'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="client-login-user" className="block text-xs text-[#57534E] mb-1">
                    Usuario o correo electrónico
                  </label>
                  <input
                    id="client-login-user"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario o correo"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                  />
                </div>

                <div>
                  <label htmlFor="client-login-pass" className="block text-xs text-[#57534E] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="client-login-pass"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-11 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-[#57534E] hover:text-[#892B84] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-[#DC2626]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{loading ? 'Validando acceso...' : 'Iniciar sesión'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
