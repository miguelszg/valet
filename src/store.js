// Cuentas de prueba hardcodeadas
export const INITIAL_USERS = [
  {
    user: 'ana',
    pass: '1234',
    name: 'Ana Edrei Tamariz Adame',
    email: 'annaeadame@gmail.com',
    role: 'student',
    status: 'active',
    matricula: '202310842'
  },
  {
    user: 'luis',
    pass: '1234',
    name: 'Luis Fernando Morales',
    email: 'luis.morales@cesba.edu.mx',
    role: 'student',
    status: 'inactive',
    matricula: '202209110'
  },
  {
    user: 'valet',
    pass: '1234',
    name: 'Carlos Méndez (Valet #01)',
    email: 'valet@cesba.edu.mx',
    role: 'valet',
    status: 'active',
    matricula: 'EMP-992'
  }
]

export function getUsers() {
  const data = localStorage.getItem('cesba-users')
  return data ? JSON.parse(data) : INITIAL_USERS
}

export function saveUsers(users) {
  localStorage.setItem('cesba-users', JSON.stringify(users))
}

export function getSavedVehicles() {
  const data = localStorage.getItem('cesba-vehicles')
  if (data) return JSON.parse(data)
  return {
    ana: {
      brand: 'Nissan',
      model: 'Versa 2022',
      plate: 'UKJ-482-B',
      color: 'Gris Plata',
      photo: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400'
    },
    luis: {
      brand: 'Volkswagen',
      model: 'Jetta 2020',
      plate: 'GTO-991-[#]',
      color: 'Negro',
      photo: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400'
    }
  }
}

export function saveVehicle(userKey, vehicleData) {
  const vehicles = getSavedVehicles()
  vehicles[userKey] = vehicleData
  localStorage.setItem('cesba-vehicles', JSON.stringify(vehicles))
}

export function getActiveTickets() {
  const data = localStorage.getItem('cesba-active-tickets')
  return data ? JSON.parse(data) : {}
}

export function saveActiveTicket(userKey, ticketData) {
  const tickets = getActiveTickets()
  if (ticketData === null) {
    delete tickets[userKey]
  } else {
    tickets[userKey] = ticketData
  }
  localStorage.setItem('cesba-active-tickets', JSON.stringify(tickets))
}

// Historial global de servicios
export function getHistory() {
  const data = localStorage.getItem('cesba-valet-history')
  if (data) return JSON.parse(data)
  return [
    {
      id: 'HIS-101',
      userKey: 'ana',
      studentName: 'Ana Edrei Tamariz Adame',
      vehicle: 'Nissan Versa (UKJ-482-B)',
      spot: 'A-05',
      checkInTime: '26/10/2026 08:30 AM',
      checkOutTime: '26/10/2026 10:15 AM',
      status: 'Entregado'
    }
  ]
}

export function addHistoryEntry(entry) {
  const history = getHistory()
  history.unshift(entry)
  localStorage.setItem('cesba-valet-history', JSON.stringify(history))
}