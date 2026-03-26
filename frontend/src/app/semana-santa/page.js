"use client";
import { useEffect, useMemo, useState } from "react";

export default function SemanaSantaPage() {
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [lista, setLista] = useState([]);
    const [hermanos, setHermanos] = useState([]);
    const [tunicas, setTunicas] = useState([]);
    const [busquedaHermano, setBusquedaHermano] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("Todos");
    const [busquedaTabla, setBusquedaTabla] = useState("");
    const [filtroPago, setFiltroPago] = useState("Todos");
    const [esHermano, setEsHermano] = useState(true);

    const [formAsignar, setFormAsignar] = useState({
        hermano_id: "",
        puesto: "Nazareno",
        metodo_pago: "Efectivo",
        pagado: false,
        importe: "",
        nombre_manual: "",
        apellidos_manual: "",
        dni_manual: "",
        caja_id: "",
        accion_caja: "Se presta"
    });

    useEffect(() => {
        cargarDatos();
        cargarHermanos();
        cargarTunicas();
    }, [anio]);

    const cargarDatos = async () => {
        try {
            const res = await fetch(`http://localhost:3001/semana-santa/${anio}`);
            const data = await res.json();
            setLista(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al cargar datos de Semana Santa:", error);
            setLista([]);
        }
    };

    const cargarHermanos = async () => {
        try {
            const res = await fetch("http://localhost:3001/hermanos");
            const data = await res.json();
            setHermanos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al cargar hermanos:", error);
            setHermanos([]);
        }
    };

    const cargarTunicas = async () => {
        try {
            const res = await fetch("http://localhost:3001/tunicas");
            const data = await res.json();
            setTunicas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al cargar cajas:", error);
            setTunicas([]);
        }
    };

    const sugerencias = hermanos
        .filter((h) =>
            `${h.nombre} ${h.apellidos} ${h.numero_hermano || ""}`
                .toLowerCase()
                .includes(busquedaHermano.toLowerCase())
        )
        .slice(0, 5);

    const seleccionarHermano = (h) => {
        setFormAsignar((prev) => ({
            ...prev,
            hermano_id: h.id,
            nombre_manual: "",
            apellidos_manual: "",
            dni_manual: ""
        }));
        setBusquedaHermano(`${h.nombre} ${h.apellidos}`);
    };

    const limpiarFormulario = () => {
        setFormAsignar({
            hermano_id: "",
            puesto: "Nazareno",
            metodo_pago: "Efectivo",
            pagado: false,
            importe: "",
            nombre_manual: "",
            apellidos_manual: "",
            dni_manual: "",
            caja_id: "",
            accion_caja: "Se presta"
        });
        setBusquedaHermano("");
        setEsHermano(true);
    };

    const puestosConCaja = ["Nazareno", "Acólito", "Monaguillo"];
    const mostrarBloqueCaja = puestosConCaja.includes(formAsignar.puesto);

    const cajaAsignada = useMemo(() => {
        if (!mostrarBloqueCaja) return null;

        if (esHermano && formAsignar.hermano_id) {
            return (
                tunicas.find((t) => String(t.hermano_id) === String(formAsignar.hermano_id)) || null
            );
        }

        if (!esHermano && formAsignar.nombre_manual.trim() && formAsignar.apellidos_manual.trim()) {
            return (
                tunicas.find(
                    (t) =>
                        !t.hermano_id &&
                        (t.nombre_manual || "").trim().toLowerCase() === formAsignar.nombre_manual.trim().toLowerCase() &&
                        (t.apellidos_manual || "").trim().toLowerCase() === formAsignar.apellidos_manual.trim().toLowerCase()
                ) || null
            );
        }

        return null;
    }, [tunicas, esHermano, formAsignar, mostrarBloqueCaja]);

    useEffect(() => {
        if (cajaAsignada) {
            setFormAsignar((prev) => ({
                ...prev,
                caja_id: cajaAsignada.caja_id || ""
            }));
        } else {
            setFormAsignar((prev) => ({
                ...prev,
                caja_id: ""
            }));
        }
    }, [cajaAsignada]);

    const inscribirHermano = async (e) => {
        e.preventDefault();

        if (esHermano && !formAsignar.hermano_id) {
            alert("Selecciona un hermano primero");
            return;
        }

        if (!esHermano && (!formAsignar.nombre_manual.trim() || !formAsignar.apellidos_manual.trim())) {
            alert("Introduce nombre y apellidos");
            return;
        }

        const payload = {
            ...formAsignar,
            hermano_id: esHermano ? formAsignar.hermano_id : null,
            nombre_manual: esHermano ? "" : formAsignar.nombre_manual,
            apellidos_manual: esHermano ? "" : formAsignar.apellidos_manual,
            dni_manual: esHermano ? "" : formAsignar.dni_manual,
            anio: parseInt(anio, 10),
            importe: formAsignar.importe ? parseFloat(formAsignar.importe) : 0,
            caja_id: mostrarBloqueCaja && cajaAsignada ? cajaAsignada.caja_id : null,
            accion_caja: mostrarBloqueCaja && cajaAsignada ? formAsignar.accion_caja : null
        };

        try {
            const res = await fetch("http://localhost:3001/semana-santa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                limpiarFormulario();
                cargarDatos();
                cargarTunicas();
            } else {
                alert(data.error || "Error al crear papeleta");
            }
        } catch (error) {
            console.error("Error al crear papeleta:", error);
            alert("Error al conectar con el servidor");
        }
    };

    const eliminarDeLista = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta papeleta?")) return;

        try {
            const res = await fetch(`http://localhost:3001/semana-santa/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                cargarDatos();
            } else {
                alert("Error al eliminar");
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar");
        }
    };

    const togglePago = async (id) => {
        try {
            const res = await fetch(`http://localhost:3001/semana-santa/${id}/pago`, {
                method: "PUT"
            });

            const data = await res.json();

            if (res.ok) {
                cargarDatos();
            } else {
                alert(data.error || "Error al actualizar el pago");
            }
        } catch (error) {
            console.error("Error al actualizar pago:", error);
            alert("Error al actualizar el pago");
        }
    };

    const listaVisualizacion = lista
        .filter((item) => (filtroCategoria === "Todos" ? true : item.puesto === filtroCategoria))
        .filter((item) => {
            const texto = `${item.nombre || ""} ${item.apellidos || ""} ${item.numero_hermano || ""} ${item.numero_caja || ""}`.toLowerCase();
            return texto.includes(busquedaTabla.toLowerCase());
        })
        .filter((item) => {
            if (filtroPago === "Pagados") return item.pagado === true;
            if (filtroPago === "Pendientes") return item.pagado !== true;
            return true;
        });

    const totalPapeletas = lista.length;
    const totalPagadas = lista.filter((item) => item.pagado === true).length;
    const totalPendientes = lista.filter((item) => item.pagado !== true).length;
    const totalNazarenos = lista.filter((item) => item.puesto === "Nazareno").length;
    const totalCostaleros = lista.filter((item) => item.puesto === "Costalero").length;

    const anios = Array.from({ length: 12 }, (_, i) => 2024 + i).filter((a) => a <= 2035);

    return (
        <div className="p-8 bg-slate-50 min-h-screen text-black font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-[#1a0633] p-8 rounded-3xl shadow-2xl text-white gap-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-purple-400">
                            Estación de Penitencia
                        </h1>
                        <p className="text-gray-400 font-medium">Planificación Anual y Papeletas de Sitio</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
                        <span className="font-bold text-xs uppercase tracking-widest text-purple-200">
                            Año Activo
                        </span>
                        <select
                            value={anio}
                            onChange={(e) => setAnio(e.target.value)}
                            className="bg-white text-[#1a0633] px-6 py-2 rounded-xl font-black text-2xl outline-none"
                        >
                            {anios.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold mb-6 text-[#1a0633] flex items-center gap-2">
                                <span className="text-xl">✍️</span> Nueva Papeleta
                            </h2>

                            <form onSubmit={inscribirHermano} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Tipo de persona
                                    </label>
                                    <select
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                        value={esHermano ? "si" : "no"}
                                        onChange={(e) => {
                                            const nuevoEsHermano = e.target.value === "si";
                                            setEsHermano(nuevoEsHermano);
                                            setFormAsignar((prev) => ({
                                                ...prev,
                                                hermano_id: "",
                                                nombre_manual: "",
                                                apellidos_manual: "",
                                                dni_manual: "",
                                                caja_id: ""
                                            }));
                                            setBusquedaHermano("");
                                        }}
                                    >
                                        <option value="si">Es hermano</option>
                                        <option value="no">No es hermano</option>
                                    </select>
                                </div>

                                {esHermano ? (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            Buscar hermano
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Buscar hermano..."
                                            className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                            value={busquedaHermano}
                                            onChange={(e) => {
                                                setBusquedaHermano(e.target.value);
                                                setFormAsignar((prev) => ({ ...prev, hermano_id: "" }));
                                            }}
                                        />

                                        {busquedaHermano && sugerencias.length > 0 && (
                                            <div className="mt-2 border rounded-xl overflow-hidden shadow-lg bg-white">
                                                {sugerencias.map((h) => (
                                                    <button
                                                        key={h.id}
                                                        type="button"
                                                        onClick={() => seleccionarHermano(h)}
                                                        className="w-full text-left p-3 text-xs hover:bg-purple-50 border-b last:border-0"
                                                    >
                                                        <span className="font-bold text-purple-700">
                                                            {h.numero_hermano}
                                                        </span>{" "}
                                                        - {h.nombre} {h.apellidos}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Nombre"
                                                className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                                value={formAsignar.nombre_manual}
                                                onChange={(e) =>
                                                    setFormAsignar({
                                                        ...formAsignar,
                                                        nombre_manual: e.target.value
                                                    })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Apellidos
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Apellidos"
                                                className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                                value={formAsignar.apellidos_manual}
                                                onChange={(e) =>
                                                    setFormAsignar({
                                                        ...formAsignar,
                                                        apellidos_manual: e.target.value
                                                    })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                DNI
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="DNI"
                                                className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                                value={formAsignar.dni_manual}
                                                onChange={(e) =>
                                                    setFormAsignar({
                                                        ...formAsignar,
                                                        dni_manual: e.target.value
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Sección / Puesto
                                    </label>
                                    <select
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                        value={formAsignar.puesto}
                                        onChange={(e) =>
                                            setFormAsignar({ ...formAsignar, puesto: e.target.value })
                                        }
                                    >
                                        <option value="Nazareno">Nazareno</option>
                                        <option value="Costalero">Costalero</option>
                                        <option value="Mantilla">Mantilla</option>
                                        <option value="Acólito">Acólito</option>
                                        <option value="Penitencia">Penitencia (Cruz)</option>
                                        <option value="Monaguillo">Monaguillo</option>
                                    </select>
                                </div>

                                {mostrarBloqueCaja && (
                                    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                                        <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-2">
                                            Información de caja
                                        </div>

                                        {cajaAsignada ? (
                                            <div className="space-y-2 text-sm">
                                                <div className="font-bold text-[#1a0633]">
                                                    Tiene caja asignada: Caja #{cajaAsignada.numero_caja}
                                                </div>
                                                <div className="text-slate-700">
                                                    Persona:{" "}
                                                    {cajaAsignada.hermano_id
                                                        ? `${cajaAsignada.nombre || ""} ${cajaAsignada.apellidos || ""}`
                                                        : `${cajaAsignada.nombre_manual || ""} ${cajaAsignada.apellidos_manual || ""}`}
                                                </div>
                                                <div className="text-slate-700">
                                                    Estado actual: {cajaAsignada.estado_tunica || "-"}
                                                </div>
                                                <div className="text-slate-700">
                                                    Descripción: {cajaAsignada.descripcion || "-"}
                                                </div>

                                                <div className="pt-3">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        ¿Qué se va a hacer con la caja?
                                                    </label>
                                                    <select
                                                        className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                                        value={formAsignar.accion_caja}
                                                        onChange={(e) =>
                                                            setFormAsignar({
                                                                ...formAsignar,
                                                                accion_caja: e.target.value
                                                            })
                                                        }
                                                    >
                                                        <option value="Se presta">Se presta / se la lleva</option>
                                                        <option value="Se queda en Casa Hermandad">Se queda en Casa Hermandad</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-600">
                                                Esta persona no tiene caja asignada.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Método de Pago
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        {["Efectivo", "Bizum", "Banco"].map((metodo) => (
                                            <button
                                                key={metodo}
                                                type="button"
                                                onClick={() =>
                                                    setFormAsignar({ ...formAsignar, metodo_pago: metodo })
                                                }
                                                className={`p-2 text-[10px] font-bold rounded-lg border-2 transition-all ${
                                                    formAsignar.metodo_pago === metodo
                                                        ? "border-purple-600 bg-purple-50 text-purple-700"
                                                        : "border-gray-100 text-gray-400 hover:bg-gray-50"
                                                }`}
                                            >
                                                {metodo}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Importe
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl mt-1 text-sm outline-none focus:border-purple-500"
                                        value={formAsignar.importe}
                                        onChange={(e) =>
                                            setFormAsignar({ ...formAsignar, importe: e.target.value })
                                        }
                                    />
                                </div>

                                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formAsignar.pagado}
                                        onChange={(e) =>
                                            setFormAsignar({ ...formAsignar, pagado: e.target.checked })
                                        }
                                    />
                                    Marcar como pagado
                                </label>

                                <button className="w-full bg-[#1a0633] text-white font-bold py-4 rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 mt-4">
                                    Confirmar Papeleta
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            <div className="bg-white rounded-2xl p-4 border">
                                <div className="text-xs text-gray-400 font-bold uppercase">Total</div>
                                <div className="text-2xl font-black text-[#1a0633]">{totalPapeletas}</div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border">
                                <div className="text-xs text-gray-400 font-bold uppercase">Pagadas</div>
                                <div className="text-2xl font-black text-green-600">{totalPagadas}</div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border">
                                <div className="text-xs text-gray-400 font-bold uppercase">Pendientes</div>
                                <div className="text-2xl font-black text-red-600">{totalPendientes}</div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border">
                                <div className="text-xs text-gray-400 font-bold uppercase">Nazarenos</div>
                                <div className="text-2xl font-black text-purple-600">{totalNazarenos}</div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border">
                                <div className="text-xs text-gray-400 font-bold uppercase">Costaleros</div>
                                <div className="text-2xl font-black text-indigo-600">{totalCostaleros}</div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, nº de hermano o caja..."
                                className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-400"
                                value={busquedaTabla}
                                onChange={(e) => setBusquedաTabla(e.target.value)}
                            />

                            <select
                                value={filtroPago}
                                onChange={(e) => setFiltroPago(e.target.value)}
                                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-400"
                            >
                                <option value="Todos">Todos los pagos</option>
                                <option value="Pagados">Solo pagados</option>
                                <option value="Pendientes">Solo pendientes</option>
                            </select>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {["Todos", "Nazareno", "Costalero", "Mantilla", "Acólito", "Penitencia", "Monaguillo"].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFiltroCategoria(cat)}
                                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        filtroCategoria === cat
                                            ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                            : "bg-white text-gray-400 border border-gray-200 hover:border-purple-300"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b">
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Papeleta</th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Persona</th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Sección</th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Caja</th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Método</th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Pago</th>
                                        <th className="p-5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaVisualizacion.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b last:border-0 hover:bg-slate-50/80 transition-colors group"
                                        >
                                            <td className="p-5">
                                                <span className="font-mono text-sm font-bold bg-gray-100 px-3 py-1 rounded-lg text-gray-600">
                                                    #{String(item.papeleta_numero || 0).padStart(4, "0")}
                                                </span>
                                            </td>

                                            <td className="p-5">
                                                <div className="font-bold text-sm text-[#1a0633]">
                                                    {item.nombre} {item.apellidos}
                                                </div>

                                                {item.numero_hermano ? (
                                                    <div className="text-[10px] font-bold text-purple-400 uppercase">
                                                        Hermano nº {item.numero_hermano}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">
                                                        No hermano
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-5">
                                                <span
                                                    className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter ${
                                                        item.puesto === "Nazareno"
                                                            ? "bg-indigo-50 text-indigo-600"
                                                            : item.puesto === "Costalero"
                                                            ? "bg-amber-50 text-amber-600"
                                                            : item.puesto === "Mantilla"
                                                            ? "bg-rose-50 text-rose-600"
                                                            : item.puesto === "Monaguillo"
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {item.puesto}
                                                </span>
                                            </td>

                                            <td className="p-5">
                                                {item.numero_caja ? (
                                                    <div className="text-sm font-bold text-indigo-700">
                                                        Caja #{item.numero_caja}
                                                        {item.accion_caja && (
                                                            <div className="text-[10px] uppercase text-slate-500 mt-1">
                                                                {item.accion_caja}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin caja</span>
                                                )}
                                            </td>

                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                        {item.metodo_pago || "Efectivo"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-5">
                                                <button
                                                    onClick={() => togglePago(item.id)}
                                                    className={`px-3 py-2 rounded-full text-[10px] font-black uppercase ${
                                                        item.pagado
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {item.pagado ? "Pagado" : "Pendiente"}
                                                </button>
                                            </td>

                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => eliminarDeLista(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {listaVisualizacion.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-sm text-gray-400">
                                                No hay registros para mostrar
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