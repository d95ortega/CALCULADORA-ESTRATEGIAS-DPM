import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Bell, AlertTriangle, 
  Check, Package, FileText, User, Edit2, X, AlertCircle
} from 'lucide-react';
import { Order, QuoteHistoryEntry, OrderStatus, QuoteStatus } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarViewProps {
  orders: Order[];
  quotes: QuoteHistoryEntry[];
  updateOrderDeliveryDate: (id: string, date: string) => Promise<void>;
  updateQuoteDeliveryDate: (id: string, date: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateQuoteStatus: (id: string, status: QuoteStatus) => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  orders,
  quotes,
  updateOrderDeliveryDate,
  updateQuoteDeliveryDate,
  updateOrderStatus,
  updateQuoteStatus
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Months name array in Spanish
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // All relevant accepted/active jobs to display in calendar
  // We include: 
  // 1. All Orders (which represent accepted & paid/approved quotes in production)
  // 2. Approved quotes (APROBADA or PAGADA) that don't have orders yet
  const calendarJobs = useMemo(() => {
    const jobsList: Array<{
      id: string;
      title: string;
      customerName: string;
      customerPhone: string;
      total: number;
      status: string;
      type: 'order' | 'quote';
      createdAt: string; // ISO or local string
      deliveryDate?: string; // YYYY-MM-DD
      acceptedDate?: string;
      itemsCount: number;
      originalStatus: OrderStatus | QuoteStatus;
    }> = [];

    // Add orders
    if (orders && Array.isArray(orders)) {
      orders.forEach(o => {
        // Extract date from createdAt (e.g., "2026-06-25T...")
        const createdDateStr = o.createdAt ? o.createdAt.split('T')[0] : '';
        
        jobsList.push({
          id: o.id,
          title: `Pedido ${o.id}`,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          total: o.total,
          status: o.status,
          type: 'order',
          createdAt: createdDateStr,
          deliveryDate: o.deliveryDate || '',
          acceptedDate: createdDateStr,
          itemsCount: o.items?.length || 0,
          originalStatus: o.status
        });
      });
    }

    // Add accepted quotes that don't have orders
    if (quotes && Array.isArray(quotes)) {
      quotes.forEach(q => {
        if (q && (q.status === 'APROBADA' || q.status === 'PAGADA') && !q.orderId) {
          const createdDateStr = q.date ? q.date.split('T')[0] : '';
          jobsList.push({
            id: q.id,
            title: `Cotización ${q.id.substring(0, 8)}...`,
            customerName: q.customerName,
            customerPhone: q.customerPhone,
            total: q.total,
            status: q.status,
            type: 'quote',
            createdAt: createdDateStr,
            deliveryDate: q.deliveryDate || '',
            acceptedDate: createdDateStr,
            itemsCount: q.items?.length || 0,
            originalStatus: q.status
          });
        }
      });
    }

    return jobsList;
  }, [orders, quotes]);

  // Notifications and Alerts analysis
  const notifications = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const overdue: typeof calendarJobs = [];
    const dueToday: typeof calendarJobs = [];
    const dueTomorrow: typeof calendarJobs = [];

    calendarJobs.forEach(job => {
      // Skip completed / finalized ones
      if (job.type === 'order' && ['ENTREGADO', 'RECIBIDO', 'ENVIADO'].includes(job.status)) return;
      if (job.type === 'quote' && job.status === 'RECHAZADA') return;

      if (job.deliveryDate) {
        if (job.deliveryDate < todayStr) {
          overdue.push(job);
        } else if (job.deliveryDate === todayStr) {
          dueToday.push(job);
        } else if (job.deliveryDate === tomorrowStr) {
          dueTomorrow.push(job);
        }
      }
    });

    return { overdue, dueToday, dueTomorrow };
  }, [calendarJobs]);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    // Get first day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Day of week of the first day (0 is Sun, 1 is Mon, etc.)
    let startDayOfWeek = firstDayOfMonth.getDay();
    // Adjust for Monday start (0=Sun -> 6, 1=Mon -> 0, etc.)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Get total days in the month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Previous month details for filling grid
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: typeof calendarJobs;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Add padding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      
      const dayEvents = calendarJobs.filter(
        job => job.deliveryDate === dateStr || job.acceptedDate === dateStr
      );

      days.push({
        date,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: dayEvents
      });
    }

    // Add days of current month
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const date = new Date(currentYear, currentMonth, dayNum);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      
      const dayEvents = calendarJobs.filter(
        job => job.deliveryDate === dateStr || job.acceptedDate === dateStr
      );

      days.push({
        date,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: dayEvents
      });
    }

    // Fill remaining grid slots to complete full weeks (usually 42 grid items)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const dayEvents = calendarJobs.filter(
        job => job.deliveryDate === dateStr || job.acceptedDate === dateStr
      );

      days.push({
        date,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: dayEvents
      });
    }

    return days;
  }, [currentYear, currentMonth, calendarJobs]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDateStr) return [];
    return calendarJobs.filter(
      job => job.deliveryDate === selectedDateStr || job.acceptedDate === selectedDateStr
    );
  }, [selectedDateStr, calendarJobs]);

  // Update a job's delivery date
  const handleUpdateDeliveryDate = async (jobId: string, type: 'order' | 'quote', date: string) => {
    if (!date) return;
    try {
      if (type === 'order') {
        await updateOrderDeliveryDate(jobId, date);
      } else {
        await updateQuoteDeliveryDate(jobId, date);
      }
      setEditingJobId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Calendario de Producción</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Planificación y control de entregas</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleGoToToday}
            className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-slate-700 shadow-sm"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* NOTIFICATION PANELS */}
      {(notifications.overdue.length > 0 || notifications.dueToday.length > 0 || notifications.dueTomorrow.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* OVERDUE ALERTS */}
          {notifications.overdue.length > 0 && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl flex gap-3 shadow-sm">
              <div className="p-2 bg-rose-500 text-white rounded-2xl h-10 w-10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Trabajos Vencidos ({notifications.overdue.length})</h4>
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                  {notifications.overdue.map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => {
                        setSelectedDateStr(job.deliveryDate || '');
                        if (job.deliveryDate) {
                          const [y, m, d] = job.deliveryDate.split('-').map(Number);
                          setCurrentDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="text-[10px] font-bold text-rose-800 flex justify-between items-center bg-white/60 hover:bg-white p-1.5 rounded-lg cursor-pointer transition-all"
                    >
                      <span className="truncate flex-1 font-black">{job.title} • {job.customerName}</span>
                      <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-black">{job.deliveryDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TODAY ALERTS */}
          {notifications.dueToday.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex gap-3 shadow-sm">
              <div className="p-2 bg-amber-500 text-white rounded-2xl h-10 w-10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Entrega Hoy ({notifications.dueToday.length})</h4>
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                  {notifications.dueToday.map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => {
                        setSelectedDateStr(job.deliveryDate || '');
                        if (job.deliveryDate) {
                          const [y, m, d] = job.deliveryDate.split('-').map(Number);
                          setCurrentDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="text-[10px] font-bold text-amber-800 flex justify-between items-center bg-white/60 hover:bg-white p-1.5 rounded-lg cursor-pointer transition-all"
                    >
                      <span className="truncate flex-1 font-black">{job.title} • {job.customerName}</span>
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-black">HOY</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TOMORROW ALERTS */}
          {notifications.dueTomorrow.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex gap-3 shadow-sm">
              <div className="p-2 bg-indigo-500 text-white rounded-2xl h-10 w-10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Entrega Mañana ({notifications.dueTomorrow.length})</h4>
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                  {notifications.dueTomorrow.map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => {
                        setSelectedDateStr(job.deliveryDate || '');
                        if (job.deliveryDate) {
                          const [y, m, d] = job.deliveryDate.split('-').map(Number);
                          setCurrentDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="text-[10px] font-bold text-indigo-800 flex justify-between items-center bg-white/60 hover:bg-white p-1.5 rounded-lg cursor-pointer transition-all"
                    >
                      <span className="truncate flex-1 font-black">{job.title} • {job.customerName}</span>
                      <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-black">MAÑANA</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* CALENDAR BODY AND SIDE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MONTHLY CALENDAR GRID */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          
          {/* MONTH NAVIGATOR */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">
              {months[currentMonth]} <span className="text-slate-300 font-normal">{currentYear}</span>
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 active:scale-95 transition-all text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 active:scale-95 transition-all text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DAYS OF WEEK HEADERS */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-[9px] font-black uppercase text-slate-400 tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          {/* CALENDAR GRID */}
          <div className="grid grid-cols-7 gap-1.5 flex-1">
            {calendarDays.map((cell, idx) => {
              const isSelected = selectedDateStr === cell.dateStr;
              
              // Count delivery vs arrivals
              const deliveryEvents = cell.events.filter(e => e.deliveryDate === cell.dateStr);
              const arrivalEvents = cell.events.filter(e => e.acceptedDate === cell.dateStr);

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[85px] p-2 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 relative ${
                    !cell.isCurrentMonth ? 'bg-slate-50/50 border-slate-50 text-slate-300' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50/30'
                  } ${
                    cell.isToday ? 'ring-2 ring-red-500/10 border-red-200' : ''
                  } ${
                    isSelected ? 'ring-2 ring-red-500 border-red-500 shadow-md shadow-red-500/5' : ''
                  }`}
                >
                  {/* Date number */}
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-black ${
                      cell.isToday ? 'text-red-500 bg-red-50 px-1.5 py-0.5 rounded-lg' : ''
                    } ${
                      isSelected && !cell.isToday ? 'text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-lg' : ''
                    }`}>
                      {cell.date.getDate()}
                    </span>
                    
                    {cell.events.length > 0 && (
                      <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-full leading-none">
                        {cell.events.length}
                      </span>
                    )}
                  </div>

                  {/* Micro Events list */}
                  <div className="space-y-1 overflow-y-auto no-scrollbar max-h-12 mt-1.5">
                    {arrivalEvents.map(e => (
                      <div 
                        key={`${e.id}-arr`} 
                        className="text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded truncate leading-none flex items-center gap-0.5 border border-emerald-100/30"
                        title={`Llegada: ${e.title}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                        <span>{e.id.split('-').pop()} (Llegada)</span>
                      </div>
                    ))}
                    {deliveryEvents.map(e => {
                      const isOverdue = cell.dateStr < new Date().toISOString().split('T')[0] && !['ENTREGADO', 'RECIBIDO', 'ENVIADO'].includes(e.status);
                      return (
                        <div 
                          key={`${e.id}-del`} 
                          className={`text-[7px] font-bold px-1 py-0.5 rounded truncate leading-none flex items-center gap-0.5 border ${
                            isOverdue 
                              ? 'text-rose-700 bg-rose-50 border-rose-100/30' 
                              : 'text-blue-700 bg-blue-50 border-blue-100/30'
                          }`}
                          title={`Entrega: ${e.title}`}
                        >
                          <span className={`w-1 h-1 rounded-full shrink-0 ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`} />
                          <span>{e.id.split('-').pop()} (Entrega)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LEGEND */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 justify-end text-[9px] font-black uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 shrink-0" />
              <span>Trabajo Recibido / Aceptado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-blue-500 shrink-0" />
              <span>Fecha de Entrega Programada</span>
            </div>
          </div>

        </div>

        {/* SIDE DETAIL PANEL */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 flex flex-col min-h-[400px]">
            <div className="border-b border-slate-100 pb-4 mb-4 shrink-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Detalles del Día</h3>
              <p className="text-base font-black text-slate-800 italic mt-0.5">
                {selectedDateStr ? new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                }) : 'Selecciona un día'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {selectedDateEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <CalendarIcon className="w-12 h-12 text-slate-200 stroke-[1.5] mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">No hay tareas programadas para este día</p>
                </div>
              ) : (
                selectedDateEvents.map(job => {
                  const isArrival = job.acceptedDate === selectedDateStr;
                  const isDelivery = job.deliveryDate === selectedDateStr;
                  const isEditing = editingJobId === job.id;

                  return (
                    <div 
                      key={job.id} 
                      className={`p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col gap-3 group ${
                        isArrival && !isDelivery ? 'bg-emerald-50/30 border-emerald-100' :
                        !isArrival && isDelivery ? 'bg-blue-50/20 border-blue-100' :
                        'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      {/* Accent highlight bar */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                        isArrival && !isDelivery ? 'bg-emerald-500' :
                        !isArrival && isDelivery ? 'bg-blue-500' :
                        'bg-slate-500'
                      }`} />

                      <div className="flex justify-between items-start gap-2 pl-2">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {job.type === 'order' ? 'Pedido' : 'Cotización'}
                          </span>
                          <h4 className="text-sm font-black text-slate-800 italic uppercase tracking-tight mt-0.5">
                            {job.id}
                          </h4>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-slate-900 italic">
                            ${Math.round(job.total).toLocaleString()}
                          </span>
                          <span className="text-[8px] bg-white px-2 py-0.5 rounded-full border border-slate-100 font-black uppercase text-slate-500 tracking-wider mt-1">
                            {job.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-600 font-bold uppercase pl-2">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{job.customerName}</span>
                        </div>
                        {job.customerPhone && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{job.customerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.itemsCount} productos / servicios</span>
                        </div>
                      </div>

                      {/* Dates displays & Action forms */}
                      <div className="pt-3 border-t border-dashed border-slate-200 pl-2">
                        <div className="flex flex-col gap-2.5">
                          {/* Arrival Date */}
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                            <span className="text-slate-400">Fecha Llegada / Aceptación</span>
                            <span className="text-emerald-600 font-black">{job.acceptedDate || job.createdAt}</span>
                          </div>

                          {/* Delivery Date Display & Edit */}
                          {isEditing ? (
                            <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                              <label className="text-[8px] font-black uppercase tracking-wider text-slate-500">Programar Entrega</label>
                              <div className="flex gap-1.5">
                                <input 
                                  type="date" 
                                  value={newDeliveryDate}
                                  onChange={(e) => setNewDeliveryDate(e.target.value)}
                                  className="flex-1 bg-white p-2 rounded-xl border border-slate-200 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                                />
                                <button 
                                  onClick={() => handleUpdateDeliveryDate(job.id, job.type, newDeliveryDate)}
                                  className="p-2 bg-emerald-500 text-white rounded-xl active:scale-95 transition-all hover:bg-emerald-600"
                                  title="Confirmar"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setEditingJobId(null)}
                                  className="p-2 bg-slate-200 text-slate-600 rounded-xl active:scale-95 transition-all hover:bg-slate-300"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                              <span className="text-slate-400">Fecha Límite Entrega</span>
                              <div className="flex items-center gap-1.5">
                                <span className={job.deliveryDate ? "text-blue-600 font-black" : "text-amber-500 italic font-black"}>
                                  {job.deliveryDate || 'Sin Programar'}
                                </span>
                                <button 
                                  onClick={() => {
                                    setEditingJobId(job.id);
                                    setNewDeliveryDate(job.deliveryDate || '');
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-all"
                                  title="Editar Fecha de Entrega"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Status Select */}
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider pt-1.5">
                            <span className="text-slate-400">Cambiar Estado</span>
                            {job.type === 'order' ? (
                              <select 
                                value={job.status}
                                onChange={(e) => updateOrderStatus(job.id, e.target.value as OrderStatus)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-[8px] font-black"
                              >
                                <option value="NUEVA">NUEVA</option>
                                <option value="PRODUCCION">PRODUCCIÓN</option>
                                <option value="TERMINADO">TERMINADO</option>
                                <option value="ENTREGADO">ENTREGADO</option>
                                <option value="RECIBIDO">RECIBIDO</option>
                                <option value="ENVIADO">ENVIADO</option>
                              </select>
                            ) : (
                              <select 
                                value={job.status}
                                onChange={(e) => updateQuoteStatus(job.id, e.target.value as QuoteStatus)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-[8px] font-black"
                              >
                                <option value="PENDIENTE">PENDIENTE</option>
                                <option value="ENVIADA">ENVIADA</option>
                                <option value="APROBADA">APROBADA</option>
                                <option value="PAGADA">PAGADA</option>
                                <option value="RECHAZADA">RECHAZADA</option>
                              </select>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CalendarView;
