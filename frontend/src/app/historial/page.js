"use client"
import { useEffect, useState } from "react";

export default function HistorialPage() {
    const [registros, setRegistros] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        fetch("http://localhost:3001/historial")
            .then(res => res.json())
            .then(data => setRegistros(data))
            .catch(err => console.error(err));
    }, []);

    const filtrados = Array.isArray(registros) ? registros.filter(r => 
        (r.nombre_hermano || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.numero_caja || "").toString().includes(busqueda)
    ) : [];

    if (!isClient) return null;

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-black text-slate-800">📜 Historial de Reparto</h1>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar por nombre o caja..." 
                        className="p-3 border-2 border-purple-200 rounded-xl w-full md:w-80 outline-none focus:border-purple-600 font-bold"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                    <table className="w-full text-left">
                        <thead className="bg-[#4a148c] text-white font-bold">
                            <tr>
                                <th className="p-5">Fecha Devolución</th>
                                <th className="p-5">Hermano</th>
                                <th className="p-5 text-center">Caja</th>
                                <th className="p-5">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtrados.map(r => (
                                <tr key={r.id} className="hover:bg-purple-50 transition">
                                    <td className="p-5 text-sm font-bold text-slate-500">
                                        {new Date(r.fecha_devolucion).toLocaleDateString()}
                                    </td>
                                    <td className="p-5 font-black text-slate-800 uppercase text-sm">{r.nombre_hermano}</td>
                                    <td className="p-5 text-center">
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-black">
                                            📦 {r.numero_caja}
                                        </span>
                                    </td>
                                    <td className="p-5 text-sm italic text-slate-600">{r.notas || 'Sin notas'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}