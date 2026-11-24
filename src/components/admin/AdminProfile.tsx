import React, { useEffect, useState } from 'react';
import { Camera, Check, ShieldCheck, Trash2, Upload, User } from 'lucide-react';
import { AdminSession } from '../../types/portal';
import { compressImageFile, getInitials, sanitizeImageUrl } from '../../lib/imageUtils';

export interface AdminProfileUpdates {
  fullName: string;
  email: string;
  whatsapp: string;
  jobTitle: string;
  bio: string;
  avatarUrl: string;
}

interface AdminProfileProps {
  session: AdminSession;
  onSaveProfile: (updates: AdminProfileUpdates) => Promise<void>;
}

export const AdminProfile: React.FC<AdminProfileProps> = ({ session, onSaveProfile }) => {
  const [fullName, setFullName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [whatsapp, setWhatsapp] = useState(session.whatsapp ?? '');
  const [jobTitle, setJobTitle] = useState(session.jobTitle ?? '');
  const [bio, setBio] = useState(session.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(session.avatarUrl ?? '');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(session.name);
    setEmail(session.email);
    setWhatsapp(session.whatsapp ?? '');
    setJobTitle(session.jobTitle ?? '');
    setBio(session.bio ?? '');
    setAvatarUrl(session.avatarUrl ?? '');
  }, [session]);

  const safeAvatar = sanitizeImageUrl(avatarUrl);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const compressed = await compressImageFile(file, 600, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la foto seleccionada.');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (fullName.trim().length < 2) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (avatarUrl.trim() && !sanitizeImageUrl(avatarUrl)) {
      setError('La URL de foto debe ser un enlace válido (https:// o imagen subida).');
      return;
    }

    setSaving(true);
    try {
      await onSaveProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        jobTitle: jobTitle.trim(),
        bio: bio.trim(),
        avatarUrl: sanitizeImageUrl(avatarUrl),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron guardar los cambios del perfil.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#892B84] font-semibold">
            Cuenta Administrativa
          </p>
          <h2 className="mt-1 font-sans text-lg font-semibold text-[#161513] inline-flex items-center gap-2">
            <User className="w-4 h-4 text-[#892B84]" />
            <span>Mi Perfil</span>
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Actualiza tus datos personales, cargo, teléfono de contacto y fotografía de perfil.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          <span>
            {saving ? 'Guardando perfil...' : saved ? 'Perfil actualizado' : 'Guardar perfil'}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Avatar & Account Metadata */}
        <section className="lg:col-span-4 bg-white border border-[#E6E2E8] p-6 space-y-5">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative w-32 h-32 border border-[#E6E2E8] bg-[#F9F5F9] overflow-hidden flex items-center justify-center">
              {safeAvatar ? (
                <img
                  src={safeAvatar}
                  alt={fullName || session.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-editorial text-3xl font-medium text-[#892B84]">
                  {getInitials(fullName || session.name)}
                </span>
              )}
            </div>

            <div>
              <p className="font-sans text-base font-semibold text-[#161513]">
                {fullName || session.name}
              </p>
              <p className="text-xs text-[#57534E] mt-0.5">
                {jobTitle || 'Administración del portal'}
              </p>
            </div>

            <div className="w-full flex flex-wrap items-center justify-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#892B84] text-[#892B84] text-xs font-semibold hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir foto de perfil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {safeAvatar && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E6E2E8] text-xs font-medium text-[#DC2626] hover:border-[#DC2626] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6E2E8] space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-[#57534E] mb-1">
                O pegar enlace de foto (URL)
              </label>
              <div className="relative">
                <Camera className="w-3.5 h-3.5 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#F9F8FA] border border-[#E6E2E8] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#57534E]">Usuario</span>
                <span className="font-mono text-[#161513]">@{session.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#57534E]">Rol asignado</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#892B84] uppercase text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {session.role}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Editable Personal Data */}
        <section className="lg:col-span-8 bg-white border border-[#E6E2E8] p-6 space-y-5">
          <h3 className="font-sans text-sm font-semibold text-[#161513] pb-3 border-b border-[#E6E2E8]">
            Datos personales y de contacto
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Nombre completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Sofía Mendoza Villalobos"
                className="w-full px-3 py-2.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#57534E] mb-1">Correo electrónico *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@mujerinmobiliariayasociadas.com"
                className="w-full px-3 py-2.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#57534E] mb-1">Teléfono / WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+52 56 2337 3050"
                className="w-full px-3 py-2.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#57534E] mb-1">Cargo o puesto</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ej. Directora General"
                className="w-full px-3 py-2.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#57534E] mb-1">
              Semblanza profesional o notas personales
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe tu especialidad, plazas que atiendes o notas de contacto..."
              className="w-full px-3 py-2.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
            />
          </div>
        </section>
      </div>
    </form>
  );
};
