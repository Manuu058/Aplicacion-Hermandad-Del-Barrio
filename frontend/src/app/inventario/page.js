"use client";
import { useEffect, useState } from "react";

export default function Inventario() {
    const [tipoInventario, setTipoInventario] = useState("cajas");
    const [cajas, setCajas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (tipoInventario === "cajas") {
            cargarCajas();
        }
    }, [tipoInventario]);

    const cargarCajas = async () => {
        try {
            setLoading(true);
            setError(false);

            const res = await fetch("http://localhost:3001/tunicas/cajas");

            if (!res.ok) {
                throw new Error("Error en servidor");
            }

            const data = await res.json();
            setCajas(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fallo al conectar con el backend:", err);
            setError(true);
            setCajas([]);
        } finally {
            setLoading(false);
        }
    };

    const cajasDisponibles = cajas.filter((c) => c.estado === "Disponible").length;
    const cajasOcupadas = cajas.filter((c) => c.estado !== "Disponible").length;

    return (
        <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* HEADER */}
                <div className="bg-[#1a0633] text-white rounded-3xl p-8 shadow-xl">
                    <h1 className="text-4xl font-black text-purple-400 uppercase tracking-tight">
                        Inventario General
                    </h1>
                    <p className="text-slate-300 mt-2">
                        Consulta visual del almacén y control de recursos
                    </p>
                </div>

                {/* SELECTOR DE INVENTARIO */}
                <div className="bg-white rounded-3xl border shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase font-black text-slate-400">
                                Tipo de inventario
                            </p>
                            <h2 className="text-2xl font-black text-slate-900 mt-1">
                                Selección de vista
                            </h2>
                        </div>

                        <select
                            value={tipoInventario}
                            onChange={(e) => setTipoInventario(e.target.value)}
                            className="border p-3 rounded-xl font-bold bg-white md:w-64"
                        >
                            <option value="cajas">Cajas</option>
                        </select>
                    </div>
                </div>

                {/* CONTADORES */}
                {tipoInventario === "cajas" && !loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border p-5 shadow-sm">
                            <p className="text-xs uppercase font-black text-slate-400">
                                Total cajas
                            </p>
                            <p className="text-3xl font-black text-indigo-700">
                                {cajas.length}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border p-5 shadow-sm">
                            <p className="text-xs uppercase font-black text-slate-400">
                                Disponibles
                            </p>
                            <p className="text-3xl font-black text-green-600">
                                {cajasDisponibles}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border p-5 shadow-sm">
                            <p className="text-xs uppercase font-black text-slate-400">
                                Ocupadas
                            </p>
                            <p className="text-3xl font-black text-red-600">
                                {cajasOcupadas}
                            </p>
                        </div>
                    </div>
                )}

                {/* ERRORES / CARGA / CONTENIDO */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 p-8 rounded-3xl text-center">
                        <p className="text-red-600 font-bold text-lg">
                            ⚠️ No se puede conectar con el sistema
                        </p>
                        <p className="text-red-400 text-sm mt-2 font-medium">
                            Asegúrate de que el backend esté arrancado y sin errores.
                        </p>
                    </div>
                )}

                {loading && !error ? (
                    <div className="bg-white rounded-3xl border shadow-sm p-16 text-center">
                        <p className="font-black text-slate-700 text-lg tracking-widest animate-pulse">
                            SINCRONIZANDO DATOS...
                        </p>
                    </div>
                ) : null}

                {!loading && !error && tipoInventario === "cajas" && (
                    <div className="bg-white rounded-3xl border shadow-sm p-6">
                        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase font-black text-slate-400">
                                    Inventario activo
                                </p>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Cajas de almacén
                                </h2>
                            </div>

                            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                                {cajas.length} registros
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-5">
                            {cajas.map((caja) => (
                                <div
                                    key={caja.id}
                                    className={`p-6 rounded-3xl shadow-sm border transition-all hover:scale-105 ${
                                        caja.estado === "Disponible"
                                            ? "bg-white border-green-200"
                                            : "bg-purple-50 border-purple-300"
                                    }`}
                                >
                                    <p className="text-gray-300 font-black text-[10px] uppercase mb-2 tracking-wider">
                                        Box ID
                                    </p>

                                    <h3 className="text-5xl font-black text-slate-800 leading-none">
                                        {caja.numero_caja}
                                    </h3>

                                    <div
                                        className={`mt-6 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            caja.estado === "Disponible"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-purple-200 text-purple-800"
                                        }`}
                                    >
                                        {caja.estado}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {cajas.length === 0 && (
                            <div className="text-center text-slate-400 py-10 font-semibold">
                                No hay cajas registradas
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}