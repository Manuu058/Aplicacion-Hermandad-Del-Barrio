"use client";
import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const API = "http://localhost:3001";

export default function AgendaHermandadPage() {
    const [eventos, setEventos] = useState([]);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [mesVisible, setMesVisible] = useState(new Date());
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [showModal, setShowModal] = useState(false);
    const [showDetalle, setShowDetalle] = useState(false);
    const [eventoDetalle, setEventoDetalle] = useState(null);
    const [editandoId, setEditandoId] = useState(null);

    const [formData, setFormData] = useState({
        titulo: "",
        tipo: "Culto",
        fecha: "",
        hora: "",
        lugar: "",
        descripcion: "",
        responsable: "",
        color: "",
        recordatorio: false,
        notificacion: false
    });

    useEffect(() => {
        cargarAgenda();
    }, []);

    const cargarAgenda = async () => {
        try {
            const res = await fetch(`${API}/agenda`);
            const data = await res.json();
            setEventos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error cargando agenda:", err);
            setEventos([]);
        }
    };

    const limpiarFormulario = () => {
        setFormData({
            titulo: "",
            tipo: "Culto",
            fecha: "",
            hora: "",
            lugar: "",
            descripcion: "",
            responsable: "",
            color: "",
            recordatorio: false,
            notificacion: false
        });
        setEditandoId(null);
    };

    const abrirNuevoEvento = () => {
        limpiarFormulario();
        setShowModal(true);
    };

    const abrirEditarEvento = (evento) => {
        setEditandoId(evento.id);
        setFormData({
            titulo: evento.titulo || "",
            tipo: evento.tipo || "Culto",
            fecha: evento.fecha || "",
            hora: evento.hora || "",
            lugar: evento.lugar || "",
            descripcion: evento.descripcion || "",
            responsable: evento.responsable || "",
            color: evento.color || "",
            recordatorio: !!evento.recordatorio,
            notificacion: !!evento.notificacion
        });
        setShowModal(true);
    };

    const abrirDetalleEvento = (evento) => {
        setEventoDetalle(evento);
        setShowDetalle(true);
    };

    const guardarEvento = async (e) => {
        e.preventDefault();

        const metodo = editandoId ? "PUT" : "POST";
        const url = editandoId
            ? `${API}/agenda/${editandoId}`
            : `${API}/agenda`;

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                limpiarFormulario();
                cargarAgenda();
            } else {
                alert(data.error || "Error al guardar evento");
            }
        } catch (err) {
            console.error("Error guardando evento:", err);
            alert("Error al conectar con el servidor");
        }
    };

    const eliminarEvento = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este evento?")) return;

        try {
            const res = await fetch(`${API}/agenda/${id}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (res.ok) {
                if (eventoDetalle?.id === id) {
                    setShowDetalle(false);
                    setEventoDetalle(null);
                }
                cargarAgenda();
            } else {
                alert(data.error || "Error al eliminar evento");
            }
        } catch (err) {
            console.error("Error eliminando evento:", err);
            alert("Error al conectar con el servidor");
        }
    };

    const exportarExcel = () => {
        window.open(`${API}/agenda/export/excel`, "_blank");
    };

    const exportarPDF = () => {
        window.open(`${API}/agenda/export/pdf`, "_blank");
    };

    const colorEvento = (tipo, colorPersonalizado) => {
        if (colorPersonalizado?.trim()) return "";

        if (tipo === "Culto") return "bg-purple-100 text-purple-700";
        if (tipo === "Cabildo") return "bg-blue-100 text-blue-700";
        if (tipo === "Reunión") return "bg-slate-100 text-slate-700";
        if (tipo === "Procesión") return "bg-red-100 text-red-700";
        if (tipo === "Formación") return "bg-emerald-100 text-emerald-700";
        if (tipo === "Convivencia") return "bg-amber-100 text-amber-700";
        if (tipo === "Aviso general") return "bg-pink-100 text-pink-700";
        return "bg-gray-100 text-gray-700";
    };

    const colorFondoCalendario = (tipo) => {
        if (tipo === "Culto") return "bg-purple-100 rounded-xl";
        if (tipo === "Cabildo") return "bg-blue-100 rounded-xl";
        if (tipo === "Procesión") return "bg-red-100 rounded-xl";
        if (tipo === "Reunión") return "bg-slate-100 rounded-xl";
        if (tipo === "Formación") return "bg-emerald-100 rounded-xl";
        if (tipo === "Convivencia") return "bg-amber-100 rounded-xl";
        if (tipo === "Aviso general") return "bg-pink-100 rounded-xl";
        return "";
    };

    const tileClassName = ({ date, view }) => {
        if (view !== "month") return "";

        const fecha = toLocalDateString(date);
        const eventosFecha = eventos.filter((ev) => ev.fecha === fecha);

        if (eventosFecha.length === 0) return "";

        const eventoConColor = eventosFecha.find((ev) => ev.color && ev.color.trim());
        if (eventoConColor) return "";

        return colorFondoCalendario(eventosFecha[0].tipo);
    };

    const tileContent = ({ date, view }) => {
        if (view !== "month") return null;

        const fecha = toLocalDateString(date);
        const eventosFecha = eventos.filter((ev) => ev.fecha === fecha);

        if (eventosFecha.length === 0) return null;

        const eventoConColor = eventosFecha.find((ev) => ev.color && ev.color.trim());

        if (!eventoConColor) return null;

        return (
            <div className="flex justify-center mt-1">
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: eventoConColor.color }}
                />
            </div>
        );
    };

    const eventosDelMes = useMemo(() => {
        const mes = mesVisible.getMonth();
        const anio = mesVisible.getFullYear();
        const fechaDiaSeleccionado = toLocalDateString(fechaSeleccionada);

        return eventos
            .filter((ev) => {
                if (!ev.fecha) return false;

                const fechaEvento = new Date(`${ev.fecha}T00:00:00`);
                const mismoMes =
                    fechaEvento.getMonth() === mes &&
                    fechaEvento.getFullYear() === anio;

                const coincideTipo =
                    filtroTipo === "Todos" ? true : ev.tipo === filtroTipo;

                return mismoMes && coincideTipo;
            })
            .sort((a, b) => {
                const fechaA = new Date(`${a.fecha}T${a.hora || "23:59"}`);
                const fechaB = new Date(`${b.fecha}T${b.hora || "23:59"}`);
                return fechaA - fechaB;
            })
            .map((ev) => ({
                ...ev,
                seleccionado: ev.fecha === fechaDiaSeleccionado
            }));
    }, [eventos, mesVisible, fechaSeleccionada, filtroTipo]);

    const nombreMes = mesVisible.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric"
    });

    return (
        <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-[#1a0633] text-white rounded-3xl p-8 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-purple-400 uppercase tracking-tight">
                            Agenda de la Hermandad
                        </h1>
                        <p className="text-slate-300 mt-2">
                            Organización general, cultos, reuniones y actos
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={exportarExcel}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black"
                        >
                            EXPORTAR EXCEL
                        </button>

                        <button
                            onClick={exportarPDF}
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-black"
                        >
                            EXPORTAR PDF
                        </button>

                        <button
                            onClick={abrirNuevoEvento}
                            className="bg-white text-[#1a0633] px-5 py-3 rounded-2xl font-black"
                        >
                            + NUEVO EVENTO
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl border shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4 gap-3">
                            <h2 className="text-xl font-black">Calendario</h2>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="border p-2 rounded-xl text-sm"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Culto">Culto</option>
                                <option value="Cabildo">Cabildo</option>
                                <option value="Reunión">Reunión</option>
                                <option value="Procesión">Procesión</option>
                                <option value="Formación">Formación</option>
                                <option value="Convivencia">Convivencia</option>
                                <option value="Aviso general">Aviso general</option>
                            </select>
                        </div>

                        <Calendar
                            onChange={setFechaSeleccionada}
                            value={fechaSeleccionada}
                            activeStartDate={mesVisible}
                            onActiveStartDateChange={({ activeStartDate }) => {
                                if (activeStartDate) setMesVisible(activeStartDate);
                            }}
                            tileClassName={tileClassName}
                            tileContent={tileContent}
                        />

                        <div className="mt-4 space-y-2 text-xs font-bold">
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-purple-100 inline-block" /> Culto</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-100 inline-block" /> Cabildo</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-100 inline-block" /> Procesión</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-slate-100 inline-block" /> Reunión</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-100 inline-block" /> Formación</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-100 inline-block" /> Convivencia</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-pink-100 inline-block" /> Aviso general</div>
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-white rounded-3xl border shadow-sm p-6">
                        <div className="mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Eventos del mes
                            </p>
                            <h2 className="text-2xl font-black capitalize">
                                {nombreMes}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Día seleccionado: {fechaSeleccionada.toLocaleDateString("es-ES")}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {eventosDelMes.length === 0 && (
                                <div className="text-center py-10 text-slate-400 font-semibold">
                                    No hay eventos para este mes
                                </div>
                            )}

                            {eventosDelMes.map((ev) => (
                                <div
                                    key={ev.id}
                                    className={`border rounded-2xl p-4 transition-all ${
                                        ev.seleccionado
                                            ? "border-purple-300 bg-purple-50"
                                            : "border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => abrirDetalleEvento(ev)}
                                        >
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${colorEvento(ev.tipo, ev.color)}`}
                                                    style={
                                                        ev.color?.trim()
                                                            ? {
                                                                  backgroundColor: ev.color,
                                                                  color: "#ffffff"
                                                              }
                                                            : {}
                                                    }
                                                >
                                                    {ev.tipo}
                                                </span>

                                                {ev.recordatorio && (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">
                                                        Recordatorio
                                                    </span>
                                                )}

                                                {ev.notificacion && (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">
                                                        Notificación
                                                    </span>
                                                )}

                                                {ev.seleccionado && (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-200 text-purple-800">
                                                        Día seleccionado
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-black">{ev.titulo}</h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {new Date(`${ev.fecha}T00:00:00`).toLocaleDateString("es-ES")}
                                                {ev.hora ? ` · ${ev.hora}` : " · Sin hora"}
                                                {ev.lugar ? ` · ${ev.lugar}` : ""}
                                            </p>

                                            {ev.descripcion && (
                                                <p className="text-sm text-slate-600 mt-2">
                                                    {ev.descripcion}
                                                </p>
                                            )}

                                            {ev.responsable && (
                                                <p className="text-sm text-slate-500 mt-2">
                                                    Responsable: <span className="font-semibold">{ev.responsable}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => abrirEditarEvento(ev)}
                                                className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black"
                                            >
                                                EDITAR
                                            </button>
                                            <button
                                                onClick={() => eliminarEvento(ev.id)}
                                                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black"
                                            >
                                                BORRAR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-black mb-4">
                                {editandoId ? "Editar evento" : "Nuevo evento"}
                            </h2>

                            <form onSubmit={guardarEvento} className="space-y-4">
                                <input
                                    className="w-full border p-3 rounded-xl"
                                    placeholder="Título"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                />

                                <select
                                    className="w-full border p-3 rounded-xl"
                                    value={formData.tipo}
                                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                >
                                    <option value="Culto">Culto</option>
                                    <option value="Cabildo">Cabildo</option>
                                    <option value="Reunión">Reunión</option>
                                    <option value="Procesión">Procesión</option>
                                    <option value="Formación">Formación</option>
                                    <option value="Convivencia">Convivencia</option>
                                    <option value="Aviso general">Aviso general</option>
                                </select>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    />

                                    <input
                                        type="time"
                                        className="w-full border p-3 rounded-xl"
                                        value={formData.hora}
                                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                    />
                                </div>

                                <input
                                    className="w-full border p-3 rounded-xl"
                                    placeholder="Lugar"
                                    value={formData.lugar}
                                    onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                                />

                                <input
                                    className="w-full border p-3 rounded-xl"
                                    placeholder="Responsable"
                                    value={formData.responsable}
                                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                                />

                                <input
                                    type="color"
                                    className="w-full border p-3 rounded-xl h-14"
                                    value={formData.color || "#7c3aed"}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />

                                <textarea
                                    className="w-full border p-3 rounded-xl"
                                    rows="4"
                                    placeholder="Descripción"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />

                                <div className="flex flex-col md:flex-row gap-4">
                                    <label className="flex items-center gap-2 text-sm font-bold">
                                        <input
                                            type="checkbox"
                                            checked={formData.recordatorio}
                                            onChange={(e) => setFormData({ ...formData, recordatorio: e.target.checked })}
                                        />
                                        Activar recordatorio
                                    </label>

                                    <label className="flex items-center gap-2 text-sm font-bold">
                                        <input
                                            type="checkbox"
                                            checked={formData.notificacion}
                                            onChange={(e) => setFormData({ ...formData, notificacion: e.target.checked })}
                                        />
                                        Activar notificación
                                    </label>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            limpiarFormulario();
                                        }}
                                        className="px-4 py-2 rounded-xl border font-bold"
                                    >
                                        Cancelar
                                    </button>

                                    <button className="px-4 py-2 rounded-xl bg-slate-900 text-white font-black">
                                        {editandoId ? "Guardar cambios" : "Crear evento"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDetalle && eventoDetalle && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-xl">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${colorEvento(eventoDetalle.tipo, eventoDetalle.color)}`}
                                            style={
                                                eventoDetalle.color?.trim()
                                                    ? {
                                                          backgroundColor: eventoDetalle.color,
                                                          color: "#ffffff"
                                                      }
                                                    : {}
                                            }
                                        >
                                            {eventoDetalle.tipo}
                                        </span>

                                        {eventoDetalle.recordatorio && (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">
                                                Recordatorio
                                            </span>
                                        )}

                                        {eventoDetalle.notificacion && (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">
                                                Notificación
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-2xl font-black">{eventoDetalle.titulo}</h2>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowDetalle(false);
                                        setEventoDetalle(null);
                                    }}
                                    className="text-slate-500 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <p><span className="font-black">Fecha:</span> {new Date(`${eventoDetalle.fecha}T00:00:00`).toLocaleDateString("es-ES")}</p>
                                <p><span className="font-black">Hora:</span> {eventoDetalle.hora || "Sin hora"}</p>
                                <p><span className="font-black">Lugar:</span> {eventoDetalle.lugar || "-"}</p>
                                <p><span className="font-black">Responsable:</span> {eventoDetalle.responsable || "-"}</p>
                                <p><span className="font-black">Descripción:</span> {eventoDetalle.descripcion || "-"}</p>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => {
                                        setShowDetalle(false);
                                        abrirEditarEvento(eventoDetalle);
                                    }}
                                    className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-black"
                                >
                                    EDITAR
                                </button>

                                <button
                                    onClick={() => eliminarEvento(eventoDetalle.id)}
                                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-black"
                                >
                                    BORRAR
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}