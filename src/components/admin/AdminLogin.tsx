import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { AdminSession } from '../../types/portal';
import { loginAdminAccount } from '../../lib/portalStore';
import { BrandLogo } from '../BrandLogo';

interface AdminLoginProps {
  onLogin: (session: AdminSession) => void;
  onBackToPortal: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBackToPortal }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 4) {
      setError('Ingresa tu usuario y contraseña para continuar.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await loginAdminAccount(username, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onLogin(result.session);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8FA] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-[1280px] w-full mx-auto">
        <button
          type="button"
          onClick={onBackToPortal}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#57534E] hover:text-[#892B84] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al portal público</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto bg-white border border-[#E6E2E8] p-6 sm:p-8 space-y-6 my-8">
        <div className="space-y-3 pb-5 border-b border-[#E6E2E8]">
          <BrandLogo className="h-11 w-auto" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#892B84] font-semibold">
              Acceso Privado
            </p>
            <h1 className="mt-1 text-2xl font-medium text-[#161513]">
              Administración del Portal
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-xs text-[#57534E] mb-1.5">
              Usuario
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs text-[#57534E] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="admin-password"
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
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Verificando acceso...' : 'Iniciar sesión'}</span>
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-[#57534E]">
        Mujer Inmobiliaria &amp; Asociadas · Sistema Privado
      </p>
    </div>
  );
};
