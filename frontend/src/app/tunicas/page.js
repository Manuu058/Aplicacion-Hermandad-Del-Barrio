"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function TunicasPage() {
    const [tunicas, setTunicas] = useState([]);
    const [hermanos, setHermanos] = useState([]);
    const [cajas, setCajas] = useState([]);
    const [stats, setStats] = useState({
        tunicasPrestadas: 0,
        cajasDisponibles: 0,
        cajasOcupadas: 0
    });

    const [busqueda, setBusqueda] = useState("");
    const [filtroCaja, setFiltroCaja] = useState("");
    const [esHermano, setEsHermano] = useState(true);
    const [busquedaHermano, setBusquedaHermano] = useState("");
    const [busquedaCaja, setBusquedaCaja] = useState("");

    const [formData, setFormData] = useState({
        hermano_id: "",
        caja_id: "",
        estado: "Prestada",
        descripcion: "",
        nombre_manual: "",
        apellidos_manual: "",
        dni_manual: ""
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resTunicas = await fetch("http://localhost:3001/tunicas");
            const resHermanos = await fetch("http://localhost:3001/hermanos");
            const resCajas = await fetch("http://localhost:3001/tunicas/cajas");
            const resStats = await fetch("http://localhost:3001/tunicas/stats");

            if (!resTunicas.ok) {
                const texto = await resTunicas.text();
                throw new Error(`Error cargando túnicas: ${texto}`);
            }

            if (!resHermanos.ok) {
                const texto = await resHermanos.text();
                throw new Error(`Error cargando hermanos: ${texto}`);
            }

            if (!resCajas.ok) {
                const texto = await resCajas.text();
                throw new Error(`Error cargando cajas: ${texto}`);
            }

            if (!resStats.ok) {
                const texto = await resStats.text();
                throw new Error(`Error cargando estadísticas: ${texto}`);
            }

            const d1 = await resTunicas.json();
            const d2 = await resHermanos.json();
            const d3 = await resCajas.json();
            const d4 = await resStats.json();

            setTunicas(Array.isArray(d1) ? d1 : []);
            setHermanos(Array.isArray(d2) ? d2 : []);
            setCajas(Array.isArray(d3) ? d3 : []);
            setStats(d4 || {
                tunicasPrestadas: 0,
                cajasDisponibles: 0,
                cajasOcupadas: 0
            });
        } catch (err) {
            console.error("Error cargando datos:", err);
            setTunicas([]);
            setHermanos([]);
            setCajas([]);
            setStats({
                tunicasPrestadas: 0,
                cajasDisponibles: 0,
                cajasOcupadas: 0
            });
        }
    };

    const sugerencias = hermanos
        .filter((h) =>
            `${h.nombre} ${h.apellidos} ${h.numero_hermano || ""}`
                .toLowerCase()
                .includes(busquedaHermano.toLowerCase())
        )
        .slice(0, 6);

    const cajasDisponibles = cajas.filter(
        (c) => String(c.estado || "").trim().toLowerCase() === "disponible"
    );

    const sugerenciasCajas = cajasDisponibles
        .filter((c) => {
            const textoCaja = `caja ${c.numero_caja} ${c.ubicacion || ""}`.toLowerCase();
            return textoCaja.includes(busquedaCaja.toLowerCase());
        })
        .slice(0, 10);

    const seleccionarHermano = (h) => {
        setFormData((prev) => ({
            ...prev,
            hermano_id: h.id,
            nombre_manual: "",
            apellidos_manual: "",
            dni_manual: ""
        }));
        setBusquedaHermano(`${h.nombre} ${h.apellidos}`);
    };

    const seleccionarCaja = (caja) => {
        setFormData((prev) => ({
            ...prev,
            caja_id: String(caja.id)
        }));
        setBusquedaCaja(`Caja ${caja.numero_caja}${caja.ubicacion ? ` - ${caja.ubicacion}` : ""}`);
    };

    const limpiarFormulario = () => {
        setFormData({
            hermano_id: "",
            caja_id: "",
            estado: "Prestada",
            descripcion: "",
            nombre_manual: "",
            apellidos_manual: "",
            dni_manual: ""
        });
        setEsHermano(true);
        setBusquedaHermano("");
        setBusquedaCaja("");
    };

    const registrarTunica = async (e) => {
        e.preventDefault();

        if (esHermano && !formData.hermano_id) {
            alert("Selecciona un hermano");
            return;
        }

        if (!esHermano && (!formData.nombre_manual.trim() || !formData.apellidos_manual.trim())) {
            alert("Introduce nombre y apellidos");
            return;
        }

        if (!formData.caja_id) {
            alert("Selecciona una caja");
            return;
        }

        try {
            const payload = {
                ...formData,
                hermano_id: esHermano ? formData.hermano_id : null,
                nombre_manual: esHermano ? "" : formData.nombre_manual,
                apellidos_manual: esHermano ? "" : formData.apellidos_manual,
                dni_manual: esHermano ? "" : formData.dni_manual
            };

            const res = await fetch("http://localhost:3001/tunicas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                limpiarFormulario();
                cargarDatos();
            } else {
                alert(data.error || "Error al registrar caja");
            }
        } catch (err) {
            console.error(err);
            alert("Error al conectar con el servidor");
        }
    };

    const devolverTunica = async (id) => {
        if (!window.confirm("¿Seguro que quieres devolver esta caja?")) return;

        try {
            const res = await fetch(`http://localhost:3001/tunicas/${id}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (res.ok) {
                cargarDatos();
            } else {
                alert(data.error || "Error al devolver caja");
            }
        } catch (err) {
            console.error(err);
            alert("Error al conectar con el servidor");
        }
    };

    const cambiarEstadoCaja = async (cajaId, estado) => {
        try {
            const res = await fetch(`http://localhost:3001/tunicas/cajas/${cajaId}/estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado })
            });

            const data = await res.json();

            if (res.ok) {
                cargarDatos();
            } else {
                alert(data.error || "Error al actualizar el estado");
            }
        } catch (error) {
            console.error(error);
            alert("Error al actualizar el estado");
        }
    };

    const estadoClase = (estado) => {
        if (estado === "Prestada") return "bg-green-100 text-green-700";
        if (estado === "En Casa Hermandad") return "bg-blue-100 text-blue-700";
        if (estado === "En Lavandería") return "bg-amber-100 text-amber-700";
        if (estado === "Disponible") return "bg-slate-100 text-slate-700";
        return "bg-gray-100 text-gray-700";
    };

    const tunicasFiltradas = useMemo(() => {
        return tunicas.filter((t) => {
            const persona = t.hermano_id
                ? `${t.nombre || ""} ${t.apellidos || ""}`
                : `${t.nombre_manual || ""} ${t.apellidos_manual || ""}`;

            const texto = `${persona} ${t.numero_caja || ""}`.toLowerCase();
            const coincideBusqueda = texto.includes(busqueda.toLowerCase());
            const coincideCaja = filtroCaja ? String(t.numero_caja) === filtroCaja : true;
            return coincideBusqueda && coincideCaja;
        });
    }, [tunicas, busqueda, filtroCaja]);

    const exportarExcel = () => {
        const datos = tunicasFiltradas.map((t) => ({
            Caja: t.numero_caja,
            Persona: t.hermano_id
                ? `${t.nombre || ""} ${t.apellidos || ""}`
                : `${t.nombre_manual || ""} ${t.apellidos_manual || ""}`,
            Tipo: t.hermano_id ? "Hermano" : "No hermano",
            NumeroHermano: t.numero_hermano || "",
            Estado: t.estado_tunica || "",
            Descripcion: t.descripcion || ""
        }));

        const ws = XLSX.utils.json_to_sheet(datos);

        const columnas = Object.keys(datos[0] || {
            Caja: "",
            Persona: "",
            Tipo: "",
            NumeroHermano: "",
            Estado: "",
            Descripcion: ""
        });

        ws["!cols"] = columnas.map((col) => {
            const max = Math.max(
                col.length,
                ...datos.map((row) => String(row[col] ?? "").length)
            );
            return { wch: Math.min(max + 2, 40) };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cajas");

        XLSX.writeFile(wb, `cajas_hermandad_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportarPDF = async () => {
        const doc = new jsPDF("p", "mm", "a4");
        let logoBase64 = null;

        try {
            const img = await fetch("/escudo.png");
            const blob = await img.blob();

            logoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("No se pudo cargar el logo", e);
        }

        if (logoBase64) {
            doc.addImage(logoBase64, "PNG", 14, 10, 18, 18);
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Hermandad del Barrio", 105, 18, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Listado de cajas y túnicas", 105, 26, { align: "center" });

        autoTable(doc, {
            startY: 34,
            head: [["Caja", "Persona", "Tipo", "Nº Hermano", "Estado", "Descripción"]],
            body: tunicasFiltradas.map((t) => [
                `#${t.numero_caja}`,
                t.hermano_id
                    ? `${t.nombre || ""} ${t.apellidos || ""}`
                    : `${t.nombre_manual || ""} ${t.apellidos_manual || ""}`,
                t.hermano_id ? "Hermano" : "No hermano",
                t.numero_hermano || "-",
                t.estado_tunica || "-",
                t.descripcion || "-"
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [26, 6, 51]
            }
        });

        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.text(
                `Hermandad del Barrio · Página ${i} de ${totalPages}`,
                105,
                290,
                { align: "center" }
            );
        }

        doc.save(`cajas_hermandad_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-[#1a0633] text-white rounded-3xl p-8 shadow-xl">
                    <h1 className="text-4xl font-black text-purple-400 uppercase tracking-tight">
                        Gestión de Túnicas
                    </h1>
                    <p className="text-slate-300 mt-2">Asignación, control y devolución de cajas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <p className="text-xs uppercase font-black text-slate-400">Cajas registradas</p>
                        <p className="text-3xl font-black text-indigo-700">{stats.tunicasPrestadas}</p>
                    </div>

                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <p className="text-xs uppercase font-black text-slate-400">Cajas disponibles</p>
                        <p className="text-3xl font-black text-green-600">{stats.cajasDisponibles}</p>
                    </div>

                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <p className="text-xs uppercase font-black text-slate-400">Cajas no disponibles</p>
                        <p className="text-3xl font-black text-red-600">{stats.cajasOcupadas}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl border shadow-sm p-6">
                        <h2 className="text-xl font-black mb-4">Registrar nueva caja</h2>

                        <form onSubmit={registrarTunica} className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase text-slate-400">Tipo de persona</label>
                                <select
                                    className="w-full border p-3 rounded-xl mt-1"
                                    value={esHermano ? "si" : "no"}
                                    onChange={(e) => {
                                        const valor = e.target.value === "si";
                                        setEsHermano(valor);
                                        setFormData((prev) => ({
                                            ...prev,
                                            hermano_id: "",
                                            nombre_manual: "",
                                            apellidos_manual: "",
                                            dni_manual: ""
                                        }));
                                        setBusquedaHermano("");
                                    }}
                                >
                                    <option value="si">Hermano</option>
                                    <option value="no">No hermano</option>
                                </select>
                            </div>

                            {esHermano ? (
                                <div>
                                    <label className="text-xs font-black uppercase text-slate-400">Buscar hermano</label>
                                    <input
                                        type="text"
                                        className="w-full border p-3 rounded-xl mt-1"
                                        placeholder="Buscar hermano..."
                                        value={busquedaHermano}
                                        onChange={(e) => {
                                            setBusquedaHermano(e.target.value);
                                            setFormData((prev) => ({ ...prev, hermano_id: "" }));
                                        }}
                                    />

                                    {busquedaHermano && sugerencias.length > 0 && (
                                        <div className="mt-2 border rounded-xl overflow-hidden bg-white shadow-lg">
                                            {sugerencias.map((h) => (
                                                <button
                                                    type="button"
                                                    key={h.id}
                                                    onClick={() => seleccionarHermano(h)}
                                                    className="w-full text-left p-3 hover:bg-purple-50 border-b last:border-b-0 text-sm"
                                                >
                                                    <span className="font-bold text-purple-700">
                                                        {h.numero_hermano || "-"}
                                                    </span>{" "}
                                                    - {h.nombre} {h.apellidos}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-xs font-black uppercase text-slate-400">Nombre</label>
                                        <input
                                            className="w-full border p-3 rounded-xl mt-1"
                                            value={formData.nombre_manual}
                                            onChange={(e) => setFormData({ ...formData, nombre_manual: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black uppercase text-slate-400">Apellidos</label>
                                        <input
                                            className="w-full border p-3 rounded-xl mt-1"
                                            value={formData.apellidos_manual}
                                            onChange={(e) => setFormData({ ...formData, apellidos_manual: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black uppercase text-slate-400">DNI</label>
                                        <input
                                            className="w-full border p-3 rounded-xl mt-1"
                                            value={formData.dni_manual}
                                            onChange={(e) => setFormData({ ...formData, dni_manual: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="text-xs font-black uppercase text-slate-400">Caja</label>

                                <input
                                    type="text"
                                    placeholder="Escribe para buscar una caja..."
                                    className="w-full border p-3 rounded-xl mt-1"
                                    value={busquedaCaja}
                                    onChange={(e) => {
                                        setBusquedaCaja(e.target.value);
                                        setFormData((prev) => ({
                                            ...prev,
                                            caja_id: ""
                                        }));
                                    }}
                                    required
                                />

                                {busquedaCaja && (
                                    <div className="mt-2 border rounded-xl overflow-hidden bg-white shadow-lg max-h-60 overflow-y-auto">
                                        {sugerenciasCajas.length > 0 ? (
                                            sugerenciasCajas.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => seleccionarCaja(c)}
                                                    className="w-full text-left p-3 hover:bg-purple-50 border-b last:border-b-0 text-sm"
                                                >
                                                    <span className="font-bold text-indigo-700">
                                                        Caja {c.numero_caja}
                                                    </span>
                                                    {c.ubicacion && (
                                                        <span className="text-xs text-slate-400 ml-2">
                                                            ({c.ubicacion})
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-sm text-slate-400">
                                                No hay cajas disponibles con esa búsqueda
                                            </div>
                                        )}
                                    </div>
                                )}

                                {formData.caja_id && (
                                    <p className="text-xs text-green-600 font-bold mt-2">
                                        Caja seleccionada correctamente
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-slate-400">Estado</label>
                                <select
                                    className="w-full border p-3 rounded-xl mt-1"
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                    required
                                >
                                    <option value="Prestada">Prestada</option>
                                    <option value="En Casa Hermandad">En Casa Hermandad</option>
                                    <option value="En Lavandería">En Lavandería</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-slate-400">Descripción</label>
                                <textarea
                                    className="w-full border p-3 rounded-xl mt-1"
                                    rows="3"
                                    placeholder="Observaciones..."
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            <button className="w-full bg-slate-900 text-white p-3 rounded-xl font-black">
                                REGISTRAR CAJA
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm p-6">
                        <div className="flex flex-col md:flex-row gap-3 mb-5">
                            <input
                                type="text"
                                placeholder="Buscar por persona o número de caja..."
                                className="flex-1 border p-3 rounded-xl"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />

                            <input
                                type="number"
                                placeholder="Filtrar por caja"
                                className="border p-3 rounded-xl md:w-56"
                                value={filtroCaja}
                                onChange={(e) => setFiltroCaja(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 mb-5">
                            <button
                                onClick={exportarExcel}
                                className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black"
                            >
                                EXPORTAR EXCEL
                            </button>

                            <button
                                onClick={exportarPDF}
                                className="bg-red-600 text-white px-5 py-3 rounded-xl font-black"
                            >
                                EXPORTAR PDF
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b bg-slate-50 text-xs uppercase text-slate-400">
                                        <th className="p-4">Caja</th>
                                        <th className="p-4">Persona</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4">Descripción</th>
                                        <th className="p-4">Acción</th>
                                        <th className="p-4 text-right">Devolver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tunicasFiltradas.map((t) => (
                                        <tr key={t.id} className="border-b last:border-0">
                                            <td className="p-4 font-black text-indigo-700">#{t.numero_caja}</td>

                                            <td className="p-4">
                                                <div className="font-bold">
                                                    {t.hermano_id
                                                        ? `${t.nombre || ""} ${t.apellidos || ""}`
                                                        : `${t.nombre_manual || ""} ${t.apellidos_manual || ""}`}
                                                </div>

                                                <div className="text-xs text-slate-400">
                                                    {t.hermano_id
                                                        ? `Hermano nº ${t.numero_hermano || "-"}`
                                                        : "No hermano"}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black ${estadoClase(t.estado_tunica)}`}>
                                                    {t.estado_tunica}
                                                </span>
                                            </td>

                                            <td className="p-4 text-sm text-slate-600">{t.descripcion || "-"}</td>

                                            <td className="p-4">
                                                <select
                                                    className="border rounded-xl px-3 py-2 text-sm"
                                                    value={t.estado_tunica || "Disponible"}
                                                    onChange={(e) => cambiarEstadoCaja(t.caja_id, e.target.value)}
                                                >
                                                    <option value="Disponible">Disponible</option>
                                                    <option value="Prestada">Prestada</option>
                                                    <option value="En Casa Hermandad">En Casa Hermandad</option>
                                                    <option value="En Lavandería">En Lavandería</option>
                                                </select>
                                            </td>

                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => devolverTunica(t.id)}
                                                    className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                                                >
                                                    DEVOLVER
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {tunicasFiltradas.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-400">
                                                No hay cajas que mostrar
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