import { useState, useEffect } from 'react'
import { 
  CarFront, QrCode, CheckCircle2, XCircle, Clock, MapPin, 
  Camera, AlertTriangle, RefreshCw, CreditCard, History, X, ShieldAlert
} from 'lucide-react'
import { 
  getUsers, saveUsers, getSavedVehicles, saveVehicle, 
  getActiveTickets, saveActiveTicket, getHistory, addHistoryEntry 
} from './store'
import QrScanner from './QrScanner'

export default function Valet({ session, onUpdateSession }) {
  const [users, setUsers] = useState(getUsers())
  const [vehicles, setVehicles] = useState(getSavedVehicles())
  const [tickets, setTickets] = useState(getActiveTickets())
  const [historyList, setHistoryList] = useState(getHistory())

  // Sincronización continua
  useEffect(() => {
    const sync = () => {
      setUsers(getUsers())
      setVehicles(getSavedVehicles())
      setTickets(getActiveTickets())
      setHistoryList(getHistory())
    }
    const interval = setInterval(sync, 1000)
    window.addEventListener('storage', sync)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const currentStudentUser = users.find(u => u.user === session.user) || session

  if (session.role === 'student') {
    return (
      <StudentValetView 
        session={currentStudentUser} 
        vehicle={vehicles[session.user]} 
        activeTicket={tickets[session.user]}
        historyList={historyList.filter(h => h.userKey === session.user)}
        onSaveVehicle={(v) => {
          saveVehicle(session.user, v)
          setVehicles(getSavedVehicles())
        }}
        onRequestReturn={() => {
          const t = tickets[session.user]
          if (t) {
            t.status = 'REQUESTED'
            saveActiveTicket(session.user, t)
            setTickets(getActiveTickets())
          }
        }}
        onCancelService={() => {
          const t = tickets[session.user]
          if (t) {
            addHistoryEntry({
              id: 'HIS-' + Math.floor(1000 + Math.random() * 9000),
              userKey: session.user,
              studentName: session.name,
              vehicle: `${vehicles[session.user]?.brand || 'Auto'} (${vehicles[session.user]?.plate || 'S/P'})`,
              spot: t.spot,
              checkInTime: t.checkInTime,
              checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'Cancelado por Estudiante'
            })
            saveActiveTicket(session.user, null)
            setTickets(getActiveTickets())
          }
        }}
        onPayMembership={() => {
          const updatedUsers = users.map(u => u.user === session.user ? { ...u, status: 'active' } : u)
          saveUsers(updatedUsers)
          setUsers(updatedUsers)
          if (onUpdateSession) onUpdateSession({ ...session, status: 'active' })
        }}
      />
    )
  }

  return (
    <ValetEmployeeView 
      session={session} 
      users={users}
      vehicles={vehicles}
      tickets={tickets}
      historyList={historyList}
      onUpdateTicket={(userKey, newTicket) => {
        saveActiveTicket(userKey, newTicket)
        setTickets(getActiveTickets())
      }}
    />
  )
}

// -------------------------------------------------------------
// VISTA DEL ESTUDIANTE
// -------------------------------------------------------------
function StudentValetView({ session, vehicle, activeTicket, historyList, onSaveVehicle, onRequestReturn, onCancelService, onPayMembership }) {
  const [editing, setEditing] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [form, setForm] = useState(vehicle || { brand: '', model: '', plate: '', color: '', photo: '' })

  const isInactive = session.status === 'inactive'

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setForm(prev => ({ ...prev, photo: reader.result }))
      reader.readAsDataURL(file)
    }
  }

  const handlePay = () => {
    onPayMembership()
    setShowPayModal(false)
  }

  return (
    <div className="space-y-6">

      {/* Alerta y Botón de Pago si está Vencida */}
      {isInactive && (
        <div className="rounded-2xl bg-red-500/20 p-5 text-red-200 border border-red-500/40 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6 text-red-400 flex-shrink-0" />
            <p className="text-sm font-semibold">
              Tu membresía de estacionamiento está <strong>Vencida o Inactiva</strong>. El Valet no podrá recibir tu automóvil.
            </p>
          </div>
          <button
            onClick={() => setShowPayModal(true)}
            className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 font-extrabold text-white text-xs shadow flex items-center justify-center gap-2"
          >
            <CreditCard className="size-4" /> Pagar / Renovar Membresía ($150 MXN)
          </button>
        </div>
      )}

      {/* Carnet QR */}
      <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Código QR de Acceso</h2>
            <p className="text-xs font-semibold text-white/60">Escanear para recibir o entregar vehículo</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isInactive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {isInactive ? 'Membresía Vencida' : 'Membresía Activa'}
          </span>
        </div>
        <img
          src={`/${session.user}-qr.png`}
          alt={`Código QR de ${session.name}`}
          className="mx-auto block size-44 object-contain"
        />
      </div>

      {/* Estado del Servicio */}
      <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5">
        <h2 className="mb-4 text-lg font-extrabold text-white flex items-center gap-2">
          <Clock className="size-5 text-cesba" /> Estado de tu Servicio
        </h2>

        {!activeTicket && (
          <div className="rounded-xl bg-navy/60 p-5 text-center border border-white/5">
            <CarFront className="mx-auto mb-2 size-10 text-white/40" />
            <p className="font-bold text-white/90">Sin vehículo en resguardo</p>
            <p className="mt-1 text-xs font-medium text-white/60">Presenta tu QR en caseta para iniciar el servicio.</p>
          </div>
        )}

        {activeTicket && activeTicket.status === 'PARKED' && (
          <div className="rounded-xl bg-navy/80 p-5 border border-green-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-md bg-green-500/20 px-2.5 py-1 text-xs font-bold text-green-400">
                <CheckCircle2 className="size-4" /> Vehículo Recibido en Estacionamiento
              </span>
              <span className="font-mono text-xs font-bold text-white/70">Ticket: {activeTicket.ticketId}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/10 text-sm">
              <div>
                <p className="text-xs text-white/60 font-semibold">Cajón Asignado:</p>
                <p className="text-xl font-black text-cesba">{activeTicket.spot}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 font-semibold">Hora de Entrada:</p>
                <p className="font-bold text-white">{activeTicket.checkInTime}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onCancelService}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 font-bold text-xs text-red-300"
              >
                Cancelar Servicio
              </button>
              <button
                onClick={onRequestReturn}
                className="flex-2 rounded-xl bg-cesba py-3 font-extrabold text-white shadow-lg active:scale-[.98] transition-all flex items-center justify-center gap-2"
              >
                <CarFront className="size-5" />
                Solicitar mi vehículo
              </button>
            </div>
          </div>
        )}

        {activeTicket && activeTicket.status === 'REQUESTED' && (
          <div className="rounded-xl bg-navy/80 p-5 border border-amber-500/40 text-center space-y-4">
            <div className="inline-block rounded-full bg-amber-500/20 p-3 text-amber-400 animate-pulse">
              <Clock className="size-8" />
            </div>
            <h3 className="text-base font-extrabold text-amber-400">Solicitud Recibida</h3>
            <p className="text-xs font-semibold text-white/80">
              Traeremos tu auto del espacio <strong className="text-white">{activeTicket.spot}</strong>. Por favor, muestra tu QR al personal de caseta para que confirmen la entrega.
            </p>

            <button
              onClick={onCancelService}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 font-bold text-xs text-red-300"
            >
              Cancelar Solicitud de Devolución
            </button>
          </div>
        )}
      </div>

      {/* Registro de Vehículo */}
      <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <CarFront className="size-5 text-cesba" /> Vehículo Registrado
          </h2>
          <button onClick={() => setEditing(!editing)} className="text-xs font-bold text-cesba hover:underline">
            {editing ? 'Cancelar' : vehicle ? 'Editar Datos' : '+ Registrar Auto'}
          </button>
        </div>

        {!editing ? (
          vehicle ? (
            <div className="space-y-4">
              {vehicle.photo && (
                <img src={vehicle.photo} alt="Auto" className="h-40 w-full rounded-xl object-cover border border-white/10" />
              )}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-navy/60 p-4 text-xs font-semibold">
                <div>
                  <p className="text-white/60">Marca / Modelo:</p>
                  <p className="text-sm font-bold text-white">{vehicle.brand} {vehicle.model}</p>
                </div>
                <div>
                  <p className="text-white/60">Placas:</p>
                  <p className="text-sm font-extrabold text-cesba font-mono">{vehicle.plate}</p>
                </div>
                <div>
                  <p className="text-white/60">Color:</p>
                  <p className="font-bold text-white">{vehicle.color}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-xs font-semibold text-white/60">No has registrado tu vehículo.</p>
          )
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSaveVehicle(form); setEditing(false) }} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">Marca</label>
              <input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded-xl bg-navy px-4 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">Modelo / Año</label>
              <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full rounded-xl bg-navy px-4 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">Placas</label>
              <input required value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} className="w-full rounded-xl bg-navy px-4 py-2 text-xs text-cesba font-mono uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">Color</label>
              <input required value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full rounded-xl bg-navy px-4 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">Fotografía del Auto</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full rounded-xl bg-navy p-2 text-xs text-white/70" />
            </div>
            <button type="submit" className="w-full rounded-xl bg-cesba py-3 font-extrabold text-white shadow">Guardar Cambios</button>
          </form>
        )}
      </div>

      {/* Historial personal */}
      <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5">
        <h2 className="mb-4 text-lg font-extrabold text-white flex items-center gap-2">
          <History className="size-5 text-cesba" /> Historial de Servicios
        </h2>
        {historyList.length === 0 ? (
          <p className="text-xs text-white/60 text-center py-3">No tienes registros previos de valet.</p>
        ) : (
          <div className="space-y-2">
            {historyList.map(h => (
              <div key={h.id} className="rounded-xl bg-navy/60 p-3 text-xs space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>Espacio {h.spot} ({h.vehicle})</span>
                  <span className={h.status.includes('Cancelado') ? 'text-red-400' : 'text-green-400'}>{h.status}</span>
                </div>
                <p className="text-white/60">Entrada: {h.checkInTime} | Salida: {h.checkOutTime}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Pago Simulado */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-panel p-6 border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-lg text-white">Renovar Membresía</h3>
              <button onClick={() => setShowPayModal(false)}><X className="text-white/60" /></button>
            </div>
            <p className="text-xs text-white/80">Costo mensual de estacionamiento universitario: <strong>$150.00 MXN</strong></p>
            <div className="rounded-xl bg-navy p-4 space-y-2 text-xs">
              <input placeholder="Número de Tarjeta (Simulado)" className="w-full bg-panel p-2.5 rounded-lg text-white outline-none" defaultValue="4555 •••• •••• 9921" />
              <div className="flex gap-2">
                <input placeholder="MM/AA" className="w-1/2 bg-panel p-2.5 rounded-lg text-white outline-none" defaultValue="12/28" />
                <input placeholder="CVC" className="w-1/2 bg-panel p-2.5 rounded-lg text-white outline-none" defaultValue="882" />
              </div>
            </div>
            <button onClick={handlePay} className="w-full rounded-xl bg-green-600 py-3 font-extrabold text-white shadow">
              Pagar $150.00 MXN y Activar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// -------------------------------------------------------------
// VISTA EMPLEADO DE VALET
// -------------------------------------------------------------
function ValetEmployeeView({ session, users, vehicles, tickets, historyList, onUpdateTicket }) {
  const [step, setStep] = useState('SCAN') // SCAN, VERIFY, CONFIRM, MANAGEMENT, DELIVER_SCAN
  const [selectedUser, setSelectedUser] = useState(null)
  const [assignedSpot, setAssignedSpot] = useState('A-14')
  const [scanError, setScanError] = useState('')
  const [deliverTarget, setDeliverTarget] = useState(null) // usuario dueño del auto que se va a entregar
  const [manualCode, setManualCode] = useState('')

  useEffect(() => { setScanError('') }, [step])

  // Recibe el texto leído del QR (la matrícula del alumno) o capturado a mano
  const handleScanText = (raw) => {
    const code = String(raw).trim().toUpperCase()
    const target = users.find(u => u.role === 'student' && u.matricula.toUpperCase() === code)
    if (!target) { setScanError(`QR no reconocido: "${String(raw).slice(0, 30)}"`); return }

    if (step === 'DELIVER_SCAN') {
      if (target.user !== deliverTarget) { setScanError(`Este QR es de ${target.name}, no del dueño de este vehículo.`); return }
      const t = tickets[target.user]
      if (!t) { setScanError('Este estudiante no tiene vehículo en resguardo.'); return }
      addHistoryEntry({
        id: 'HIS-' + Math.floor(1000 + Math.random() * 9000),
        userKey: target.user,
        studentName: target.name,
        vehicle: `${vehicles[target.user]?.brand || 'Auto'} (${vehicles[target.user]?.plate || 'S/P'})`,
        spot: t.spot,
        checkInTime: t.checkInTime,
        checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Entregado'
      })
      onUpdateTicket(target.user, null)
      setDeliverTarget(null); setManualCode(''); setStep('MANAGEMENT')
      return
    }

    // Recepción
    if (tickets[target.user]) { setScanError(`${target.name} ya tiene un vehículo en resguardo.`); return }
    setSelectedUser(target); setManualCode(''); setStep('VERIFY')
  }

  // Recepción e inicio de ticket
  const handleConfirmReception = () => {
    if (!selectedUser) return
    const newTicket = {
      ticketId: 'TK-' + Math.floor(1000 + Math.random() * 9000),
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      spot: assignedSpot || 'A-01',
      status: 'PARKED',
      valetName: session.name
    }
    onUpdateTicket(selectedUser.user, newTicket)
    setStep('MANAGEMENT')
  }

  // Filtrar autos pendientes de recibir (Excluye los ya estacionados)
  const unparkedStudents = users.filter(u => u.role === 'student' && !tickets[u.user])

  // Lista de vehículos estacionados o solicitados
  const activeParkedList = Object.keys(tickets).map(uKey => ({
    user: users.find(u => u.user === uKey),
    vehicle: vehicles[uKey],
    ticket: tickets[uKey]
  })).filter(item => item.ticket)

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex rounded-xl bg-panel p-1.5 border border-white/10 text-xs font-extrabold">
        <button
          onClick={() => setStep('SCAN')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${
            step !== 'MANAGEMENT' && step !== 'DELIVER_SCAN' ? 'bg-cesba text-white shadow' : 'text-white/60 hover:text-white'
          }`}
        >
          1. Recibir Vehículo
        </button>
        <button
          onClick={() => setStep('MANAGEMENT')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${
            step === 'MANAGEMENT' || step === 'DELIVER_SCAN' ? 'bg-cesba text-white shadow' : 'text-white/60 hover:text-white'
          }`}
        >
          2. Entregas y Resguardo ({activeParkedList.length})
        </button>
      </div>

      {/* PASO 1: ESCANEAR QR CON CÁMARA */}
      {step === 'SCAN' && (
        <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5 space-y-4">
          <h2 className="text-lg font-extrabold text-white">Escanear Membresía de Estudiante</h2>

          <QrScanner onScan={handleScanText} />

          {scanError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/20 p-3 text-xs font-bold text-red-200">
              <AlertTriangle className="size-4 shrink-0" /> {scanError}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) handleScanText(manualCode) }}
            className="flex gap-2"
          >
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="¿Sin cámara? Escribe la matrícula"
              className="flex-1 rounded-xl bg-navy px-4 py-2.5 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-cesba"
            />
            <button type="submit" className="rounded-xl bg-cesba px-4 text-xs font-extrabold text-white">Buscar</button>
          </form>
        </div>
      )}

      {/* PASO 2: VERIFICACIÓN Y BLOQUEO DE MEMBRESÍA */}
      {step === 'VERIFY' && selectedUser && (
        <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-extrabold text-white">Verificación de Membresía</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              selectedUser.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {selectedUser.status === 'active' ? 'VÁLIDA' : 'VENCIDA / INACTIVA'}
            </span>
          </div>

          <div className="rounded-xl bg-navy/70 p-4 space-y-1">
            <p className="text-base font-extrabold text-white">{selectedUser.name}</p>
            <p className="text-xs font-semibold text-white/70">Matrícula: {selectedUser.matricula}</p>
          </div>

          {selectedUser.status === 'active' ? (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/80">Vehículo Registrado:</p>
                {vehicles[selectedUser.user] ? (
                  <div className="rounded-xl bg-navy/70 p-4 border border-white/10 text-xs font-semibold">
                    <p className="text-white text-sm font-bold">{vehicles[selectedUser.user].brand} {vehicles[selectedUser.user].model}</p>
                    <p className="text-cesba font-extrabold text-sm font-mono mt-0.5">Placas: {vehicles[selectedUser.user].plate}</p>
                    <p className="text-white/60 mt-1">Color: {vehicles[selectedUser.user].color}</p>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-red-400">Sin auto registrado por el alumno.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep('SCAN')} className="flex-1 rounded-xl bg-navy py-3 text-xs font-bold text-white">
                  Rechazar
                </button>
                <button onClick={() => setStep('CONFIRM')} disabled={!vehicles[selectedUser.user]} className="flex-1 rounded-xl bg-cesba py-3 text-xs font-bold text-white shadow disabled:opacity-40">
                  Confirmar Recepción →
                </button>
              </div>
            </>
          ) : (
            /* Mensaje de Error y Bloqueo */
            <div className="space-y-4">
              <div className="rounded-xl bg-red-500/20 p-4 border border-red-500/40 text-red-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-extrabold text-red-400 text-sm">
                  <ShieldAlert className="size-5" /> Acceso Denegado
                </div>
                <p>
                  La membresía del estudiante se encuentra <strong>VENCIDA</strong>. No es posible recibir el vehículo ni generar ticket de entrada hasta que regularice su pago.
                </p>
              </div>

              <button onClick={() => setStep('SCAN')} className="w-full rounded-xl bg-navy py-3 text-xs font-bold text-white">
                Volver al Escáner
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASO 3: CONFIRMAR CAJÓN */}
      {step === 'CONFIRM' && selectedUser && (
        <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5 space-y-4">
          <h2 className="text-lg font-extrabold text-white">Asignar Espacio de Estacionamiento</h2>

          <div>
            <label className="block text-xs font-bold text-white/80 mb-1">Cajón / Número de Espacio</label>
            <input 
              value={assignedSpot}
              onChange={(e) => setAssignedSpot(e.target.value)}
              placeholder="Ej. A-14, B-02"
              className="w-full rounded-xl bg-navy px-4 py-3 font-extrabold text-cesba font-mono outline-none focus:ring-2 focus:ring-cesba text-base uppercase"
            />
          </div>

          <button 
            onClick={handleConfirmReception}
            className="w-full rounded-xl bg-green-600 py-3.5 font-extrabold text-white shadow-lg active:scale-[.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-5" />
            Confirmar Recepción e Iniciar Servicio
          </button>
        </div>
      )}

      {/* RE-ESCANEO PARA CONFIRMAR ENTREGA AL ESTUDIANTE */}
      {step === 'DELIVER_SCAN' && (
        <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5 space-y-4">
          <h2 className="text-lg font-extrabold text-amber-400">Re-escanear QR para Entregar Vehículo</h2>
          <p className="text-xs text-white/70">Escanea la membresía del alumno para validar la entrega en mano y cerrar el ticket.</p>

          <p className="rounded-xl bg-navy p-3 text-xs font-bold text-white">
            Dueño del vehículo: <span className="text-amber-400">{users.find(u => u.user === deliverTarget)?.name}</span>
          </p>

          <QrScanner onScan={handleScanText} />

          {scanError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/20 p-3 text-xs font-bold text-red-200">
              <AlertTriangle className="size-4 shrink-0" /> {scanError}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) handleScanText(manualCode) }}
            className="flex gap-2"
          >
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="¿Sin cámara? Escribe la matrícula"
              className="flex-1 rounded-xl bg-navy px-4 py-2.5 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-cesba"
            />
            <button type="submit" className="rounded-xl bg-cesba px-4 text-xs font-extrabold text-white">Buscar</button>
          </form>

          <button onClick={() => { setDeliverTarget(null); setStep('MANAGEMENT') }} className="w-full rounded-xl bg-navy py-3 text-xs font-bold text-white">
            Cancelar
          </button>
        </div>
      )}

      {/* PASO 4: GESTIÓN DE AUTOS ESTACIONADOS E HISTORIAL */}
      {step === 'MANAGEMENT' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5 space-y-4">
            <h2 className="text-lg font-extrabold text-white">Vehículos en Resguardo</h2>

            {activeParkedList.length === 0 ? (
              <p className="py-6 text-center text-xs font-semibold text-white/60">No hay automóviles estacionados en este momento.</p>
            ) : (
              <div className="space-y-3">
                {activeParkedList.map(({ user, vehicle, ticket }) => (
                  <div 
                    key={user.user} 
                    className={`rounded-xl p-4 border transition-all ${
                      ticket.status === 'REQUESTED' ? 'bg-amber-500/15 border-amber-500/50' : 'bg-navy/80 border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          ticket.status === 'REQUESTED' ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {ticket.status === 'REQUESTED' ? '¡DEVOLUCIÓN SOLICITADA!' : 'EN RESGUARDO'}
                        </span>
                        <p className="font-extrabold text-white text-sm mt-1">{user.name}</p>
                        <p className="text-xs text-white/70">{vehicle?.brand} {vehicle?.model} • <strong className="text-cesba font-mono">{vehicle?.plate}</strong></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/60 font-semibold">Espacio</p>
                        <p className="text-xl font-black text-cesba">{ticket.spot}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onUpdateTicket(user.user, null)}
                        className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-bold text-red-300"
                      >
                        Cancelar Servicio
                      </button>
                      <button
                        onClick={() => { setDeliverTarget(user.user); setStep('DELIVER_SCAN') }}
                        className="flex-2 rounded-lg bg-blue-600 hover:bg-blue-500 py-2 text-xs font-extrabold text-white shadow flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="size-4" /> Escanear QR y Entregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial Global */}
          <div className="rounded-2xl bg-panel p-6 shadow-xl border border-white/5">
            <h2 className="mb-4 text-lg font-extrabold text-white flex items-center gap-2">
              <History className="size-5 text-cesba" /> Historial de Movimientos Recientes
            </h2>
            {historyList.length === 0 ? (
              <p className="text-xs text-white/60 text-center py-3">No hay registros almacenados.</p>
            ) : (
              <div className="space-y-2">
                {historyList.map(h => (
                  <div key={h.id} className="rounded-xl bg-navy/60 p-3 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{h.studentName} - Espacio {h.spot}</span>
                      <span className={h.status.includes('Cancelado') ? 'text-red-400' : 'text-green-400'}>{h.status}</span>
                    </div>
                    <p className="text-white/60">{h.vehicle} | Entrada: {h.checkInTime} - Salida: {h.checkOutTime}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}