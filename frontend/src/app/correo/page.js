"use client";

import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:3001";

export default function CorreoPage() {
    const [vista, setVista] = useState("interno"); // interno | gmail

    const [correos, setCorreos] = useState([]);
    const [loadingCorreos, setLoadingCorreos] = useState(true);

    const [gmailMensajes, setGmailMensajes] = useState([]);
    const [loadingGmail, setLoadingGmail] = useState(false);

    const [etiquetasDisponibles, setEtiquetasDisponibles] = useState([]);
    const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

    const [filtros, setFiltros] = useState({
        titulo: "",
        asunto: "",
        destinatario: "",
        fecha: "",
        estado: "",
        etiqueta: ""
    });

    const [gmailFiltro, setGmailFiltro] = useState({
        q: "",
        maxResults: 10
    });

    const [showModal, setShowModal] = useState(false);
    const [showDetalle, setShowDetalle] = useState(false);
    const [showDetalleGmail, setShowDetalleGmail] = useState(false);

    const [correoDetalle, setCorreoDetalle] = useState(null);
    const [gmailDetalle, setGmailDetalle] = useState(null);

    const [formData, setFormData] = useState({
        titulo: "",
        destinatario: "",
        asunto: "",
        mensaje: "",
        etiquetas: []
    });

    useEffect(() => {
        cargarEtiquetas();
        cargarCorreos();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            cargarCorreos();
        }, 300);

        return () => clearTimeout(timeout);
    }, [filtros]);

    const cargarCorreos = async () => {
        setLoadingCorreos(true);

        try {
            const params = new URLSearchParams();

            if (filtros.titulo.trim()) params.append("titulo", filtros.titulo.trim());
            if (filtros.asunto.trim()) params.append("asunto", filtros.asunto.trim());
            if (filtros.destinatario.trim()) params.append("destinatario", filtros.destinatario.trim());
            if (filtros.fecha) params.append("fecha", filtros.fecha);
            if (filtros.estado) params.append("estado", filtros.estado);
            if (filtros.etiqueta.trim()) params.append("etiqueta", filtros.etiqueta.trim());

            const url = `${API}/correo${params.toString() ? `?${params.toString()}` : ""}`;

            const res = await fetch(url);
            const data = await res.json();

            setCorreos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando correos:", error);
            setCorreos([]);
        } finally {
            setLoadingCorreos(false);
        }
    };

    const cargarEtiquetas = async () => {
        try {
            const res = await fetch(`${API}/correo/etiquetas`);
            const data = await res.json();
            setEtiquetasDisponibles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando etiquetas:", error);
            setEtiquetasDisponibles([]);
        }
    };

    const cargarGmail = async () => {
        setLoadingGmail(true);

        try {
            const params = new URLSearchParams();

            if (gmailFiltro.q.trim()) params.append("q", gmailFiltro.q.trim());
            if (gmailFiltro.maxResults) params.append("maxResults", gmailFiltro.maxResults);

            const res = await fetch(`${API}/correo/gmail/inbox?${params.toString()}`);
            const data = await res.json();

            setGmailMensajes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando Gmail:", error);
            setGmailMensajes([]);
        } finally {
            setLoadingGmail(false);
        }
    };

    const abrirNuevoCorreo = () => {
        setFormData({
            titulo: "",
            destinatario: "",
            asunto: "",
            mensaje: "",
            etiquetas: []
        });
        setShowModal(true);
    };

    const guardarCorreo = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${API}/correo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                setFormData({
                    titulo: "",
                    destinatario: "",
                    asunto: "",
                    mensaje: "",
                    etiquetas: []
                });
                cargarCorreos();
            } else {
                alert(data.error || "Error al enviar correo");
            }
        } catch (error) {
            console.error("Error guardando correo:", error);
            alert("Error al conectar con el servidor");
        }
    };

    const eliminarCorreo = async (id) => {
        const ok = window.confirm("¿Seguro que quieres eliminar este correo?");
        if (!ok) return;

        try {
            const res = await fetch(`${API}/correo/${id}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (res.ok) {
                if (correoDetalle?.id === id) {
                    setCorreoDetalle(null);
                    setShowDetalle(false);
                }
                cargarCorreos();
            } else {
                alert(data.error || "Error al eliminar correo");
            }
        } catch (error) {
            console.error("Error eliminando correo:", error);
            alert("Error al conectar con el servidor");
        }
    };

    const abrirDetalleCorreo = async (correo) => {
        try {
            const res = await fetch(`${API}/correo/${correo.id}`);
            const data = await res.json();

            if (res.ok) {
                setCorreoDetalle(data);
                setShowDetalle(true);
            } else {
                alert(data.error || "Error al cargar detalle");
            }
        } catch (error) {
            console.error("Error en abrirDetalleCorreo:", error);
            alert("Error al conectar con el servidor");
        }
    };

    const abrirDetalleGmail = async (messageId) => {
        try {
            const res = await fetch(`${API}/correo/gmail/message/${messageId}`);
            const data = await res.json();

            if (res.ok) {
                setGmailDetalle(data);
                setShowDetalleGmail(true);
            } else {
                alert(data.error || "Error al cargar mensaje de Gmail");
            }
        } catch (error) {
            console.error("Error en abrirDetalleGmail:", error);
            alert("Error al conectar con el servidor");
        }
    };

    const crearEtiqueta = async () => {
        const nombre = nuevaEtiqueta.trim();
        if (!nombre) return;

        try {
            const res = await fetch(`${API}/correo/etiquetas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nombre })
            });

            const data = await res.json();

            if (res.ok) {
                setNuevaEtiqueta("");
                await cargarEtiquetas();

                setFormData((prev) => {
                    if (prev.etiquetas.includes(nombre)) return prev;
                    return {
                        ...prev,
                        etiquetas: [...prev.etiquetas, nombre]
                    };
                });
            } else {
                alert(data.error || "Error al crear etiqueta");
            }
        } catch (error) {
            console.error("Error creando etiqueta:", error);
            alert("Error al conectar con el servidor");
        }
    };

    const toggleEtiquetaFormulario = (nombreEtiqueta) => {
        setFormData((prev) => {
            const yaExiste = prev.etiquetas.includes(nombreEtiqueta);

            return {
                ...prev,
                etiquetas: yaExiste
                    ? prev.etiquetas.filter((e) => e !== nombreEtiqueta)
                    : [...prev.etiquetas, nombreEtiqueta]
            };
        });
    };

    const limpiarFiltros = () => {
        setFiltros({
            titulo: "",
            asunto: "",
            destinatario: "",
            fecha: "",
            estado: "",
            etiqueta: ""
        });
    };

    const colorEstado = (estado) => {
        const valor = (estado || "").toLowerCase();

        if (valor === "enviado") return "bg-emerald-100 text-emerald-700";
        if (valor === "pendiente") return "bg-amber-100 text-amber-700";
        if (valor === "error") return "bg-red-100 text-red-700";
        if (valor === "borrador") return "bg-slate-100 text-slate-700";

        return "bg-slate-100 text-slate-700";
    };

    const correosOrdenados = useMemo(() => {
        return [...correos].sort((a, b) => {
            const fechaA = a.fecha_envio ? new Date(a.fecha_envio.replace(" ", "T")) : 0;
            const fechaB = b.fecha_envio ? new Date(b.fecha_envio.replace(" ", "T")) : 0;
            return fechaB - fechaA;
        });
    }, [correos]);

    return (
        <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-[#1a0633] text-white rounded-3xl p-8 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-purple-400 uppercase tracking-tight">
                            Correo
                        </h1>
                        <p className="text-slate-300 mt-2">
                            Gestión interna de correos y bandeja Gmail
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setVista("interno")}
                            className={`px-5 py-3 rounded-2xl font-black ${
                                vista === "interno"
                                    ? "bg-white text-[#1a0633]"
                                    : "bg-white/10 text-white"
                            }`}
                        >
                            CORREOS INTERNOS
                        </button>

                        <button
                            onClick={() => {
                                setVista("gmail");
                                cargarGmail();
                            }}
                            className={`px-5 py-3 rounded-2xl font-black ${
                                vista === "gmail"
                                    ? "bg-white text-[#1a0633]"
                                    : "bg-white/10 text-white"
                            }`}
                        >
                            GMAIL
                        </button>

                        <button
                            onClick={abrirNuevoCorreo}
                            className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black"
                        >
                            + NUEVO CORREO
                        </button>
                    </div>
                </div>

                {vista === "interno" && (
                    <>
                        <div className="bg-white rounded-3xl border shadow-sm p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                                <input
                                    type="text"
                                    placeholder="Título"
                                    value={filtros.titulo}
                                    onChange={(e) => setFiltros({ ...filtros, titulo: e.target.value })}
                                    className="border p-3 rounded-xl"
                                />

                                <input
                                    type="text"
                                    placeholder="Asunto"
                                    value={filtros.asunto}
                                    onChange={(e) => setFiltros({ ...filtros, asunto: e.target.value })}
                                    className="border p-3 rounded-xl"
                                />

                                <input
                                    type="text"
                                    placeholder="Destinatario"
                                    value={filtros.destinatario}
                                    onChange={(e) => setFiltros({ ...filtros, destinatario: e.target.value })}
                                    className="border p-3 rounded-xl"
                                />

                                <input
                                    type="date"
                                    value={filtros.fecha}
                                    onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
                                    className="border p-3 rounded-xl"
                                />

                                <select
                                    value={filtros.estado}
                                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                                    className="border p-3 rounded-xl"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="borrador">Borrador</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="enviado">Enviado</option>
                                    <option value="error">Error</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Etiqueta"
                                    value={filtros.etiqueta}
                                    onChange={(e) => setFiltros({ ...filtros, etiqueta: e.target.value })}
                                    className="border p-3 rounded-xl"
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={cargarCorreos}
                                    className="px-4 py-3 rounded-xl bg-slate-900 text-white font-black"
                                >
                                    BUSCAR
                                </button>
                                <button
                                    onClick={limpiarFiltros}
                                    className="px-4 py-3 rounded-xl border font-black"
                                >
                                    LIMPIAR
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border shadow-sm p-6">
                            <div className="mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Histórico
                                </p>
                                <h2 className="text-2xl font-black">Correos guardados</h2>
                            </div>

                            {loadingCorreos ? (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    Cargando correos...
                                </div>
                            ) : correosOrdenados.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    No hay correos registrados
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {correosOrdenados.map((correo) => (
                                        <div
                                            key={correo.id}
                                            className="border border-slate-200 hover:bg-slate-50 rounded-2xl p-4 transition-all"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                <div
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => abrirDetalleCorreo(correo)}
                                                >
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${colorEstado(correo.estado)}`}
                                                        >
                                                            {correo.estado || "Sin estado"}
                                                        </span>

                                                        {correo.etiquetas?.map((et) => (
                                                            <span
                                                                key={et.id || et.nombre}
                                                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700"
                                                            >
                                                                {et.nombre}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <h3 className="text-lg font-black">
                                                        {correo.titulo || "Sin título"}
                                                    </h3>

                                                    <p className="text-sm text-slate-500 mt-1">
                                                        <span className="font-semibold">{correo.asunto}</span>
                                                        {correo.destinatario ? ` · ${correo.destinatario}` : ""}
                                                        {correo.fecha_envio ? ` · ${correo.fecha_envio}` : ""}
                                                    </p>

                                                    {correo.mensaje && (
                                                        <p className="text-sm text-slate-600 mt-2 line-clamp-2 whitespace-pre-wrap">
                                                            {correo.mensaje}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => abrirDetalleCorreo(correo)}
                                                        className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black"
                                                    >
                                                        VER
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarCorreo(correo.id)}
                                                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black"
                                                    >
                                                        BORRAR
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {vista === "gmail" && (
                    <>
                        <div className="bg-white rounded-3xl border shadow-sm p-6">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-4">
                                <input
                                    type="text"
                                    value={gmailFiltro.q}
                                    onChange={(e) => setGmailFiltro({ ...gmailFiltro, q: e.target.value })}
                                    placeholder='Buscar en Gmail. Ej: subject:Acta, from:correo@ejemplo.com'
                                    className="border p-3 rounded-xl"
                                />

                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={gmailFiltro.maxResults}
                                    onChange={(e) =>
                                        setGmailFiltro({
                                            ...gmailFiltro,
                                            maxResults: Number(e.target.value) || 10
                                        })
                                    }
                                    className="border p-3 rounded-xl"
                                />

                                <button
                                    onClick={cargarGmail}
                                    className="px-4 py-3 rounded-xl bg-slate-900 text-white font-black"
                                >
                                    CARGAR GMAIL
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border shadow-sm p-6">
                            <div className="mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Bandeja Gmail
                                </p>
                                <h2 className="text-2xl font-black">Mensajes</h2>
                            </div>

                            {loadingGmail ? (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    Cargando mensajes de Gmail...
                                </div>
                            ) : gmailMensajes.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    No hay mensajes para mostrar
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {gmailMensajes.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className="border border-slate-200 hover:bg-slate-50 rounded-2xl p-4 transition-all"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                <div
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => abrirDetalleGmail(msg.id)}
                                                >
                                                    <h3 className="text-lg font-black">
                                                        {msg.subject || "Sin asunto"}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {msg.from || "-"}
                                                        {msg.date ? ` · ${msg.date}` : ""}
                                                    </p>
                                                    <p className="text-sm text-slate-600 mt-2 line-clamp-2 whitespace-pre-wrap">
                                                        {msg.snippet || msg.body || ""}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => abrirDetalleGmail(msg.id)}
                                                        className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black"
                                                    >
                                                        VER
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-black mb-4">Nuevo correo</h2>

                            <form onSubmit={guardarCorreo} className="space-y-4">
                                <input
                                    className="w-full border p-3 rounded-xl"
                                    placeholder="Título interno"
                                    value={formData.titulo}
                                    onChange={(e) =>
                                        setFormData({ ...formData, titulo: e.target.value })
                                    }
                                />

                                <input
                                    className="w-full border p-3 rounded-xl"
                                    placeholder="Destinatario"
                                    value={formData.destinatario}
                                    onChange={(e) =>
                                        setFormData({ ...formData, destinatario: e.target.value })
                                    }
                                />

                                <input
                                    className="w-full border p-3 rounded-xl"
                                    placeholder="Asunto"
                                    value={formData.asunto}
                                    onChange={(e) =>
                                        setFormData({ ...formData, asunto: e.target.value })
                                    }
                                />

                                <textarea
                                    className="w-full border p-3 rounded-xl"
                                    rows="8"
                                    placeholder="Mensaje"
                                    value={formData.mensaje}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mensaje: e.target.value })
                                    }
                                />

                                <div className="border rounded-2xl p-4 bg-slate-50">
                                    <p className="text-sm font-black mb-3">Etiquetas</p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {etiquetasDisponibles.map((et) => {
                                            const seleccionada = formData.etiquetas.includes(et.nombre);

                                            return (
                                                <button
                                                    key={et.id}
                                                    type="button"
                                                    onClick={() => toggleEtiquetaFormulario(et.nombre)}
                                                    className={`px-3 py-2 rounded-full text-xs font-black uppercase ${
                                                        seleccionada
                                                            ? "bg-purple-600 text-white"
                                                            : "bg-white border text-slate-700"
                                                    }`}
                                                >
                                                    {et.nombre}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-2">
                                        <input
                                            className="flex-1 border p-3 rounded-xl bg-white"
                                            placeholder="Nueva etiqueta"
                                            value={nuevaEtiqueta}
                                            onChange={(e) => setNuevaEtiqueta(e.target.value)}
                                        />

                                        <button
                                            type="button"
                                            onClick={crearEtiqueta}
                                            className="px-4 py-3 rounded-xl bg-slate-900 text-white font-black"
                                        >
                                            CREAR ETIQUETA
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setFormData({
                                                titulo: "",
                                                destinatario: "",
                                                asunto: "",
                                                mensaje: "",
                                                etiquetas: []
                                            });
                                        }}
                                        className="px-4 py-2 rounded-xl border font-bold"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black"
                                    >
                                        ENVIAR Y GUARDAR
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDetalle && correoDetalle && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-3xl">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-3">
                                        <span
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${colorEstado(correoDetalle.estado)}`}
                                        >
                                            {correoDetalle.estado || "Sin estado"}
                                        </span>

                                        {correoDetalle.etiquetas?.map((et) => (
                                            <span
                                                key={et.id || et.nombre}
                                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700"
                                            >
                                                {et.nombre}
                                            </span>
                                        ))}
                                    </div>

                                    <h2 className="text-2xl font-black">
                                        {correoDetalle.titulo || "Sin título"}
                                    </h2>
                                </div>

                                <button
                                    onClick={() => {
                                        setCorreoDetalle(null);
                                        setShowDetalle(false);
                                    }}
                                    className="text-slate-500 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <p><span className="font-black">Destinatario:</span> {correoDetalle.destinatario || "-"}</p>
                                <p><span className="font-black">Asunto:</span> {correoDetalle.asunto || "-"}</p>
                                <p><span className="font-black">Fecha de envío:</span> {correoDetalle.fecha_envio || "-"}</p>
                                <div>
                                    <p className="font-black mb-2">Mensaje:</p>
                                    <div className="bg-slate-50 border rounded-2xl p-4 whitespace-pre-wrap">
                                        {correoDetalle.mensaje || "-"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => eliminarCorreo(correoDetalle.id)}
                                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-black"
                                >
                                    BORRAR
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDetalleGmail && gmailDetalle && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-black">
                                        {gmailDetalle.subject || "Sin asunto"}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-2">
                                        {gmailDetalle.from || "-"}
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setGmailDetalle(null);
                                        setShowDetalleGmail(false);
                                    }}
                                    className="text-slate-500 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <p><span className="font-black">De:</span> {gmailDetalle.from || "-"}</p>
                                <p><span className="font-black">Para:</span> {gmailDetalle.to || "-"}</p>
                                <p><span className="font-black">Fecha:</span> {gmailDetalle.date || "-"}</p>
                                <p><span className="font-black">Snippet:</span> {gmailDetalle.snippet || "-"}</p>

                                <div>
                                    <p className="font-black mb-2">Contenido:</p>
                                    <div className="bg-slate-50 border rounded-2xl p-4 whitespace-pre-wrap">
                                        {gmailDetalle.body || gmailDetalle.snippet || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}