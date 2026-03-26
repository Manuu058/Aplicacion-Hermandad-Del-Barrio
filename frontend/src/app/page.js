"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import LoginPage from "@/app/login/page";

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalHermanos: 0,
        tunicasPrestadas: 0,
        cajasDisponibles: 0,
        cajasOcupadas: 0,
        pagosPendientes: 0,
        eventosSemana: 0,
        totalActas: 0,
        totalCorreos: 0,
        totalInventario: 0,
        totalCostaleros: 0
    });

    const [eventosProximos, setEventosProximos] = useState([]);
    const [notificaciones, setNotificaciones] = useState([]);
    const [actasRecientes, setActasRecientes] = useState([]);
    const [correosRecientes, setCorreosRecientes] = useState([]);
    const [ultimosHermanos, setUltimosHermanos] = useState([]);
    const [pagosRecientes, setPagosRecientes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [errorServidor, setErrorServidor] = useState(false);

    const cargarDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setErrorServidor(false);

            const API_BASE = "http://localhost:3001";

            const fetchSeguro = async (url) => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return null;
                    return await res.json();
                } catch {
                    return null;
                }
            };

            const [
                dataStats,
                agendaData,
                notData,
                actasData,
                correosData,
                hermanosData,
                costalerosData,
                inventarioData,
                tunicasData,
                pagosData
            ] = await Promise.all([
                fetchSeguro(`${API_BASE}/stats/dashboard`),
                fetchSeguro(`${API_BASE}/agenda`),
                fetchSeguro(`${API_BASE}/notificaciones`),
                fetchSeguro(`${API_BASE}/actas`),
                fetchSeguro(`${API_BASE}/correo`),
                fetchSeguro(`${API_BASE}/hermanos`),
                fetchSeguro(`${API_BASE}/costaleros`),
                fetchSeguro(`${API_BASE}/inventario`),
                fetchSeguro(`${API_BASE}/tunicas`),
                fetchSeguro(`${API_BASE}/pagos`)
            ]);

            if (!dataStats && !agendaData && !notData && !actasData && !correosData && !hermanosData && !pagosData) {
                throw new Error("El backend no responde");
            }

            setStats({
                totalHermanos: dataStats?.totalHermanos ?? (Array.isArray(hermanosData) ? hermanosData.length : 0),
                tunicasPrestadas: dataStats?.tunicasPrestadas ?? (Array.isArray(tunicasData) ? tunicasData.length : 0),
                cajasDisponibles: dataStats?.cajasDisponibles ?? 0,
                cajasOcupadas: dataStats?.cajasOcupadas ?? 0,
                pagosPendientes: dataStats?.pagosPendientes ?? 0,
                eventosSemana: dataStats?.eventosSemana ?? (Array.isArray(agendaData) ? agendaData.length : 0),
                totalActas: dataStats?.totalActas ?? (Array.isArray(actasData) ? actasData.length : 0),
                totalCorreos: dataStats?.totalCorreos ?? (Array.isArray(correosData) ? correosData.length : 0),
                totalInventario: dataStats?.totalInventario ?? (Array.isArray(inventarioData) ? inventarioData.length : 0),
                totalCostaleros: dataStats?.totalCostaleros ?? (Array.isArray(costalerosData) ? costalerosData.length : 0)
            });

            setEventosProximos(Array.isArray(agendaData) ? agendaData.slice(0, 4) : []);
            setNotificaciones(Array.isArray(notData) ? notData.slice(0, 5) : []);
            setActasRecientes(Array.isArray(actasData) ? actasData.slice(0, 4) : []);
            setCorreosRecientes(Array.isArray(correosData) ? correosData.slice(0, 4) : []);

            const hermanosOrdenados = Array.isArray(hermanosData)
                ? [...hermanosData].sort((a, b) => new Date(b.fecha_alta || 0) - new Date(a.fecha_alta || 0)).slice(0, 5)
                : [];
            setUltimosHermanos(hermanosOrdenados);

            const pagosOrdenados = Array.isArray(pagosData)
                ? [...pagosData].sort((a, b) => new Date(b.fecha_pago || b.fecha || 0) - new Date(a.fecha_pago || a.fecha || 0)).slice(0, 5)
                : [];
            setPagosRecientes(pagosOrdenados);

        } catch (err) {
            console.error("Error conectando al backend:", err);
            setErrorServidor(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const auth = localStorage.getItem("userAuth");
        if (auth === "true") {
            setIsLoggedIn(true);
            cargarDashboard();
        } else {
            setLoading(false);
        }
    }, [cargarDashboard]);

    const colorEvento = (tipo) => {
        const colores = {
            Ensayo: "bg-emerald-100 text-emerald-700",
            "Igualá": "bg-amber-100 text-amber-700",
            Culto: "bg-purple-100 text-purple-700",
            Procesión: "bg-red-100 text-red-700",
            Reunión: "bg-blue-100 text-blue-700",
            Cabildo: "bg-fuchsia-100 text-fuchsia-700"
        };
        return colores[tipo] || "bg-gray-100 text-gray-700";
    };

    const colorEstadoActa = (estado) => {
        const colores = {
            Borrador: "bg-amber-100 text-amber-700",
            Aprobada: "bg-emerald-100 text-emerald-700",
            Archivada: "bg-slate-100 text-slate-700"
        };
        return colores[estado] || "bg-gray-100 text-gray-700";
    };

    const colorEstadoPago = (estado) => {
        const colores = {
            Pagado: "bg-emerald-100 text-emerald-700",
            Pendiente: "bg-amber-100 text-amber-700",
            Vencido: "bg-red-100 text-red-700"
        };
        return colores[estado] || "bg-slate-100 text-slate-700";
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-6 text-slate-900 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className={`bg-[#1a0633] text-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 transition-all duration-700 ${!isLoggedIn ? "max-w-2xl mx-auto text-center" : ""}`}>
                    <div className={`flex flex-col ${isLoggedIn ? "lg:flex-row" : "items-center"} justify-between gap-8`}>
                        <div className={isLoggedIn ? "text-center lg:text-left" : "text-center"}>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
                                Gestión <span className="text-purple-400">Hermandad</span>
                            </h1>
                            <p className="mt-3 text-slate-300 font-bold tracking-[0.25em] uppercase text-[10px]">
                                Secretaría · Patrimonio · Organización interna
                            </p>
                        </div>

                        {isLoggedIn && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
                                <Link href="/hermanos" className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-4 text-center border border-white/5">
                                    <div className="text-2xl mb-1">👤</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Hermanos</div>
                                </Link>

                                <Link href="/tunicas" className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-4 text-center border border-white/5">
                                    <div className="text-2xl mb-1">🧥</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Túnicas</div>
                                </Link>

                                <Link href="/costaleros" className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-4 text-center border border-white/5">
                                    <div className="text-2xl mb-1">🧍</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Costaleros</div>
                                </Link>

                                <Link href="/inventario" className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-4 text-center border border-white/5">
                                    <div className="text-2xl mb-1">📦</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Inventario</div>
                                </Link>

                                <Link href="/agenda" className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-4 text-center border border-white/5">
                                    <div className="text-2xl mb-1">📅</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Agenda</div>
                                </Link>

                                <Link href="/actas" className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-4 text-center border border-white/5">
                                    <div className="text-2xl mb-1">📘</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Actas</div>
                                </Link>

                                <Link href="/correo" className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-4 text-center border border-white/5">
                                    <div className="text-2xl mb-1">✉️</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Correo</div>
                                </Link>
                            </div>
                        )}
                    </div>

                    {!isLoggedIn && (
                        <div className="mt-10 max-w-sm mx-auto bg-white rounded-[2.5rem] p-4 shadow-2xl text-slate-900">
                            <LoginPage
                                onLoginSuccess={() => {
                                    localStorage.setItem("userAuth", "true");
                                    window.location.reload();
                                }}
                            />
                        </div>
                    )}
                </div>

                {isLoggedIn && (
                    <div className="space-y-8">
                        {errorServidor && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-[1.5rem] flex items-center gap-3 animate-pulse">
                                <span>⚠️</span>
                                <p className="text-sm font-bold uppercase tracking-wider">
                                    El servidor backend no responde. Ejecuta "npm start" en la carpeta backend.
                                </p>
                            </div>
                        )}

                        {loading ? (
                            <div className="bg-white rounded-[2.5rem] border shadow-sm p-12 text-center">
                                <p className="text-slate-400 font-black tracking-[0.3em] animate-pulse uppercase text-xs">
                                    Sincronizando con MariaDB...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {[
                                        { label: "Hermanos", val: stats.totalHermanos, color: "border-purple-700" },
                                        { label: "Túnicas", val: stats.tunicasPrestadas, color: "border-orange-500" },
                                        { label: "Cajas libres", val: stats.cajasDisponibles, color: "border-green-600" },
                                        { label: "Cajas ocupadas", val: stats.cajasOcupadas, color: "border-red-500" },
                                        { label: "Pagos pendientes", val: stats.pagosPendientes, color: "border-amber-500" },
                                        { label: "Eventos", val: stats.eventosSemana, color: "border-blue-600" },
                                        { label: "Actas", val: stats.totalActas, color: "border-fuchsia-600" },
                                        { label: "Correos", val: stats.totalCorreos, color: "border-cyan-600" },
                                        { label: "Inventario", val: stats.totalInventario, color: "border-slate-700" },
                                        { label: "Costaleros", val: stats.totalCostaleros, color: "border-emerald-600" }
                                    ].map((s, i) => (
                                        <div key={i} className={`bg-white p-6 rounded-[2rem] shadow-sm border-b-8 ${s.color}`}>
                                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{s.label}</p>
                                            <h2 className="text-4xl font-black text-slate-800 mt-2">{s.val}</h2>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    <div className="xl:col-span-2 bg-white rounded-[2.5rem] shadow-sm border p-8">
                                        <div className="flex items-center justify-between mb-6 gap-4">
                                            <h2 className="text-2xl font-black text-slate-900">Actos y Cultos</h2>
                                            <Link href="/agenda" className="text-[11px] uppercase font-black tracking-widest bg-slate-100 hover:bg-slate-200 transition px-4 py-2 rounded-full">
                                                Ver agenda completa
                                            </Link>
                                        </div>

                                        <div className="space-y-4">
                                            {eventosProximos.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-[2rem] text-slate-400 font-bold text-sm italic">
                                                    Sin eventos próximos
                                                </div>
                                            ) : (
                                                eventosProximos.map((ev) => (
                                                    <div key={ev.id} className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50 transition">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${colorEvento(ev.tipo)}`}>
                                                                {ev.tipo || "Evento"}
                                                            </span>
                                                            {ev.lugar && (
                                                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                                                    {ev.lugar}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-lg font-black text-slate-900 mt-2">{ev.titulo}</h3>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {ev.fecha || "Sin fecha"} {ev.hora ? `· ${ev.hora}` : ""}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
                                        <div className="flex items-center justify-between mb-6 gap-4">
                                            <h2 className="text-2xl font-black text-slate-900">Avisos</h2>
                                            <Link href="/notificaciones" className="text-[11px] uppercase font-black tracking-widest bg-purple-100 text-purple-700 hover:bg-purple-200 transition px-4 py-2 rounded-full">
                                                Ver todo
                                            </Link>
                                        </div>

                                        <div className="space-y-4">
                                            {notificaciones.length === 0 ? (
                                                <div className="text-center py-10 text-slate-300 font-bold text-sm italic">
                                                    Sin avisos pendientes
                                                </div>
                                            ) : (
                                                notificaciones.map((n, i) => (
                                                    <div key={i} className="border-l-4 border-purple-500 bg-purple-50 rounded-2xl p-5 shadow-sm">
                                                        <p className="text-sm font-black text-slate-900">{n.titulo || "Aviso"}</p>
                                                        <p className="text-[11px] text-slate-600 mt-1">{n.descripcion || "Sin descripción"}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-black text-slate-900">Actas recientes</h2>
                                            <Link href="/actas" className="text-[11px] uppercase font-black tracking-widest bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 transition px-4 py-2 rounded-full">
                                                Ver actas
                                            </Link>
                                        </div>

                                        <div className="space-y-4">
                                            {actasRecientes.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-[2rem] text-slate-400 font-bold text-sm italic">
                                                    No hay actas registradas
                                                </div>
                                            ) : (
                                                actasRecientes.map((acta) => (
                                                    <div key={acta.id} className="border border-slate-100 rounded-2xl p-5">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${colorEstadoActa(acta.estado)}`}>
                                                                {acta.estado || "Borrador"}
                                                            </span>
                                                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                                                {acta.fecha || "Sin fecha"}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-base font-black text-slate-900 mt-3">{acta.titulo || "Sin título"}</h3>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {acta.tipo_reunion || "Reunión"} {acta.numero_acta ? `· Acta ${acta.numero_acta}` : ""}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-black text-slate-900">Correo reciente</h2>
                                            <Link href="/correo" className="text-[11px] uppercase font-black tracking-widest bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition px-4 py-2 rounded-full">
                                                Abrir correo
                                            </Link>
                                        </div>

                                        <div className="space-y-4">
                                            {correosRecientes.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-[2rem] text-slate-400 font-bold text-sm italic">
                                                    No hay correos guardados
                                                </div>
                                            ) : (
                                                correosRecientes.map((correo) => (
                                                    <div key={correo.id} className="border border-slate-100 rounded-2xl p-5">
                                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                                            {correo.destinatario || "Sin destinatario"}
                                                        </p>
                                                        <h3 className="text-base font-black text-slate-900 mt-2">
                                                            {correo.titulo || correo.asunto || "Sin asunto"}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {correo.fecha_envio || "Sin fecha"}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
                                        <h2 className="text-2xl font-black text-slate-900 mb-6">Resumen rápido</h2>

                                        <div className="space-y-4">
                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Secretaría</p>
                                                <p className="text-sm font-bold text-slate-700 mt-2">
                                                    {stats.totalHermanos} hermanos registrados y {stats.totalActas} actas almacenadas.
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Patrimonio</p>
                                                <p className="text-sm font-bold text-slate-700 mt-2">
                                                    {stats.cajasDisponibles} cajas disponibles y {stats.cajasOcupadas} ocupadas.
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Economía</p>
                                                <p className="text-sm font-bold text-slate-700 mt-2">
                                                    {stats.pagosPendientes} pagos pendientes de regularizar.
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Comunicación</p>
                                                <p className="text-sm font-bold text-slate-700 mt-2">
                                                    {stats.totalCorreos} correos archivados y seguimiento activo de avisos.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* NUEVAS SECCIONES */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-black text-slate-900">Últimos hermanos dados de alta</h2>
                                            <Link href="/hermanos" className="text-[11px] uppercase font-black tracking-widest bg-purple-100 text-purple-700 hover:bg-purple-200 transition px-4 py-2 rounded-full">
                                                Ver hermanos
                                            </Link>
                                        </div>

                                        <div className="space-y-4">
                                            {ultimosHermanos.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-[2rem] text-slate-400 font-bold text-sm italic">
                                                    No hay altas recientes
                                                </div>
                                            ) : (
                                                ultimosHermanos.map((hermano) => (
                                                    <div key={hermano.id} className="border border-slate-100 rounded-2xl p-5">
                                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                                            Nº {hermano.numero_hermano || "—"}
                                                        </p>
                                                        <h3 className="text-base font-black text-slate-900 mt-2">
                                                            {hermano.nombre} {hermano.apellidos}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Alta: {hermano.fecha_alta || "Sin fecha"}
                                                        </p>
                                                        {hermano.estado && (
                                                            <p className="text-[11px] text-slate-600 mt-2">
                                                                Estado: <span className="font-bold">{hermano.estado}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-black text-slate-900">Pagos recientes</h2>
                                            <Link href="/pagos" className="text-[11px] uppercase font-black tracking-widest bg-amber-100 text-amber-700 hover:bg-amber-200 transition px-4 py-2 rounded-full">
                                                Ver pagos
                                            </Link>
                                        </div>

                                        <div className="space-y-4">
                                            {pagosRecientes.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-[2rem] text-slate-400 font-bold text-sm italic">
                                                    No hay pagos recientes
                                                </div>
                                            ) : (
                                                pagosRecientes.map((pago) => (
                                                    <div key={pago.id} className="border border-slate-100 rounded-2xl p-5">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${colorEstadoPago(pago.estado)}`}>
                                                                {pago.estado || "Sin estado"}
                                                            </span>
                                                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                                                {pago.fecha_pago || pago.fecha || "Sin fecha"}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-base font-black text-slate-900 mt-3">
                                                            {pago.nombre_hermano || pago.hermano_nombre || pago.concepto || "Pago registrado"}
                                                        </h3>

                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {pago.concepto || "Sin concepto"} {pago.anio ? `· Año ${pago.anio}` : ""}
                                                        </p>

                                                        {pago.importe && (
                                                            <p className="text-sm text-slate-700 font-bold mt-2">
                                                                Importe: {pago.importe} €
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                        <h2 className="text-2xl font-black text-slate-900">Gestión rápida</h2>
                                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-black">
                                            Accesos directos de administración
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                        <Link href="/hermanos" className="rounded-[1.75rem] border border-slate-200 p-5 hover:bg-slate-50 transition">
                                            <div className="text-2xl">👥</div>
                                            <h3 className="mt-3 text-lg font-black text-slate-900">Gestionar hermanos</h3>
                                            <p className="text-sm text-slate-500 mt-1">Altas, bajas, fichas, búsqueda y estado de cuotas.</p>
                                        </Link>

                                        <Link href="/pagos" className="rounded-[1.75rem] border border-slate-200 p-5 hover:bg-slate-50 transition">
                                            <div className="text-2xl">💰</div>
                                            <h3 className="mt-3 text-lg font-black text-slate-900">Gestionar pagos</h3>
                                            <p className="text-sm text-slate-500 mt-1">Revisión anual de cuotas, cobros y pendientes.</p>
                                        </Link>

                                        <Link href="/agenda" className="rounded-[1.75rem] border border-slate-200 p-5 hover:bg-slate-50 transition">
                                            <div className="text-2xl">🗓️</div>
                                            <h3 className="mt-3 text-lg font-black text-slate-900">Planificar agenda</h3>
                                            <p className="text-sm text-slate-500 mt-1">Cultos, ensayos, cabildos y reuniones internas.</p>
                                        </Link>

                                        <Link href="/actas" className="rounded-[1.75rem] border border-slate-200 p-5 hover:bg-slate-50 transition">
                                            <div className="text-2xl">📝</div>
                                            <h3 className="mt-3 text-lg font-black text-slate-900">Archivo documental</h3>
                                            <p className="text-sm text-slate-500 mt-1">Actas, PDFs adjuntos y documentación oficial.</p>
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}