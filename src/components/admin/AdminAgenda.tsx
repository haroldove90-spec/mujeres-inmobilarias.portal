import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  Advisor,
  AppointmentStatus,
  PropertyListing,
  VisitAppointment,
} from '../../types/portal';
import {
  downloadAllAppointmentsIcs,
  downloadAppointmentIcs,
  formatReadableDate,
  getAppointmentTimestamp,
  getMinutesUntilAppointment,
} from '../../lib/calendarUtils';

interface AdminAgendaProps {
  appointments: VisitAppointment[];
  properties: PropertyListing[];
  advisors: Advisor[];
  prefillDraft?: Partial<VisitAppointment> | null;
  onClearPrefill?: () => void;
  onSaveAppointment: (item: VisitAppointment) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const STATUS_OPTIONS: AppointmentStatus[] = [
  'Programada',
  'Confirmada',
  'Completada',
  'Cancelada',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function getTodayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export const AdminAgenda: React.FC<AdminAgendaProps> = ({
  appointments,
  properties,
  advisors,
  prefillDraft,
  onClearPrefill,
  onSaveAppointment,
  onDeleteAppointment,
}) => {
  const todayIso = getTodayIso();
  const nowDate = new Date();

  const [viewYear, setViewYear] = useState(nowDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(nowDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [listMode, setListMode] = useState<'upcoming' | 'day'>('upcoming');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? window.Notification.permission
      : 'unsupported'
  );
  const [alertNotice, setAlertNotice] = useState('');

  // Modal editor state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [date, setDate] = useState(todayIso);
  const [startTime, setStartTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('Programada');
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [leadId, setLeadId] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Handle prefill from Leads CRM ("Agendar visita en calendario")
  useEffect(() => {
    if (!prefillDraft) return;
    setEditingId(null);
    setTitle(prefillDraft.title ?? 'Visita a propiedad');
    setClientName(prefillDraft.clientName ?? '');
    setClientPhone(prefillDraft.clientPhone ?? '');
    setClientEmail(prefillDraft.clientEmail ?? '');
    setPropertyId(prefillDraft.propertyId ?? '');
    setAdvisorName(prefillDraft.advisorName || advisors[0]?.name || '');
    setDate(prefillDraft.date || todayIso);
    setStartTime(prefillDraft.startTime || '11:00');
    setDurationMinutes(prefillDraft.durationMinutes ?? 60);
    setLocation(prefillDraft.location ?? '');
    setNotes(prefillDraft.notes ?? '');
    setStatus(prefillDraft.status ?? 'Programada');
    setReminderMinutes(prefillDraft.reminderMinutes ?? 60);
    setLeadId(prefillDraft.leadId);
    setFormError('');
    setModalOpen(true);
    onClearPrefill?.();
  }, [prefillDraft, advisors, todayIso, onClearPrefill]);

  // Browser notification scheduler while admin agenda is open
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      notificationPermission !== 'granted'
    ) {
      return;
    }

    const notifiedKey = 'mia_notified_appointments_v1';
    const checkReminders = () => {
      let seen: Record<string, boolean> = {};
      try {
        seen = JSON.parse(sessionStorage.getItem(notifiedKey) || '{}') as Record<string, boolean>;
      } catch {
        seen = {};
      }

      const now = Date.now();
      let updated = false;

      for (const apt of appointments) {
        if (apt.status === 'Cancelada' || apt.status === 'Completada') continue;
        const mins = getMinutesUntilAppointment(apt, now);
        const windowMins = apt.reminderMinutes || 60;
        const cacheKey = `${apt.id}_${apt.date}_${apt.startTime}`;
        if (mins >= 0 && mins <= windowMins && !seen[cacheKey]) {
          try {
            new window.Notification(`Visita próxima · ${apt.startTime}`, {
              body: `${apt.title} con ${apt.clientName}${apt.location ? ` en ${apt.location}` : ''}.`,
            });
            seen[cacheKey] = true;
            updated = true;
          } catch {
            // Ignore browser Notification runtime restrictions
          }
        }
      }

      if (updated) {
        try {
          sessionStorage.setItem(notifiedKey, JSON.stringify(seen));
        } catch {
          // Ignore storage error
        }
      }
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 60000);
    return () => window.clearInterval(timer);
  }, [appointments, notificationPermission]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Monday-first index (0 = Mon ... 6 = Sun)
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: { iso: string; day: number; inMonth: boolean }[] = [];
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, d);
      cells.push({
        iso: toIsoDate(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate()),
        day: d,
        inMonth: false,
      });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({
        iso: toIsoDate(viewYear, viewMonth, d),
        day: d,
        inMonth: true,
      });
    }
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      cells.push({
        iso: toIsoDate(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate()),
        day: d,
        inMonth: false,
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, VisitAppointment[]>();
    for (const apt of appointments) {
      const list = map.get(apt.date) ?? [];
      list.push(apt);
      map.set(apt.date, list);
    }
    return map;
  }, [appointments]);

  const upcomingAlerts = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => a.status !== 'Cancelada' && a.status !== 'Completada')
      .map((a) => ({ apt: a, mins: getMinutesUntilAppointment(a, now) }))
      .filter(({ mins }) => mins >= -30 && mins <= 48 * 60)
      .sort((a, b) => a.mins - b.mins);
  }, [appointments]);

  const displayedAppointments = useMemo(() => {
    if (listMode === 'day') {
      return [...(appointmentsByDate.get(selectedDate) ?? [])].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
    }
    return [...appointments].sort(
      (a, b) => getAppointmentTimestamp(a) - getAppointmentTimestamp(b)
    );
  }, [appointments, appointmentsByDate, listMode, selectedDate]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setAlertNotice('Tu navegador no admite notificaciones locales; usa el archivo .ics para alertas en tu celular.');
      return;
    }
    const result = await window.Notification.requestPermission();
    setNotificationPermission(result);
    if (result === 'granted') {
      setAlertNotice('Notificaciones activadas en este dispositivo.');
      try {
        new window.Notification('Agenda Mujer Inmobiliaria', {
          body: 'Las alertas de próximas visitas quedaron activadas.',
        });
      } catch {
        // Ignore if blocked
      }
    } else {
      setAlertNotice('Permiso de notificaciones denegado. Puedes activar alertas descargando la cita (.ics) a tu celular.');
    }
  };

  const openNewModal = (targetDate?: string) => {
    setEditingId(null);
    setTitle('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setPropertyId('');
    setAdvisorName(advisors[0]?.name ?? '');
    setDate(targetDate || selectedDate || todayIso);
    setStartTime('11:00');
    setDurationMinutes(60);
    setLocation('');
    setNotes('');
    setStatus('Programada');
    setReminderMinutes(60);
    setLeadId(undefined);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (apt: VisitAppointment) => {
    setEditingId(apt.id);
    setTitle(apt.title);
    setClientName(apt.clientName);
    setClientPhone(apt.clientPhone);
    setClientEmail(apt.clientEmail);
    setPropertyId(apt.propertyId ?? '');
    setAdvisorName(apt.advisorName);
    setDate(apt.date);
    setStartTime(apt.startTime);
    setDurationMinutes(apt.durationMinutes);
    setLocation(apt.location);
    setNotes(apt.notes);
    setStatus(apt.status);
    setReminderMinutes(apt.reminderMinutes);
    setLeadId(apt.leadId);
    setFormError('');
    setModalOpen(true);
  };

  const handlePropertySelect = (selectedPropId: string) => {
    setPropertyId(selectedPropId);
    const found = properties.find((p) => p.id === selectedPropId);
    if (!found) return;
    if (!title.trim()) {
      setTitle(`Visita · ${found.title}`);
    }
    if (!location.trim()) {
      setLocation(`${found.zone}, ${found.state}`);
    }
    if (!advisorName && found.advisor.name) {
      setAdvisorName(found.advisor.name);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || !date || !startTime) {
      setFormError('Completa título de la visita, nombre del cliente, fecha y hora.');
      return;
    }
    setFormError('');
    setSaving(true);
    const linkedProp = properties.find((p) => p.id === propertyId);
    const existing = editingId ? appointments.find((a) => a.id === editingId) : undefined;

    await onSaveAppointment({
      id: editingId ?? `apt-${Date.now()}`,
      title: title.trim(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      propertyId: linkedProp?.id,
      propertyTitle: linkedProp?.title ?? existing?.propertyTitle,
      propertyFolio: linkedProp?.folio ?? existing?.propertyFolio,
      advisorName: advisorName.trim(),
      date,
      startTime,
      durationMinutes: Number(durationMinutes) || 60,
      location: location.trim(),
      notes: notes.trim(),
      status,
      reminderMinutes: Number(reminderMinutes) || 60,
      leadId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    setSaving(false);
    setSelectedDate(date);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-white border border-[#E6E2E8] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-base font-semibold text-[#161513]">
            Agenda de visitas y recordatorios
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Programa recorridos, sincronízalos con el calendario de tu celular (.ics) y recibe alertas antes de cada cita.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {notificationPermission !== 'unsupported' && (
            <button
              type="button"
              onClick={handleRequestNotifications}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-[#F0FDF4] border-[#16A34A]/40 text-[#15803D]'
                  : 'bg-white border-[#E6E2E8] text-[#161513] hover:border-[#892B84]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {notificationPermission === 'granted'
                  ? 'Alertas activadas'
                  : 'Activar alertas en dispositivo'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => downloadAllAppointmentsIcs(appointments)}
            disabled={appointments.filter((a) => a.status !== 'Cancelada').length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E6E2E8] bg-white text-xs font-medium text-[#161513] hover:border-[#892B84] hover:text-[#892B84] disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar al calendario (.ics)</span>
          </button>

          <button
            type="button"
            onClick={() => openNewModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva visita</span>
          </button>
        </div>
      </div>

      {alertNotice && (
        <div className="bg-[#F9F5F9] border border-[#892B84]/30 px-4 py-2.5 text-xs text-[#161513] flex items-center justify-between gap-3">
          <span>{alertNotice}</span>
          <button
            type="button"
            onClick={() => setAlertNotice('')}
            className="text-[#57534E] hover:text-[#161513] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upcoming Reminders Strip */}
      {upcomingAlerts.length > 0 && (
        <div className="bg-white border border-[#892B84]/35 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#892B84] inline-flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Próximas visitas (siguientes 48 horas)</span>
            </p>
            <span className="font-mono text-xs text-[#57534E] tabular-nums">
              {upcomingAlerts.length} {upcomingAlerts.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingAlerts.slice(0, 3).map(({ apt, mins }) => {
              const countdownLabel =
                mins <= 0
                  ? 'En curso o por iniciar'
                  : mins < 60
                  ? `En ${mins} min`
                  : mins < 24 * 60
                  ? `En ${Math.round(mins / 60)} h`
                  : `${formatReadableDate(apt.date)} · ${apt.startTime}`;

              return (
                <div
                  key={apt.id}
                  className="p-3 bg-[#F9F8FA] border border-[#E6E2E8] flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-[#892B84] font-semibold">{countdownLabel}</span>
                      <span className="text-[#57534E]">{apt.startTime} hrs</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#161513] truncate">{apt.title}</p>
                    <p className="text-[11px] text-[#57534E] truncate">
                      {apt.clientName} · {apt.advisorName || 'Sin asesora'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E6E2E8]">
                    <button
                      type="button"
                      onClick={() => downloadAppointmentIcs(apt)}
                      className="text-[11px] font-semibold text-[#892B84] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Agregar al móvil (.ics)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(apt)}
                      className="text-[11px] text-[#57534E] hover:text-[#161513] cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Grid + Day Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Monthly Calendar */}
        <div className="lg:col-span-7 bg-white border border-[#E6E2E8]">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[#E6E2E8] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#892B84]" />
              <h3 className="font-sans text-sm font-semibold text-[#161513] capitalize">
                {monthLabel}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                  setSelectedDate(todayIso);
                  setListMode('day');
                }}
                className="px-2.5 py-1 border border-[#E6E2E8] text-xs font-medium text-[#161513] hover:border-[#892B84] cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => {
                  const prev = new Date(viewYear, viewMonth - 1, 1);
                  setViewYear(prev.getFullYear());
                  setViewMonth(prev.getMonth());
                }}
                className="p-1.5 border border-[#E6E2E8] text-[#57534E] hover:text-[#161513] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => {
                  const next = new Date(viewYear, viewMonth + 1, 1);
                  setViewYear(next.getFullYear());
                  setViewMonth(next.getMonth());
                }}
                className="p-1.5 border border-[#E6E2E8] text-[#57534E] hover:text-[#161513] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-[#E6E2E8] bg-[#F9F8FA] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#57534E] text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-[#E6E2E8]">
            {calendarDays.map((cell) => {
              const dayEvents = (appointmentsByDate.get(cell.iso) ?? []).filter(
                (a) => a.status !== 'Cancelada'
              );
              const isSelected = selectedDate === cell.iso && listMode === 'day';
              const isToday = cell.iso === todayIso;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell.iso);
                    setListMode('day');
                  }}
                  className={`min-h-[76px] sm:min-h-[88px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#F9F5F9] ring-1 ring-inset ring-[#892B84]'
                      : cell.inMonth
                      ? 'bg-white hover:bg-[#F9F8FA]'
                      : 'bg-[#F9F8FA]/60 text-[#A8A29E]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isToday
                          ? 'px-1.5 py-0.5 bg-[#892B84] text-white font-semibold'
                          : cell.inMonth
                          ? 'text-[#161513] font-medium'
                          : 'text-[#A8A29E]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="font-mono text-[10px] text-[#892B84] font-semibold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`px-1 py-0.5 text-[10px] truncate border-l-2 ${
                          ev.status === 'Confirmada'
                            ? 'bg-[#F0FDF4] border-[#16A34A] text-[#15803D]'
                            : 'bg-[#F9F5F9] border-[#892B84] text-[#161513]'
                        }`}
                      >
                        {ev.startTime} {ev.clientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] text-[#57534E] font-mono">
                        +{dayEvents.length - 2} más
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Day Schedule or All Upcoming List */}
        <div className="lg:col-span-5 bg-white border border-[#E6E2E8]">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[#E6E2E8] flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex border border-[#E6E2E8] bg-[#F9F8FA] p-0.5">
              <button
                type="button"
                onClick={() => setListMode('upcoming')}
                className={`px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  listMode === 'upcoming' ? 'bg-[#892B84] text-white' : 'text-[#57534E]'
                }`}
              >
                Todas ({appointments.length})
              </button>
              <button
                type="button"
                onClick={() => setListMode('day')}
                className={`px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  listMode === 'day' ? 'bg-[#892B84] text-white' : 'text-[#57534E]'
                }`}
              >
                Día ({formatReadableDate(selectedDate)})
              </button>
            </div>

            <button
              type="button"
              onClick={() => openNewModal(selectedDate)}
              className="text-xs font-semibold text-[#892B84] hover:underline cursor-pointer"
            >
              + Agendar aquí
            </button>
          </div>

          <div className="divide-y divide-[#E6E2E8] max-h-[620px] overflow-y-auto">
            {displayedAppointments.length > 0 ? (
              displayedAppointments.map((apt) => (
                <div key={apt.id} className="p-4 sm:p-5 space-y-3 hover:bg-[#F9F8FA]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono text-[#892B84] font-semibold">
                        <span>{formatReadableDate(apt.date)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.startTime} ({apt.durationMinutes} min)
                        </span>
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-[#161513]">{apt.title}</h4>
                      <p className="text-xs text-[#57534E] mt-0.5">
                        Cliente: <span className="text-[#161513] font-medium">{apt.clientName}</span>
                        {apt.advisorName ? ` · Asesora: ${apt.advisorName}` : ''}
                      </p>
                      {apt.location && (
                        <p className="text-xs text-[#57534E] mt-0.5 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0 text-[#892B84]" />
                          <span>{apt.location}</span>
                        </p>
                      )}
                    </div>

                    <select
                      aria-label={`Estatus de ${apt.title}`}
                      value={apt.status}
                      onChange={(e) =>
                        onSaveAppointment({
                          ...apt,
                          status: e.target.value as AppointmentStatus,
                        })
                      }
                      className="px-2 py-1 text-[11px] border border-[#E6E2E8] bg-white text-[#161513] focus:outline-none focus:border-[#892B84]"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-[#44403C] bg-[#F9F8FA] border border-[#E6E2E8] p-2.5 leading-relaxed">
                      {apt.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadAppointmentIcs(apt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-[#892B84]/40 bg-[#F9F5F9] text-[11px] font-semibold text-[#892B84] hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Guardar en móvil (.ics)</span>
                      </button>

                      {apt.clientPhone && (
                        <a
                          href={`tel:${apt.clientPhone.replace(/[^+\d]/g, '')}`}
                          className="p-1.5 border border-[#E6E2E8] text-[#57534E] hover:text-[#892B84]"
                          title={`Llamar a ${apt.clientPhone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {apt.clientEmail && (
                        <a
                          href={`mailto:${apt.clientEmail}`}
                          className="p-1.5 border border-[#E6E2E8] text-[#57534E] hover:text-[#892B84]"
                          title={`Correo a ${apt.clientEmail}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {confirmDeleteId === apt.id ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteAppointment(apt.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 bg-[#DC2626] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 border border-[#E6E2E8] text-[11px] cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(apt)}
                          aria-label="Editar visita"
                          className="p-1.5 border border-[#E6E2E8] text-[#57534E] hover:text-[#892B84] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(apt.id)}
                          aria-label="Eliminar visita"
                          className="p-1.5 border border-[#E6E2E8] text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm text-[#57534E]">
                  No hay visitas registradas para {listMode === 'day' ? formatReadableDate(selectedDate) : 'este periodo'}.
                </p>
                <button
                  type="button"
                  onClick={() => openNewModal(selectedDate)}
                  className="px-3.5 py-2 bg-[#892B84] text-white text-xs font-semibold cursor-pointer"
                >
                  Programar visita
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Appointment Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161513]/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white border border-[#E6E2E8] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E6E2E8] flex items-center justify-between">
              <h3 className="font-sans text-base font-semibold text-[#161513]">
                {editingId ? 'Editar visita programada' : 'Programar nueva visita'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar formulario de visita"
                className="w-8 h-8 inline-flex items-center justify-center border border-[#E6E2E8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Inmueble relacionado (opcional)
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => handlePropertySelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                >
                  <option value="">Visita general o sin inmueble específico</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.folio} · {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#57534E] mb-1">Título de la cita</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Recorrido · Residencia Juriquilla"
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Nombre del cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+52 442 000 0000"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Hora</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Duración</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1.5 horas</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Recordatorio</label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  >
                    <option value={15}>15 min antes</option>
                    <option value={30}>30 min antes</option>
                    <option value={60}>1 hora antes</option>
                    <option value={120}>2 horas antes</option>
                    <option value={1440}>1 día antes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Asesora asignada</label>
                  <select
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  >
                    <option value="">Sin asignar</option>
                    {advisors.map((adv) => (
                      <option key={adv.id} value={adv.name}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Estatus</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Ubicación / Punto</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Colonia, dirección o caseta"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#57534E] mb-1">Notas de la visita</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Indicaciones de acceso, documentos a llevar, comentarios..."
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>

              {formError && <p className="text-xs text-[#DC2626]">{formError}</p>}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6E2E8]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#E6E2E8] text-xs font-medium text-[#57534E] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar en agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
