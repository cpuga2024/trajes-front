import React, { useEffect, useMemo, useState } from 'react'
import { createModel, createReserva, deleteModelApi, deleteReservaApi, fetchModels, fetchReservas, Model, Reserva } from './api'

function today() {
  const d = new Date()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${d.getFullYear()}-${m}-${day}`
}

export default function App() {
  const [models, setModels] = useState<Model[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [fecha, setFecha] = useState(today())
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchModels().then(setModels).catch(e => setError(String(e)))
  }, [])

  useEffect(() => {
    fetchReservas(fecha).then(setReservas).catch(e => setError(String(e)))
  }, [fecha])

  const totalsByModel = useMemo(() => {
    const map = new Map<string, {h: number, m: number}>()
    reservas.forEach(r => {
      const k = r.modelo_id || 'sin'
      const cur = map.get(k) || {h:0,m:0}
      map.set(k, {h: cur.h + (r.hombres||0), m: cur.m + (r.mujeres||0)})
    })
    return map
  }, [reservas])

  const disponibilidad = useMemo(() => {
    return models.map(m => {
      const r = totalsByModel.get(m.id || '') || {h:0,m:0}
      return {
        modelo: m,
        disp_hombres: Math.max(m.stock_hombres - r.h, 0),
        disp_mujeres: Math.max(m.stock_mujeres - r.m, 0)
      }
    })
  }, [models, totalsByModel])

  return (
    <div style={{maxWidth: 1100, margin: '20px auto', fontFamily: 'system-ui, Arial'}}>
      <h1>Reservas de Trajes</h1>

      <section style={{display:'grid', gap: 16, gridTemplateColumns:'1fr 1fr'}}>
        <div style={{border:'1px solid #ddd', padding:16, borderRadius:8}}>
          <h2>Modelos (Stock)</h2>
          <ModelForm onCreated={(m)=>setModels(prev=>[...prev, m])} />
          <table width="100%" style={{marginTop:12, borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'left'}}>Modelo</th>
                <th>H</th><th>M</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {models.map(m => (
                <tr key={m.id} style={{borderTop:'1px solid #eee'}}>
                  <td>{m.nombre}</td>
                  <td style={{textAlign:'center'}}>{m.stock_hombres}</td>
                  <td style={{textAlign:'center'}}>{m.stock_mujeres}</td>
                  <td style={{textAlign:'right'}}>
                    <button onClick={async()=>{
                      if (!m.id) return
                      if (!confirm('¿Eliminar modelo?')) return
                      await deleteModelApi(m.id)
                      setModels(prev=>prev.filter(x=>x.id!==m.id))
                    }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{border:'1px solid #ddd', padding:16, borderRadius:8}}>
          <h2>Reservas</h2>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <label>Fecha: <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} /></label>
            {error && <span style={{color:'crimson'}}>{error}</span>}
          </div>
          <ReservaForm
            models={models}
            fecha={fecha}
            onCreated={(r)=>setReservas(prev=>[r, ...prev])}
            onError={(msg)=>setError(msg)}
          />
          <table width="100%" style={{marginTop:12, borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'left'}}>Colegio</th>
                <th>Modelo</th>
                <th>H</th><th>M</th>
                <th>Valor</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(r => (
                <tr key={r.id} style={{borderTop:'1px solid #eee'}}>
                  <td>{r.nombre_colegio}</td>
                  <td>{r.modelo_nombre}</td>
                  <td style={{textAlign:'center'}}>{r.hombres}</td>
                  <td style={{textAlign:'center'}}>{r.mujeres}</td>
                  <td style={{textAlign:'right'}}>${r.valor_arriendo}</td>
                  <td style={{textAlign:'right'}}>${r.total}</td>
                  <td style={{textAlign:'right'}}>
                    <button onClick={async()=>{
                      if (!r.id) return
                      if (!confirm('¿Eliminar reserva?')) return
                      await deleteReservaApi(r.id)
                      setReservas(prev=>prev.filter(x=>x.id!==r.id))
                    }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{marginTop:24, border:'1px solid #ddd', padding:16, borderRadius:8}}>
        <h2>Disponibilidad del día</h2>
        <table width="100%" style={{borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left'}}>Modelo</th><th>H disponibles</th><th>M disponibles</th>
            </tr>
          </thead>
          <tbody>
            {disponibilidad.map(d => (
              <tr key={d.modelo.id} style={{borderTop:'1px solid #eee'}}>
                <td>{d.modelo.nombre}</td>
                <td style={{textAlign:'center'}}>{d.disp_hombres}</td>
                <td style={{textAlign:'center'}}>{d.disp_mujeres}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ModelForm({ onCreated }:{ onCreated:(m:Model)=>void }){
  const [nombre, setNombre] = useState('')
  const [h, setH] = useState(0)
  const [m, setM] = useState(0)

  return (
    <form onSubmit={async e=>{
      e.preventDefault()
      const created = await createModel({ nombre, stock_hombres: Number(h), stock_mujeres: Number(m) })
      onCreated({ id: created.id, nombre, stock_hombres: Number(h), stock_mujeres: Number(m) })
      setNombre(''); setH(0); setM(0)
    }} style={{display:'flex', gap:8, alignItems:'end'}}>
      <div><label>Modelo<br/><input value={nombre} onChange={e=>setNombre(e.target.value)} required/></label></div>
      <div><label>Stock H<br/><input type="number" value={h} onChange={e=>setH(Number(e.target.value))} min={0} required/></label></div>
      <div><label>Stock M<br/><input type="number" value={m} onChange={e=>setM(Number(e.target.value))} min={0} required/></label></div>
      <button type="submit">Agregar</button>
    </form>
  )
}

function ReservaForm({ models, fecha, onCreated, onError }:{ models:Model[], fecha:string, onCreated:(r:Reserva)=>void, onError:(msg:string)=>void }){
  const [form, setForm] = useState<Reserva>({
    fecha, n_contacto:'', nombre_colegio:'', direccion:'', tipo_baile:'',
    modelo_id:'', modelo_nombre:'', valor_arriendo:0, hombres:0, mujeres:0,
    valor_adicional:0, adicionales:'', horario_presentacion:'', delivery:0, abono:0
  })
  useEffect(()=>{ setForm(f => ({...f, fecha})) }, [fecha])

  const submit = async (e:React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {...form, valor_arriendo:Number(form.valor_arriendo), hombres:Number(form.hombres), mujeres:Number(form.mujeres), valor_adicional:Number(form.valor_adicional), delivery:Number(form.delivery), abono:Number(form.abono)}
      const created = await createReserva(payload)
      onCreated({ ...payload, id: created.id, total: created.total })
      setForm(f => ({...f, nombre_colegio:'', hombres:0, mujeres:0, valor_adicional:0, adicionales:''}))
    } catch(err:any) {
      onError(err.message || 'Error')
    }
  }

  return (
    <form onSubmit={submit} style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginTop:8}}>
      <label>Contacto<input value={form.n_contacto} onChange={e=>setForm({...form, n_contacto:e.target.value})} required/></label>
      <label>Colegio<input value={form.nombre_colegio} onChange={e=>setForm({...form, nombre_colegio:e.target.value})} required/></label>
      <label>Dirección<input value={form.direccion} onChange={e=>setForm({...form, direccion:e.target.value})} required/></label>
      <label>Tipo Baile<input value={form.tipo_baile} onChange={e=>setForm({...form, tipo_baile:e.target.value})} required/></label>
      <label>Modelo
        <select value={form.modelo_id} onChange={e=>{
          const id = e.target.value
          const found = models.find(m=>m.id===id)
          setForm({...form, modelo_id:id, modelo_nombre: found?.nombre })
        }} required>
          <option value="">-- Selecciona --</option>
          {models.map(m=>(<option value={m.id} key={m.id}>{m.nombre}</option>))}
        </select>
      </label>
      <label>Horario<input value={form.horario_presentacion||''} onChange={e=>setForm({...form, horario_presentacion:e.target.value})}/></label>
      <label>Hombres<input type="number" min={0} value={form.hombres} onChange={e=>setForm({...form, hombres:Number(e.target.value)})} required/></label>
      <label>Mujeres<input type="number" min={0} value={form.mujeres} onChange={e=>setForm({...form, mujeres:Number(e.target.value)})} required/></label>
      <label>Valor Arriendo<input type="number" min={0} value={form.valor_arriendo} onChange={e=>setForm({...form, valor_arriendo:Number(e.target.value)})} required/></label>
      <label>Valor Adicional<input type="number" min={0} value={form.valor_adicional} onChange={e=>setForm({...form, valor_adicional:Number(e.target.value)})}/></label>
      <label>Adicionales<input value={form.adicionales||''} onChange={e=>setForm({...form, adicionales:e.target.value})}/></label>
      <label>Delivery ($)<input type="number" min={0} value={form.delivery||0} onChange={e=>setForm({...form, delivery:Number(e.target.value)})}/></label>
      <label>Abono<input type="number" min={0} value={form.abono||0} onChange={e=>setForm({...form, abono:Number(e.target.value)})}/></label>
      <div style={{gridColumn:'1/-1', textAlign:'right'}}><button type="submit">Crear reserva</button></div>
    </form>
  )
}
