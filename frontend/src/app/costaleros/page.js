"use client";
import { useEffect, useState } from "react";

const API = "http://localhost:3001";

export default function GestionCostaleros() {
    const [view, setView] = useState("pasos");
    const [anio, setAnio] = useState(2026);
    const [pasoActivo, setPasoActivo] = useState("Cristo");
    const [costalerosCuadrilla, setCostalerosCuadrilla] = useState([]);
    
    const [nuevoCostalero, setNuevoCostalero] = useState({
        nombre: "", apellidos: "", telefono: "", edad: ""
    });

    // --- FUNCIÓN CRÍTICA: Carga costaleros por paso directamente del censo ---
    const cargarCostalerosPorPaso = async (paso) => {
        try {
            // Esta ruta debe devolver los costaleros de la tabla 'costaleros' filtrados por el campo 'paso'
            const res = await fetch(`${API}/costaleros/costaleros-todos`);
            const data = await res.json();
            
            if (Array.isArray(data)) {
                // Filtramos en el frontend para asegurarnos de mostrar solo los del paso seleccionado
                const filtrados = data.filter(c => c.paso === paso);
                setCostalerosCuadrilla(filtrados);
            }
        } catch (err) {
            console.error("Error al cargar costaleros:", err);
        }
    };

    // Ejecutar carga cuando cambie el paso o el año
    useEffect(() => {
        cargarCostalerosPorPaso(pasoActivo);
    }, [pasoActivo, anio]);

    // Función para añadir un nuevo costalero y que aparezca al momento
    const guardarYNuevo = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/costaleros/nuevo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...nuevoCostalero,
                    paso: pasoActivo // Se guarda con el paso que tengas seleccionado (Cristo o Virgen)
                })
            });

            if (res.ok) {
                alert("Costalero añadido correctamente");
                setNuevoCostalero({ nombre: "", apellidos: "", telefono: "", edad: "" });
                cargarCostalerosPorPaso(pasoActivo); // Recargar la lista para que aparezca el nuevo
            }
        } catch (err) {
            console.error("Error al guardar:", err);
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="bg-slate-900 p-8 rounded-3xl text-white mb-8">
                    <h1 className="text-3xl font-black uppercase">Gestión de Cuadrillas</h1>
                </header>

                {/* Selectores */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex gap-2">
                        {[2024, 2025, 2026].map(a => (
                            <button key={a} onClick={() => setAnio(a)}
                                className={`px-6 py-2 rounded-xl font-bold ${anio === a ? "bg-slate-900 text-white" : "bg-white border"}`}>
                                {a}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setPasoActivo("Cristo")}
                            className={`flex-1 py-4 rounded-2xl font-black text-xl transition-all ${pasoActivo === "Cristo" ? "bg-blue-600 text-white shadow-lg scale-105" : "bg-white border text-slate-400"}`}>
                            CRISTO
                        </button>
                        <button onClick={() => setPasoActivo("Virgen")}
                            className={`flex-1 py-4 rounded-2xl font-black text-xl transition-all ${pasoActivo === "Virgen" ? "bg-pink-600 text-white shadow-lg scale-105" : "bg-white border text-slate-400"}`}>
                            VIRGEN
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* FORMULARIO PARA AÑADIR */}
                    <div className="bg-white p-6 rounded-3xl border shadow-sm h-fit">
                        <h2 className="text-xl font-black mb-4 text-slate-800">Añadir a {pasoActivo}</h2>
                        <form onSubmit={guardarYNuevo} className="space-y-4">
                            <input className="w-full border p-4 rounded-2xl font-bold" placeholder="Nombre" value={nuevoCostalero.nombre} onChange={e => setNuevoCostalero({...nuevoCostalero, nombre: e.target.value})} required />
                            <input className="w-full border p-4 rounded-2xl font-bold" placeholder="Apellidos" value={nuevoCostalero.apellidos} onChange={e => setNuevoCostalero({...nuevoCostalero, apellidos: e.target.value})} required />
                            <input className="w-full border p-4 rounded-2xl font-bold" placeholder="Teléfono" value={nuevoCostalero.telefono} onChange={e => setNuevoCostalero({...nuevoCostalero, telefono: e.target.value})} />
                            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black hover:bg-slate-800">
                                GUARDAR Y APARECER EN LISTA
                            </button>
                        </form>
                    </div>

                    {/* LISTA DE COSTALEROS DEL PASO */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-black text-slate-600">NOMBRE Y APELLIDOS</th>
                                        <th className="p-4 font-black text-slate-600">PASO</th>
                                        <th className="p-4 font-black text-slate-600 text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {costalerosCuadrilla.length > 0 ? (
                                        costalerosCuadrilla.map(c => (
                                            <tr key={c.id} className="border-b hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-700">{c.nombre} {c.apellidos}</td>
                                                <td className="p-4 text-slate-500">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${c.paso === "Cristo" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                                                        {c.paso.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button className="text-red-500 font-black text-xs hover:underline">ELIMINAR</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="p-20 text-center text-slate-400 font-bold uppercase italic">
                                                No hay costaleros registrados en el {pasoActivo}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}