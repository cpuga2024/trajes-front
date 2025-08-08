const API = import.meta.env.VITE_API_BASE

export type Model = {
  id?: string
  nombre: string
  stock_hombres: number
  stock_mujeres: number
}

export type Reserva = {
  id?: string
  fecha: string
  n_contacto: string
  nombre_colegio: string
  direccion: string
  tipo_baile: string
  modelo_id: string
  modelo_nombre?: string
  valor_arriendo: number
  hombres: number
  mujeres: number
  valor_adicional: number
  adicionales?: string
  horario_presentacion?: string
  delivery?: number
  total?: number
  abono?: number
}

async function http(path: string, init?: RequestInit) {
  const r = await fetch(`${API}${path}`, init)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export const fetchModels = () => http('/api/models')
export const createModel = (m: Model) => http('/api/models', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(m) })
export const deleteModelApi = (id: string) => fetch(`${API}/api/models?id=${encodeURIComponent(id)}`, { method:'DELETE' }).then(r => { if(!r.ok) throw new Error('Error'); })
export const fetchReservas = (fecha?: string) => http(`/api/reservas${fecha?`?fecha=${fecha}`:''}`)
export const createReserva = (payload: Reserva) => http('/api/reservas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
export const deleteReservaApi = (id: string) => fetch(`${API}/api/reservas?id=${encodeURIComponent(id)}`, { method:'DELETE' }).then(r => { if(!r.ok) throw new Error('Error'); })
