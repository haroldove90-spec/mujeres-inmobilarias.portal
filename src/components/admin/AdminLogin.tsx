import React, { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { AdminRole, AdminSession } from '../../types/portal';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { BrandLogo } from '../BrandLogo';

interface AdminLoginProps {
  onLogin: (session: AdminSession) => void;
  onBackToPortal: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBackToPortal }) => {
  const [email, setEmail] = useState('direccion@mujerinmobiliariayasociadas.com');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('administradora');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || password.trim().length < 4) {
      setError('Ingresa un correo válido y una contraseña de al menos 4 caracteres.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authErr || !data.user) {
          setError('Credenciales incorrectas o cuenta no autorizada.');
          setLoading(false);
          return;
        }
        onLogin({
          email: data.user.email ?? email.trim(),
          name:
            (data.user.user_metadata?.full_name as string | undefined) ??
            'Dirección General',
          role:
            (data.user.user_metadata?.role as AdminRole | undefined) ?? 'administradora',
        });
        return;
      }

      onLogin({
        email: email.trim(),
        name:
          role === 'administradora'
            ? 'Dirección General'
            : 'Sofía Mendoza Villalobos',
        role,
      });
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
              Panel Autoadministrable
            </p>
            <h1 className="mt-1 text-2xl font-medium text-[#161513]">
              Acceso a Administración
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSupabaseConfigured && (
            <div>
              <span className="block text-xs font-medium text-[#57534E] mb-1.5">
                Perfil de acceso
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRole('administradora');
                    setEmail('direccion@mujerinmobiliariayasociadas.com');
                  }}
                  className={`py-2 px-3 text-xs font-semibold border transition-colors cursor-pointer ${
                    role === 'administradora'
                      ? 'bg-[#892B84] text-white border-[#892B84]'
                      : 'bg-[#F9F8FA] text-[#161513] border-[#E6E2E8]'
                  }`}
                >
                  Administradora
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('asesora');
                    setEmail('sofia@mujerinmobiliariayasociadas.com');
                  }}
                  className={`py-2 px-3 text-xs font-semibold border transition-colors cursor-pointer ${
                    role === 'asesora'
                      ? 'bg-[#892B84] text-white border-[#892B84]'
                      : 'bg-[#F9F8FA] text-[#161513] border-[#E6E2E8]'
                  }`}
                >
                  Asesora
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs text-[#57534E] mb-1.5">
              Correo institucional
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="direccion@mujerinmobiliariayasociadas.com"
              className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs text-[#57534E] mb-1.5">
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isSupabaseConfigured
                  ? 'Ingresa tu contraseña'
                  : 'Mínimo 4 caracteres (vista previa)'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
            />
          </div>

          {error && <p className="text-xs text-[#DC2626]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Verificando...' : 'Entrar al panel'}</span>
          </button>
        </form>

        {!isSupabaseConfigured && (
          <p className="text-[11px] text-[#57534E] leading-relaxed border-t border-[#E6E2E8] pt-4">
            Modo de trabajo local activo. Todos los cambios en propiedades, precios, prospectos y
            contenidos se guardan en este navegador hasta conectar tu proyecto de Supabase.
          </p>
        )}
      </div>

      <p className="text-center text-xs text-[#57534E]">
        Mujer Inmobiliaria &amp; Asociadas · Administración Interna
      </p>
    </div>
  );
};
