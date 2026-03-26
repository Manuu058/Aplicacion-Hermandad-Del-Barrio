"use client";

import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:3001";

const estadoInicialFormulario = {
    numero_acta: "",
    titulo: "",
    fecha: "",
    tipo_reunion: "Cabildo ordinario",
    asistentes: "",
    contenido: "",
    acuerdos: "",
    tareas: "",
    observaciones: "",
    estado: "Borrador",
    redactor: ""
};

export default function ActasPage() {
    const [actas, setActas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [filtroEstado, setFiltroEstado] = useState("Todos");
    const [filtroYear, setFiltroYear] = useState("Todos");

    const [showModal, setShowModal] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    const [formData, setFormData] = useState(estadoInicialFormulario);
    const [archivosPdf, setArchivosPdf] = useState([]);

    const [actaSeleccionada, setActaSeleccionada] = useState(null);
    const [adjuntos, setAdjuntos] = useState([]);
    const [loadingAdjuntos, setLoadingAdjuntos] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
    const [subiendoAdjuntos, setSubiendoAdjuntos] = useState(false);

    useEffect(() => {
        cargarActas();
    }, []);

    useEffect(() => {
        if (actaSeleccionada?.id) {
            cargarAdjuntos(actaSeleccionada.id);
        } else {
            setAdjuntos([]);
            setPdfPreviewUrl("");
        }
    }, [actaSeleccionada]);

    const cargarActas = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (busqueda.trim()) params.append("search", busqueda.trim());
            if (filtroTipo !== "Todos") params.append("tipo", filtroTipo);
            if (filtroEstado !== "Todos") params.append("estado", filtroEstado);
            if (filtroYear !== "Todos") params.append("year", filtroYear);

            const res = await fetch(`${API}/actas?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al cargar actas");
            }

            const lista = Array.isArray(data) ? data : [];
            setActas(lista);

            if (lista.length > 0) {
                if (!actaSeleccionada) {
                    setActaSeleccionada(lista[0]);
                } else {
                    const sigueExistiendo = lista.find((a) => a.id === actaSeleccionada.id);
                    setActaSeleccionada(sigueExistiendo || lista[0]);
                }
            } else {
                setActaSeleccionada(null);
            }
        } catch (err) {
            console.error("Error cargando actas:", err);
            setActas([]);
            setActaSeleccionada(null);
        } finally {
            setLoading(false);
        }
    };

    const cargarAdjuntos = async (actaId) => {
        try {
            setLoadingAdjuntos(true);
            const res = await fetch(`${API}/actas/${actaId}/adjuntos`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al cargar adjuntos");
            }

            setAdjuntos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error cargando adjuntos:", err);
            setAdjuntos([]);
        } finally {
            setLoadingAdjuntos(false);
        }
    };

    const limpiarFormulario = () => {
        setFormData(estadoInicialFormulario);
        setEditandoId(null);
        setArchivosPdf([]);
    };

    const abrirNuevaActa = () => {
        limpiarFormulario();
        setShowModal(true);
    };

    const abrirEditarActa = async (acta) => {
        setEditandoId(acta.id);
        setFormData({
            numero_acta: acta.numero_acta || "",
            titulo: acta.titulo || "",
            fecha: acta.fecha || "",
            tipo_reunion: acta.tipo_reunion || "Cabildo ordinario",
            asistentes: acta.asistentes || "",
            contenido: acta.contenido || "",
            acuerdos: acta.acuerdos || "",
            tareas: acta.tareas || "",
            observaciones: acta.observaciones || "",
            estado: acta.estado || "Borrador",
            redactor: acta.redactor || ""
        });
        setArchivosPdf([]);
        setShowModal(true);
    };

    const manejarSeleccionPdf = (e) => {
        const archivos = Array.from(e.target.files || []);

        const soloPdf = archivos.filter((archivo) => {
            const esMimePdf = archivo.type === "application/pdf";
            const esExtensionPdf = archivo.name.toLowerCase().endsWith(".pdf");
            return esMimePdf || esExtensionPdf;
        });

        if (soloPdf.length !== archivos.length) {
            alert("Solo se permiten archivos PDF");
        }

        setArchivosPdf(soloPdf);
    };

    const subirPdfsActa = async (actaId) => {
        if (!archivosPdf.length) return;

        try {
            setSubiendoAdjuntos(true);

            const form = new FormData();

            archivosPdf.forEach((archivo) => {
                form.append("pdfs", archivo);
            });

            form.append("subido_por", formData.redactor || "Usuario");

            const res = await fetch(`${API}/actas/${actaId}/adjuntos`, {
                method: "POST",
                body: form
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error subiendo PDFs");
            }
        } finally {
            setSubiendoAdjuntos(false);
        }
    };

    const guardarActa = async (e) => {
        e.preventDefault();

        if (!formData.titulo || !formData.fecha || !formData.tipo_reunion || !formData.asistentes || !formData.contenido) {
            alert("Completa los campos obligatorios");
            return;
        }

        try {
            setGuardando(true);

            const metodo = editandoId ? "PUT" : "POST";
            const url = editandoId ? `${API}/actas/${editandoId}` : `${API}/actas`;

            const res = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al guardar acta");
            }

            const actaId = editandoId || data?.acta?.id;

            if (actaId && archivosPdf.length) {
                await subirPdfsActa(actaId);
            }

            setShowModal(false);
            limpiarFormulario();
            await cargarActas();

            if (actaId) {
                const actaActualizada = (editandoId
                    ? actas.find((a) => a.id === editandoId)
                    : null);

                setActaSeleccionada(
                    actaActualizada ||
                    data?.acta ||
                    null
                );

                await cargarAdjuntos(actaId);
            }
        } catch (err) {
            console.error("Error guardando acta:", err);
            alert(err.message || "Error al guardar acta");
        } finally {
            setGuardando(false);
        }
    };

    const eliminarActa = async (id) => {
        const confirmar = window.confirm("¿Seguro que quieres eliminar esta acta?");
        if (!confirmar) return;

        try {
            const res = await fetch(`${API}/actas/${id}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al eliminar acta");
            }

            if (actaSeleccionada?.id === id) {
                setActaSeleccionada(null);
                setAdjuntos([]);
                setPdfPreviewUrl("");
            }

            await cargarActas();
        } catch (err) {
            console.error("Error eliminando acta:", err);
            alert(err.message || "Error al eliminar acta");
        }
    };

    const eliminarPdf = async (adjuntoId) => {
        const confirmar = window.confirm("¿Seguro que quieres eliminar este PDF?");
        if (!confirmar) return;

        try {
            const res = await fetch(`${API}/actas/adjunto/${adjuntoId}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al eliminar PDF");
            }

            if (pdfPreviewUrl.includes(`/adjunto/${adjuntoId}/ver`)) {
                setPdfPreviewUrl("");
            }

            if (actaSeleccionada?.id) {
                await cargarAdjuntos(actaSeleccionada.id);
            }
        } catch (err) {
            console.error("Error eliminando PDF:", err);
            alert(err.message || "Error al eliminar PDF");
        }
    };

    const marcarComoOficial = async (adjuntoId) => {
        try {
            const res = await fetch(`${API}/actas/adjunto/${adjuntoId}/oficial`, {
                method: "PUT"
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error marcando PDF como oficial");
            }

            if (actaSeleccionada?.id) {
                await cargarAdjuntos(actaSeleccionada.id);
            }
        } catch (err) {
            console.error("Error marcando PDF oficial:", err);
            alert(err.message || "Error marcando PDF como oficial");
        }
    };

    const verPdf = (adjuntoId) => {
        setPdfPreviewUrl(`${API}/actas/adjunto/${adjuntoId}/ver`);
    };

    const descargarPdf = (adjuntoId) => {
        window.open(`${API}/actas/adjunto/${adjuntoId}/descargar`, "_blank");
    };

    const aniosDisponibles = useMemo(() => {
        const years = actas
            .map((a) => {
                if (!a.fecha) return null;
                return new Date(`${a.fecha}T00:00:00`).getFullYear();
            })
            .filter(Boolean);

        return [...new Set(years)].sort((a, b) => b - a);
    }, [actas]);

    const resumenActas = useMemo(() => {
        return {
            total: actas.length,
            aprobadas: actas.filter((a) => a.estado === "Aprobada").length,
            borradores: actas.filter((a) => a.estado === "Borrador").length,
            cerradas: actas.filter((a) => a.estado === "Cerrada").length
        };
    }, [actas]);

    const tiposReunion = [
        "Cabildo ordinario",
        "Cabildo extraordinario",
        "Junta de Gobierno",
        "Reunión de trabajo",
        "Comisión",
        "Secretaría",
        "Tesorería",
        "Diputación mayor de gobierno",
        "Otra"
    ];

    const estadosActa = ["Borrador", "Aprobada", "Cerrada"];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-[#1a0633] text-white rounded-3xl p-8 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-sky-300">
                            Actas y Junta de Gobierno
                        </h1>
                        <p className="text-slate-300 mt-2 max-w-2xl">
                            Registro, consulta histórica y gestión documental de actas con PDFs adjuntos.
                        </p>
                    </div>

                    <button
                        onClick={abrirNuevaActa}
                        className="bg-white text-[#1a0633] px-5 py-3 rounded-2xl font-black"
                    >
                        + NUEVA ACTA
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl border p-5 shadow-sm">
                        <p className="text-xs uppercase font-black tracking-widest text-slate-400">Total</p>
                        <p className="text-3xl font-black mt-2">{resumenActas.total}</p>
                    </div>
                    <div className="bg-white rounded-3xl border p-5 shadow-sm">
                        <p className="text-xs uppercase font-black tracking-widest text-slate-400">Aprobadas</p>
                        <p className="text-3xl font-black mt-2 text-emerald-700">{resumenActas.aprobadas}</p>
                    </div>
                    <div className="bg-white rounded-3xl border p-5 shadow-sm">
                        <p className="text-xs uppercase font-black tracking-widest text-slate-400">Borradores</p>
                        <p className="text-3xl font-black mt-2 text-amber-700">{resumenActas.borradores}</p>
                    </div>
                    <div className="bg-white rounded-3xl border p-5 shadow-sm">
                        <p className="text-xs uppercase font-black tracking-widest text-slate-400">Cerradas</p>
                        <p className="text-3xl font-black mt-2 text-slate-700">{resumenActas.cerradas}</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border shadow-sm p-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Buscar por título, contenido, asistentes..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="border rounded-2xl px-4 py-3"
                        />

                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="border rounded-2xl px-4 py-3"
                        >
                            <option value="Todos">Todos los tipos</option>
                            {tiposReunion.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="border rounded-2xl px-4 py-3"
                        >
                            <option value="Todos">Todos los estados</option>
                            {estadosActa.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroYear}
                            onChange={(e) => setFiltroYear(e.target.value)}
                            className="border rounded-2xl px-4 py-3"
                        >
                            <option value="Todos">Todos los años</option>
                            {aniosDisponibles.map((anio) => (
                                <option key={anio} value={anio}>
                                    {anio}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                        <button
                            onClick={cargarActas}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-black text-sm"
                        >
                            Buscar
                        </button>

                        <button
                            onClick={() => {
                                setBusqueda("");
                                setFiltroTipo("Todos");
                                setFiltroEstado("Todos");
                                setFiltroYear("Todos");
                                setTimeout(() => {
                                    cargarActas();
                                }, 0);
                            }}
                            className="px-4 py-2 rounded-xl border font-black text-sm"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-4 bg-white rounded-3xl border shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black">Listado de actas</h2>
                            <span className="text-sm text-slate-500">{actas.length} resultados</span>
                        </div>

                        <div className="space-y-3 max-h-[900px] overflow-y-auto pr-1">
                            {loading && (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    Cargando actas...
                                </div>
                            )}

                            {!loading && actas.length === 0 && (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    No hay actas registradas
                                </div>
                            )}

                            {!loading && actas.map((acta) => {
                                const seleccionada = actaSeleccionada?.id === acta.id;

                                return (
                                    <div
                                        key={acta.id}
                                        onClick={() => setActaSeleccionada(acta)}
                                        className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                                            seleccionada
                                                ? "border-sky-300 bg-sky-50"
                                                : "border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                    {acta.numero_acta || "Sin numeración"}
                                                </p>
                                                <h3 className="font-black text-lg mt-1 line-clamp-2">
                                                    {acta.titulo}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {acta.fecha
                                                        ? new Date(`${acta.fecha}T00:00:00`).toLocaleDateString("es-ES")
                                                        : "Sin fecha"}
                                                </p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {acta.tipo_reunion}
                                                </p>
                                            </div>

                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                acta.estado === "Aprobada"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : acta.estado === "Cerrada"
                                                    ? "bg-slate-200 text-slate-700"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}>
                                                {acta.estado}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="xl:col-span-8 space-y-6">
                        <div className="bg-white rounded-3xl border shadow-sm p-6">
                            {!actaSeleccionada ? (
                                <div className="text-center py-16 text-slate-400 font-semibold">
                                    Selecciona un acta para ver sus detalles
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                {actaSeleccionada.numero_acta || "Sin numeración"}
                                            </p>
                                            <h2 className="text-3xl font-black mt-1">
                                                {actaSeleccionada.titulo}
                                            </h2>
                                            <p className="text-slate-500 mt-2">
                                                {actaSeleccionada.fecha
                                                    ? new Date(`${actaSeleccionada.fecha}T00:00:00`).toLocaleDateString("es-ES")
                                                    : "Sin fecha"}{" "}
                                                · {actaSeleccionada.tipo_reunion}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => abrirEditarActa(actaSeleccionada)}
                                                className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-black"
                                            >
                                                EDITAR
                                            </button>
                                            <button
                                                onClick={() => eliminarActa(actaSeleccionada.id)}
                                                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-black"
                                            >
                                                BORRAR
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50 rounded-2xl p-4 border">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                Estado
                                            </p>
                                            <p className="font-bold mt-2">{actaSeleccionada.estado || "Sin estado"}</p>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-4 border">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                Redactor
                                            </p>
                                            <p className="font-bold mt-2">{actaSeleccionada.redactor || "Sin indicar"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <section>
                                            <h3 className="text-lg font-black mb-2">Asistentes</h3>
                                            <div className="bg-slate-50 border rounded-2xl p-4 whitespace-pre-wrap">
                                                {actaSeleccionada.asistentes || "Sin asistentes"}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-black mb-2">Contenido</h3>
                                            <div className="bg-slate-50 border rounded-2xl p-4 whitespace-pre-wrap">
                                                {actaSeleccionada.contenido || "Sin contenido"}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-black mb-2">Acuerdos</h3>
                                            <div className="bg-slate-50 border rounded-2xl p-4 whitespace-pre-wrap">
                                                {actaSeleccionada.acuerdos || "Sin acuerdos registrados"}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-black mb-2">Tareas</h3>
                                            <div className="bg-slate-50 border rounded-2xl p-4 whitespace-pre-wrap">
                                                {actaSeleccionada.tareas || "Sin tareas registradas"}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-black mb-2">Observaciones</h3>
                                            <div className="bg-slate-50 border rounded-2xl p-4 whitespace-pre-wrap">
                                                {actaSeleccionada.observaciones || "Sin observaciones"}
                                            </div>
                                        </section>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl border shadow-sm p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="text-2xl font-black">PDFs adjuntos</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Sube, visualiza, descarga y marca el documento oficial aprobado.
                                    </p>
                                </div>

                                {actaSeleccionada && (
                                    <label className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm cursor-pointer">
                                        + SUBIR PDF
                                        <input
                                            type="file"
                                            accept="application/pdf,.pdf"
                                            multiple
                                            className="hidden"
                                            onChange={async (e) => {
                                                const archivos = Array.from(e.target.files || []);
                                                const soloPdf = archivos.filter((archivo) =>
                                                    archivo.type === "application/pdf" ||
                                                    archivo.name.toLowerCase().endsWith(".pdf")
                                                );

                                                if (soloPdf.length !== archivos.length) {
                                                    alert("Solo se permiten archivos PDF");
                                                }

                                                if (!soloPdf.length) return;

                                                try {
                                                    setSubiendoAdjuntos(true);

                                                    const form = new FormData();
                                                    soloPdf.forEach((archivo) => {
                                                        form.append("pdfs", archivo);
                                                    });
                                                    form.append("subido_por", actaSeleccionada.redactor || "Usuario");

                                                    const res = await fetch(`${API}/actas/${actaSeleccionada.id}/adjuntos`, {
                                                        method: "POST",
                                                        body: form
                                                    });

                                                    const data = await res.json();

                                                    if (!res.ok) {
                                                        throw new Error(data.error || "Error subiendo PDFs");
                                                    }

                                                    await cargarAdjuntos(actaSeleccionada.id);
                                                    e.target.value = "";
                                                } catch (err) {
                                                    console.error(err);
                                                    alert(err.message || "Error subiendo PDFs");
                                                } finally {
                                                    setSubiendoAdjuntos(false);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>

                            {!actaSeleccionada ? (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    Selecciona un acta para gestionar sus PDFs
                                </div>
                            ) : (
                                <>
                                    {subiendoAdjuntos && (
                                        <div className="mb-4 p-4 rounded-2xl bg-blue-50 text-blue-700 font-bold">
                                            Subiendo PDFs...
                                        </div>
                                    )}

                                    {loadingAdjuntos ? (
                                        <div className="text-center py-10 text-slate-400 font-semibold">
                                            Cargando adjuntos...
                                        </div>
                                    ) : adjuntos.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 font-semibold">
                                            Esta acta no tiene PDFs adjuntos
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {adjuntos.map((pdf) => (
                                                <div
                                                    key={pdf.id}
                                                    className="border rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
                                                >
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-slate-900 break-words">
                                                            {pdf.nombre_original}
                                                        </h4>

                                                        <p className="text-sm text-slate-500 mt-1">
                                                            Subido por: {pdf.subido_por || "Sin indicar"}
                                                        </p>

                                                        <p className="text-sm text-slate-500">
                                                            Fecha: {pdf.fecha_subida
                                                                ? new Date(pdf.fecha_subida).toLocaleString("es-ES")
                                                                : "Sin fecha"}
                                                        </p>

                                                        <p className="text-sm text-slate-500">
                                                            Tamaño: {pdf.tamano_bytes
                                                                ? `${(pdf.tamano_bytes / 1024 / 1024).toFixed(2)} MB`
                                                                : "No disponible"}
                                                        </p>

                                                        {pdf.es_oficial && (
                                                            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                                                                ACTA OFICIAL APROBADA
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => verPdf(pdf.id)}
                                                            className="px-3 py-2 rounded-xl bg-slate-100 font-black text-sm"
                                                        >
                                                            VER
                                                        </button>

                                                        <button
                                                            onClick={() => descargarPdf(pdf.id)}
                                                            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-black text-sm"
                                                        >
                                                            DESCARGAR
                                                        </button>

                                                        {!pdf.es_oficial && (
                                                            <button
                                                                onClick={() => marcarComoOficial(pdf.id)}
                                                                className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-black text-sm"
                                                            >
                                                                MARCAR OFICIAL
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => eliminarPdf(pdf.id)}
                                                            className="px-3 py-2 rounded-xl bg-red-50 text-red-600 font-black text-sm"
                                                        >
                                                            ELIMINAR
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {pdfPreviewUrl && (
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-lg font-black">Vista previa del PDF</h4>
                                                <button
                                                    onClick={() => setPdfPreviewUrl("")}
                                                    className="px-3 py-2 rounded-xl border text-sm font-black"
                                                >
                                                    Cerrar vista previa
                                                </button>
                                            </div>

                                            <div className="border rounded-2xl overflow-hidden bg-slate-100">
                                                <iframe
                                                    src={pdfPreviewUrl}
                                                    title="Vista previa PDF"
                                                    className="w-full h-[700px]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between gap-4 mb-5">
                                <h2 className="text-2xl font-black">
                                    {editandoId ? "Editar acta" : "Nueva acta"}
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        limpiarFormulario();
                                    }}
                                    className="px-4 py-2 rounded-xl border font-black"
                                >
                                    Cerrar
                                </button>
                            </div>

                            <form onSubmit={guardarActa} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-black mb-2">Número de acta</label>
                                        <input
                                            className="w-full border p-3 rounded-xl"
                                            value={formData.numero_acta}
                                            onChange={(e) => setFormData({ ...formData, numero_acta: e.target.value })}
                                            placeholder="Ej. JG-2026-001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black mb-2">Fecha *</label>
                                        <input
                                            type="date"
                                            className="w-full border p-3 rounded-xl"
                                            value={formData.fecha}
                                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black mb-2">Título *</label>
                                    <input
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        placeholder="Título del acta"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-black mb-2">Tipo de reunión *</label>
                                        <select
                                            className="w-full border p-3 rounded-xl"
                                            value={formData.tipo_reunion}
                                            onChange={(e) => setFormData({ ...formData, tipo_reunion: e.target.value })}
                                        >
                                            {tiposReunion.map((tipo) => (
                                                <option key={tipo} value={tipo}>
                                                    {tipo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black mb-2">Estado</label>
                                        <select
                                            className="w-full border p-3 rounded-xl"
                                            value={formData.estado}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        >
                                            {estadosActa.map((estado) => (
                                                <option key={estado} value={estado}>
                                                    {estado}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black mb-2">Redactor</label>
                                        <input
                                            className="w-full border p-3 rounded-xl"
                                            value={formData.redactor}
                                            onChange={(e) => setFormData({ ...formData, redactor: e.target.value })}
                                            placeholder="Nombre del redactor"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black mb-2">Asistentes *</label>
                                    <textarea
                                        rows="4"
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.asistentes}
                                        onChange={(e) => setFormData({ ...formData, asistentes: e.target.value })}
                                        placeholder="Lista de asistentes"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black mb-2">Contenido *</label>
                                    <textarea
                                        rows="6"
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.contenido}
                                        onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                                        placeholder="Contenido del acta"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black mb-2">Acuerdos</label>
                                    <textarea
                                        rows="4"
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.acuerdos}
                                        onChange={(e) => setFormData({ ...formData, acuerdos: e.target.value })}
                                        placeholder="Acuerdos adoptados"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black mb-2">Tareas</label>
                                    <textarea
                                        rows="4"
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.tareas}
                                        onChange={(e) => setFormData({ ...formData, tareas: e.target.value })}
                                        placeholder="Tareas derivadas"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black mb-2">Observaciones</label>
                                    <textarea
                                        rows="3"
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        placeholder="Observaciones"
                                    />
                                </div>

                                <div className="border rounded-2xl p-4 bg-slate-50">
                                    <label className="block text-sm font-black mb-2">
                                        PDFs adjuntos
                                    </label>

                                    <input
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        multiple
                                        onChange={manejarSeleccionPdf}
                                        className="w-full border p-3 rounded-xl bg-white"
                                    />

                                    <p className="text-xs text-slate-500 mt-2">
                                        Solo se admiten archivos PDF. Puedes seleccionar varios.
                                    </p>

                                    {archivosPdf.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {archivosPdf.map((archivo, index) => (
                                                <div
                                                    key={`${archivo.name}-${index}`}
                                                    className="text-sm bg-white border rounded-xl px-3 py-2"
                                                >
                                                    {archivo.name} · {(archivo.size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            limpiarFormulario();
                                        }}
                                        className="px-4 py-2 rounded-xl border font-black"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={guardando || subiendoAdjuntos}
                                        className="px-5 py-2 rounded-xl bg-slate-900 text-white font-black disabled:opacity-60"
                                    >
                                        {guardando
                                            ? "Guardando..."
                                            : editandoId
                                            ? "Guardar cambios"
                                            : "Crear acta"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}