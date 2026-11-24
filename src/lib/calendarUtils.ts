import { VisitAppointment } from '../types/portal';

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsUtcDateTime(dateStr: string, timeStr: string, offsetMinutes = 0): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1, hour || 9, minute || 0, 0);
  if (offsetMinutes !== 0) {
    d.setMinutes(d.getMinutes() + offsetMinutes);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function toIcsUtcStamp(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const safe = isNaN(d.getTime()) ? new Date() : d;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${safe.getUTCFullYear()}${pad(safe.getUTCMonth() + 1)}${pad(safe.getUTCDate())}` +
    `T${pad(safe.getUTCHours())}${pad(safe.getUTCMinutes())}${pad(safe.getUTCSeconds())}Z`
  );
}

function buildVEvent(apt: VisitAppointment): string {
  const dtStart = toIcsUtcDateTime(apt.date, apt.startTime, 0);
  const dtEnd = toIcsUtcDateTime(apt.date, apt.startTime, apt.durationMinutes || 60);
  const dtStamp = toIcsUtcStamp(apt.createdAt);

  const descriptionLines = [
    `Cliente: ${apt.clientName}`,
    apt.clientPhone ? `Teléfono: ${apt.clientPhone}` : '',
    apt.clientEmail ? `Correo: ${apt.clientEmail}` : '',
    apt.advisorName ? `Asesora: ${apt.advisorName}` : '',
    apt.propertyFolio ? `Folio: ${apt.propertyFolio}` : '',
    apt.notes ? `Notas: ${apt.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const reminder = Math.max(5, apt.reminderMinutes || 30);

  return [
    'BEGIN:VEVENT',
    `UID:${apt.id}@mujerinmobiliaria`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(apt.title)}`,
    `LOCATION:${escapeIcsText(apt.location || 'Por confirmar')}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines)}`,
    `STATUS:${apt.status === 'Cancelada' ? 'CANCELLED' : 'CONFIRMED'}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Recordatorio de visita: ${apt.title}`)}`,
    `TRIGGER:-PT${reminder}M`,
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

export function buildAppointmentsIcs(appointments: VisitAppointment[]): string {
  const events = appointments.map(buildVEvent).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mujer Inmobiliaria y Asociadas//Agenda de Visitas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function triggerIcsDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAppointmentIcs(apt: VisitAppointment): void {
  const safeName = (apt.propertyFolio || apt.clientName || 'visita')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  triggerIcsDownload(`visita-${safeName}-${apt.date}.ics`, buildAppointmentsIcs([apt]));
}

export function downloadAllAppointmentsIcs(appointments: VisitAppointment[]): void {
  const active = appointments.filter((a) => a.status !== 'Cancelada');
  if (active.length === 0) return;
  triggerIcsDownload('agenda-mujer-inmobiliaria.ics', buildAppointmentsIcs(active));
}

export function getAppointmentTimestamp(apt: VisitAppointment): number {
  const [y, m, d] = apt.date.split('-').map(Number);
  const [hh, mm] = apt.startTime.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 9, mm || 0, 0).getTime();
}

export function getMinutesUntilAppointment(apt: VisitAppointment, nowMs = Date.now()): number {
  return Math.round((getAppointmentTimestamp(apt) - nowMs) / 60000);
}

export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
