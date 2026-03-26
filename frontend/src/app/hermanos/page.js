"use client"
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export default function HermanosPage() {
    const [hermanos, setHermanos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const [isClient, setIsClient] = useState(false);

    // --- ESTADOS PARA PAGOS ---
    const [verPagos, setVerPagos] = useState(false);
    const [listaPagos, setListaPagos] = useState([]);
    const [anioActual] = useState(new Date().getFullYear());
    const [filtroPagos, setFiltroPagos] = useState("todos");

    // Estado para controlar el modal de domiciliación
    const [hermanoBancario, setHermanoBancario] = useState(null);

    const [formDatos, setFormDatos] = useState({
        nombre: '',
        apellidos: '',
        dni: '',
        telefono: '',
        fecha_nacimiento: '',
        direccion: '',
        email: '',
        fecha_alta: '',
        estado: '',
        metodo_pago: 'Efectivo',
        iban: '',
        titular_cuenta: ''
    });

    useEffect(() => {
        setIsClient(true);
        cargarHermanos();
    }, []);

    const cargarHermanos = async () => {
        try {
            const res = await fetch("http://localhost:3001/hermanos");
            if (!res.ok) throw new Error("Error en la respuesta");
            const data = await res.json();
            setHermanos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando hermanos:", error);
        }
    };

    // --- FUNCIONES DE PAGOS ---
    const abrirGestionPagos = async () => {
        try {
            const res = await fetch(`http://localhost:3001/pagos/estado/${anioActual}`);

            if (!res.ok) {
                throw new Error("Error en la respuesta del servidor");
            }

            const data = await res.json();
            console.log("Respuesta pagos:", data);

            setListaPagos(Array.isArray(data) ? data : []);
            setVerPagos(true);
            setBusqueda("");
            setFiltroPagos("todos");
        } catch (error) {
            console.error("Error al cargar pagos:", error);
            setListaPagos([]);
            alert("Error al cargar la lista de pagos");
        }
    };

    const togglePago = async (hermanoId) => {
        try {
            const res = await fetch("http://localhost:3001/pagos/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hermano_id: hermanoId, anio: anioActual })
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Error backend toggle:", data);
                alert(data.error || "Error al procesar el pago");
                return;
            }

            setListaPagos(prev =>
                Array.isArray(prev)
                    ? prev.map(h =>
                        h.id === hermanoId || h.hermano_id === hermanoId
                            ? { ...h, pagado: data.pagado }
                            : h
                    )
                    : []
            );
        } catch (error) {
            console.error("Error frontend toggle:", error);
            alert("Error al procesar el pago");
        }
    };

    const guardarHermano = async (e) => {
        e.preventDefault();

        const url = editandoId
            ? `http://localhost:3001/hermanos/${editandoId}`
            : "http://localhost:3001/hermanos";

        const metodo = editandoId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formDatos)
            });

            if (res.ok) {
                alert(editandoId ? "✅ Actualizado con éxito" : "✅ Registrado con éxito");
                cancelarEdicion();
                cargarHermanos();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(errorData.error || "❌ Error al guardar el hermano");
            }
        } catch (error) {
            alert("❌ Error al conectar con el servidor");
        }
    };

    const actualizarDatosBancarios = async () => {
        try {
            const res = await fetch(`http://localhost:3001/hermanos/${hermanoBancario.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(hermanoBancario)
            });

            if (res.ok) {
                alert("✅ Datos bancarios actualizados");
                setHermanoBancario(null);
                cargarHermanos();
            } else {
                alert("❌ No se pudieron actualizar los datos bancarios");
            }
        } catch (error) {
            alert("❌ Error al guardar datos bancarios");
        }
    };

    const eliminarHermano = async (id) => {
        if (window.confirm("¿Seguro que quieres borrar a este hermano?")) {
            try {
                const res = await fetch(`http://localhost:3001/hermanos/${id}`, {
                    method: "DELETE"
                });
                if (res.ok) cargarHermanos();
            } catch (error) {
                console.error("Error al eliminar:", error);
            }
        }
    };

    const clickEditar = (hermano) => {
        setEditandoId(hermano.id);
        setFormDatos({
                nombre: hermano.nombre || '',
                apellidos: hermano.apellidos || '',
                dni: hermano.dni || '',
                telefono: hermano.telefono || '',
                fecha_nacimiento: hermano.fecha_nacimiento ? hermano.fecha_nacimiento.split('T')[0] : '',
                direccion: hermano.direccion || '',
                email: hermano.email || '',
                fecha_alta: hermano.fecha_alta ? hermano.fecha_alta.split('T')[0] : '',
                estado: hermano.estado || '',
                metodo_pago: hermano.metodo_pago || 'Efectivo',
                iban: hermano.iban || '',
                titular_cuenta: hermano.titular_cuenta || ''
        });
    };

    const cancelarEdicion = () => {
        setEditandoId(null);
       setFormDatos({
            nombre: '',
            apellidos: '',
            dni: '',
            telefono: '',
            fecha_nacimiento: '',
            direccion: '',
            email: '',
            fecha_alta: '',
            estado: '',
            metodo_pago: 'Efectivo',
            iban: '',
            titular_cuenta: ''
        });
    };

    const descargarBlob = (blob, nombreArchivo) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const cargarImagenComoBase64 = (src) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
            img.src = src;
        });

    const añadirPiePDF = (doc) => {
        const totalPages = doc.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setDrawColor(210);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text("Hermandad - Exportación generada desde el sistema", 14, pageHeight - 8);
            doc.text(`Página ${i} de ${totalPages}`, pageWidth - 38, pageHeight - 8);
        }
    };

    const autoAjustarColumnasExcel = (worksheet) => {
        worksheet.columns.forEach((column) => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const value = cell.value ? cell.value.toString() : "";
                maxLength = Math.max(maxLength, value.length + 2);
            });
            column.width = Math.min(maxLength, 35);
        });
    };

    const exportarPDF = async () => {
        if (hermanosFiltrados.length === 0) {
            alert("No hay datos para exportar");
            return;
        }

        const doc = new jsPDF("landscape");
        const pageWidth = doc.internal.pageSize.getWidth();

        try {
            const logoBase64 = await cargarImagenComoBase64("/escudo.png");
            doc.addImage(logoBase64, "PNG", 14, 10, 22, 22);
        } catch (error) {
            console.warn("No se pudo cargar el logo para el PDF");
        }

        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text("Hermandad del Barrio", 42, 18);

        doc.setFontSize(13);
        doc.setTextColor(100, 100, 100);
        doc.text(
            verPagos ? `Listado de cuotas ${anioActual}` : "Listado general de hermanos",
            42,
            26
        );

        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.8);
        doc.line(14, 36, pageWidth - 14, 36);

        if (!verPagos) {
            const filas = hermanosFiltrados.map((h) => [
                h.numero_hermano || "-",
                `${h.nombre || ""} ${h.apellidos || ""}`.trim(),
                h.dni || "-",
                h.telefono || "-",
                h.email || "-",
                h.direccion || "-",
                h.metodo_pago || "-",
                h.iban || "-",
                h.titular_cuenta || "-",
                h.estado || "-",
                h.fecha_alta ? h.fecha_alta.split("T")[0] : "-",
                h.fecha_nacimiento ? h.fecha_nacimiento.split("T")[0] : "-"
            ]);

            autoTable(doc, {
                startY: 42,
                head: [[
                    "Nº",
                    "Hermano",
                    "DNI",
                    "Teléfono",
                    "Email",
                    "Dirección",
                    "Cobro",
                    "IBAN",
                    "Titular",
                    "Estado",
                    "F. Alta",
                    "F. Nacimiento"
                ]],
                body: filas,
                headStyles: {
                    fillColor: [49, 46, 129],
                    textColor: 255,
                    fontStyle: "bold"
                },
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    overflow: "linebreak"
                },
                columnStyles: {
                    1: { cellWidth: 28 },
                    4: { cellWidth: 35 },
                    5: { cellWidth: 42 },
                    7: { cellWidth: 30 },
                    8: { cellWidth: 28 },
                    12: { cellWidth: 30 }
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                },
                margin: { left: 10, right: 10 }
            });

            añadirPiePDF(doc);
            doc.save("hermanos.pdf");
        } else {
            const filas = hermanosFiltrados.map((h) => [
                h.numero_hermano || "-",
                `${h.nombre || ""} ${h.apellidos || ""}`.trim(),
                h.dni || "-",
                h.telefono || "-",
                h.email || "-",
                h.direccion || "-",
                h.metodo_pago === "Domiciliado"
                    ? "Domiciliado / Pagado"
                    : h.pagado
                        ? "Pagado"
                        : "Pendiente"
            ]);

            autoTable(doc, {
                startY: 42,
                head: [[
                    "Nº",
                    "Hermano",
                    "DNI",
                    "Teléfono",
                    "Email",
                    "Dirección",
                    "Estado cuota"
                ]],
                body: filas,
                headStyles: {
                    fillColor: [5, 150, 105],
                    textColor: 255,
                    fontStyle: "bold"
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    overflow: "linebreak"
                },
                columnStyles: {
                    1: { cellWidth: 45 },
                    4: { cellWidth: 55 },
                    5: { cellWidth: 70 }
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                },
                margin: { left: 10, right: 10 }
            });

            añadirPiePDF(doc);
            doc.save(`cuotas_${anioActual}.pdf`);
        }
    };

    const exportarExcel = async () => {
        if (hermanosFiltrados.length === 0) {
            alert("No hay datos para exportar");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(verPagos ? "Cuotas" : "Hermanos");

        let columnas = [];
        let filas = [];

        if (!verPagos) {
            columnas = [
                { header: "Nº Hermano", key: "numero_hermano" },
                { header: "Nombre", key: "nombre" },
                { header: "Apellidos", key: "apellidos" },
                { header: "DNI", key: "dni" },
                { header: "Teléfono", key: "telefono" },
                { header: "Email", key: "email" },
                { header: "Dirección", key: "direccion" },
                { header: "Método de pago", key: "metodo_pago" },
                { header: "IBAN", key: "iban" },
                { header: "Titular cuenta", key: "titular_cuenta" },
                { header: "Estado", key: "estado" },
                { header: "Fecha alta", key: "fecha_alta" },
                { header: "Fecha nacimiento", key: "fecha_nacimiento" }
            ];

            filas = hermanosFiltrados.map((h) => ({
                numero_hermano: h.numero_hermano || "",
                nombre: h.nombre || "",
                apellidos: h.apellidos || "",
                dni: h.dni || "",
                telefono: h.telefono || "",
                email: h.email || "",
                direccion: h.direccion || "",
                estado_cuota:
                    h.metodo_pago === "Domiciliado"
                        ? "Domiciliado / Pagado"
                        : h.pagado
                            ? "Pagado"
                            : "Pendiente"
            }));
        } else {
            columnas = [
                { header: "Nº Hermano", key: "numero_hermano" },
                { header: "Nombre", key: "nombre" },
                { header: "Apellidos", key: "apellidos" },
                { header: "DNI", key: "dni" },
                { header: "Teléfono", key: "telefono" },
                { header: "Email", key: "email" },
                { header: "Dirección", key: "direccion" },
                { header: "Estado cuota", key: "estado_cuota" }
            ];

            filas = hermanosFiltrados.map((h) => ({
                numero_hermano: h.numero_hermano || "",
                nombre: h.nombre || "",
                apellidos: h.apellidos || "",
                dni: h.dni || "",
                telefono: h.telefono || "",
                email: h.email || "",
                direccion: h.direccion || "",
                estado_cuota: h.pagado ? "Pagado" : "Pendiente"
            }));
        }

        worksheet.columns = columnas;

        const titulo = verPagos
            ? `Listado de cuotas ${anioActual}`
            : "Listado general de hermanos";

        worksheet.mergeCells(1, 1, 1, columnas.length);
        const tituloCell = worksheet.getCell(1, 1);
        tituloCell.value = titulo;
        tituloCell.font = {
            bold: true,
            size: 16,
            color: { argb: "FFFFFFFF" }
        };
        tituloCell.alignment = {
            vertical: "middle",
            horizontal: "center"
        };
        tituloCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: verPagos ? "059669" : "312E81" }
        };

        worksheet.getRow(1).height = 24;
        worksheet.getRow(2).values = [];
        worksheet.getRow(3).values = columnas.map((c) => c.header);
        filas.forEach((fila) => worksheet.addRow(fila));

        const headerRow = worksheet.getRow(3);
        headerRow.font = {
            bold: true,
            color: { argb: "FFFFFFFF" }
        };
        headerRow.alignment = {
            vertical: "middle",
            horizontal: "center"
        };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1F2937" }
        };

        headerRow.eachCell((cell) => {
            cell.border = {
                top: { style: "thin", color: { argb: "D1D5DB" } },
                left: { style: "thin", color: { argb: "D1D5DB" } },
                bottom: { style: "thin", color: { argb: "D1D5DB" } },
                right: { style: "thin", color: { argb: "D1D5DB" } }
            };
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 4) {
                row.eachCell((cell) => {
                    cell.alignment = {
                        vertical: "middle",
                        horizontal: "left",
                        wrapText: true
                    };

                    cell.border = {
                        bottom: { style: "thin", color: { argb: "E5E7EB" } }
                    };

                    if (rowNumber % 2 === 0) {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "F9FAFB" }
                        };
                    }
                });
            }
        });

        const estadoColumnIndex =
            columnas.findIndex((col) => col.key === "estado" || col.key === "estado_cuota") + 1;

        if (estadoColumnIndex > 0) {
            for (let i = 4; i <= worksheet.rowCount; i++) {
                const cell = worksheet.getRow(i).getCell(estadoColumnIndex);
                const valor = (cell.value || "").toString().toLowerCase();

                if (valor.includes("activo") || valor.includes("pagado")) {
                    cell.font = { bold: true, color: { argb: "166534" } };
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "DCFCE7" }
                    };
                } else if (valor.includes("pendiente")) {
                    cell.font = { bold: true, color: { argb: "991B1B" } };
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FEE2E2" }
                    };
                } else if (valor.includes("baja")) {
                    cell.font = { bold: true, color: { argb: "92400E" } };
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FEF3C7" }
                    };
                }
            }
        }

        worksheet.views = [{ state: "frozen", ySplit: 3 }];
        worksheet.autoFilter = {
            from: { row: 3, column: 1 },
            to: { row: 3, column: columnas.length }
        };

        autoAjustarColumnasExcel(worksheet);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        descargarBlob(blob, verPagos ? `cuotas_${anioActual}.xlsx` : "hermanos.xlsx");
    };

    const hermanosFiltrados = !verPagos
        ? (Array.isArray(hermanos)
            ? hermanos.filter(h =>
                `${h.nombre} ${h.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
                (h.dni && h.dni.toLowerCase().includes(busqueda.toLowerCase()))
            )
            : [])
        : (Array.isArray(listaPagos)
            ? listaPagos
                .filter(h =>
                    `${h.nombre} ${h.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
                    (h.numero_hermano && h.numero_hermano.toString().includes(busqueda))
                )
                .filter(h => {
                    if (filtroPagos === "pendientes") return !h.pagado;
                    if (filtroPagos === "pagados") return h.pagado;
                    return true;
                })
            : []);

    if (!isClient) return null;

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
    <div className="bg-[#1b0038] rounded-[28px] shadow-xl px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* IZQUIERDA (TÍTULO) */}
            <div>
                <h1 className="text-[40px] leading-none font-black uppercase text-[#c86bff]">
                    {verPagos ? (
                        <>CUOTAS {anioActual}</>
                    ) : (
                        <>
                            GESTIÓN DE
                            <br />
                            HERMANOS
                        </>
                    )}
                </h1>

                <p className="text-white text-lg mt-4">
                    {verPagos
                        ? "Control y gestión de cuotas"
                        : "Registro y administración de hermanos"}
                </p>
            </div>

            {/* DERECHA (BOTONES) */}
            <div className="flex flex-wrap gap-4">

                <button
                    onClick={exportarExcel}
                    className="bg-[#12d39c] hover:bg-[#0fbe8d] text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition-all"
                >
                    EXPORTAR EXCEL
                </button>

                <button
                    onClick={exportarPDF}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition-all"
                >
                    EXPORTAR PDF
                </button>

                {/* ESTE ES TU BOTÓN ORIGINAL */}
                <button
                    onClick={verPagos ? () => setVerPagos(false) : abrirGestionPagos}
                    className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 ${
                        verPagos ? "bg-gray-800 text-white" : "bg-emerald-600 text-white"
                    }`}
                >
                    {verPagos ? "⬅️ VOLVER A LISTADO" : "💳 GESTIONAR PAGOS ANUALES"}
                </button>

            </div>
        </div>
    </div>
</div>

                {!verPagos ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1">
                            <form
                                onSubmit={guardarHermano}
                                className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-3 sticky top-8 text-black"
                            >
                                <h2 className="text-xl font-bold text-gray-800 mb-2 italic border-b pb-2">
                                    {editandoId ? "📝 Editando" : "➕ Nuevo Alta"}
                                </h2>


                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={formDatos.nombre}
                                    onChange={e => setFormDatos({ ...formDatos, nombre: e.target.value })}
                                    className="border p-2 rounded outline-indigo-500"
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="Apellidos"
                                    value={formDatos.apellidos}
                                    onChange={e => setFormDatos({ ...formDatos, apellidos: e.target.value })}
                                    className="border p-2 rounded outline-indigo-500"
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="DNI"
                                    value={formDatos.dni}
                                    onChange={e => setFormDatos({ ...formDatos, dni: e.target.value })}
                                    className="border p-2 rounded outline-indigo-500"
                                />

                                <label className="text-[10px] font-bold text-gray-400 uppercase mt-2">Estado</label>
                                <select
                                    value={formDatos.estado}
                                    onChange={e => setFormDatos({ ...formDatos, estado: e.target.value })}
                                    className="border p-2 rounded bg-white outline-indigo-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Activo">Activo</option>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Baja">Baja</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Teléfono"
                                    value={formDatos.telefono}
                                    onChange={e => setFormDatos({ ...formDatos, telefono: e.target.value })}
                                    className="border p-2 rounded outline-indigo-500"
                                />

                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formDatos.email}
                                    onChange={e => setFormDatos({ ...formDatos, email: e.target.value })}
                                    className="border p-2 rounded outline-indigo-500"
                                />

                                <label className="text-[10px] font-bold text-gray-400 uppercase mt-2">F. Nacimiento</label>
                                <input
                                    type="date"
                                    value={formDatos.fecha_nacimiento}
                                    onChange={e => setFormDatos({ ...formDatos, fecha_nacimiento: e.target.value })}
                                    className="border p-2 rounded outline-indigo-500"
                                />

                                <label className="text-[10px] font-bold text-gray-400 uppercase mt-2">Dirección</label>
                                <input
                                    type="text"
                                    placeholder="Dirección"
                                    value={formDatos.direccion}
                                    onChange={e => setFormDatos({ ...formDatos, direccion: e.target.value })}
                                    className="border p-2 rounded outline-indigo-500"
                                    required
                                />

                                <button className={`mt-4 ${editandoId ? "bg-amber-500" : "bg-indigo-900"} text-white font-black p-3 rounded-lg transition hover:opacity-90 shadow-md`}>
                                    {editandoId ? "Guardar Cambios" : "Registrar Hermano"}
                                </button>

                                {editandoId && (
                                    <button
                                        type="button"
                                        onClick={cancelarEdicion}
                                        className="bg-gray-200 text-gray-700 p-2 rounded font-bold text-xs uppercase"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </form>
                        </div>

                        <div className="lg:col-span-3">
                            <div className="relative mb-6">
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar por nombre, apellidos o DNI..."
                                    className="w-full p-4 pl-12 border-2 border-indigo-100 rounded-2xl text-black shadow-sm focus:border-indigo-500 outline-none transition-all"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                                <span className="absolute left-4 top-4 opacity-30">🔎</span>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl overflow-x-auto border border-gray-200">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead className="bg-indigo-950 text-white text-[10px] uppercase tracking-widest">
                                        <tr>
                                            <th className="p-4">Nº</th>
                                            <th className="p-4">Hermano</th>
                                            <th className="p-4">DNI</th>
                                            <th className="p-4">Cobro</th>
                                            <th className="p-4">Estado</th>
                                            <th className="p-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {hermanosFiltrados.map((h) => (
                                            <tr key={h.id} className="border-b hover:bg-indigo-50/50 transition-colors">
                                                <td className="p-4 text-indigo-900 font-black">{h.numero_hermano || "-"}</td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900 uppercase text-xs">{h.nombre} {h.apellidos}</div>
                                                    <div className="text-[10px] text-gray-400">{h.direccion || "Sin dirección"}</div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-600">{h.dni || "---"}</td>
                                                <td className="p-4">
                                                    <div className={`text-[10px] font-bold ${h.metodo_pago === 'Domiciliado' ? 'text-blue-600' : 'text-gray-500'}`}>
                                                        {h.metodo_pago === 'Domiciliado' ? '🏛️ DOMICILIADO' : '💵 EFECTIVO'}
                                                    </div>
                                                    {h.iban && <div className="text-[9px] font-mono text-gray-400 italic">...{h.iban.slice(-4)}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                                        h.estado === 'Activo'
                                                            ? "bg-green-100 text-green-700"
                                                            : h.estado === 'Baja'
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                        {h.estado || "Pendiente"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => setHermanoBancario(h)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all shadow-sm font-bold text-[10px]"
                                                        >
                                                            BANCO
                                                        </button>
                                                        <button
                                                            onClick={() => clickEditar(h)}
                                                            className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-3 py-2 rounded-lg transition-all shadow-sm font-bold text-[10px]"
                                                        >
                                                            EDITAR
                                                        </button>
                                                        <button
                                                            onClick={() => eliminarHermano(h.id)}
                                                            className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-3 py-2 rounded-lg transition-all font-bold text-[10px]"
                                                        >
                                                            BORRAR
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                        <div className="relative mb-6">
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nombre o número para cobrar cuota..."
                                className="w-full p-4 pl-12 border-2 border-emerald-100 rounded-xl outline-none focus:border-emerald-500 transition-all text-black"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                            <span className="absolute left-4 top-4 text-xl">🔎</span>
                        </div>
                        <div className="flex gap-3 mb-6 flex-wrap">
                            <button
                                onClick={() => setFiltroPagos("todos")}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                                    filtroPagos === "todos"
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                TODOS
                            </button>

                            <button
                                onClick={() => setFiltroPagos("pendientes")}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                                    filtroPagos === "pendientes"
                                        ? "bg-red-600 text-white"
                                        : "bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                            >
                                SOLO PENDIENTES ❌
                            </button>

                            <button
                                onClick={() => setFiltroPagos("pagados")}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                                    filtroPagos === "pagados"
                                        ? "bg-green-600 text-white"
                                        : "bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                            >
                                SOLO PAGADOS ✅
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-emerald-50 text-emerald-900 text-xs font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4 rounded-l-lg">Nº</th>
                                        <th className="p-4">Hermano</th>
                                        <th className="p-4 text-center">Estado Cuota</th>
                                        <th className="p-4 text-right rounded-r-lg">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hermanosFiltrados.map((h) => (
                                        <tr key={h.id} className="border-b hover:bg-emerald-50/30 transition-colors">
                                            <td className="p-4 font-bold text-emerald-700">{h.numero_hermano}</td>
                                            <td className="p-4">
                                                <div className="font-bold uppercase text-xs text-black">{h.nombre} {h.apellidos}</div>
                                                <div className="text-[10px] text-gray-400">{h.dni || "S/D"}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={`px-4 py-1 rounded-full text-[10px] font-black tracking-tighter ${
                                                        h.metodo_pago === "Domiciliado"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : h.pagado
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {h.metodo_pago === "Domiciliado"
                                                        ? "DOMICILIADO ✅"
                                                        : h.pagado
                                                            ? "PAGADO ✅"
                                                            : "PENDIENTE ❌"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        if (h.metodo_pago === "Domiciliado") return;
                                                        togglePago(h.id);
                                                    }}
                                                    disabled={h.metodo_pago === "Domiciliado"}
                                                    className={`px-4 py-2 rounded-lg font-bold text-[10px] transition-all ${
                                                        h.metodo_pago === "Domiciliado"
                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                            : h.pagado
                                                                ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                                                    }`}
                                                >
                                                    {h.metodo_pago === "Domiciliado"
                                                        ? "DOMICILIADO"
                                                        : h.pagado
                                                            ? "ANULAR PAGO"
                                                            : "REGISTRAR PAGO"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {hermanoBancario && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-black border border-gray-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-2xl font-black text-indigo-950">🏦 Datos Bancarios</h2>
                            <button onClick={() => setHermanoBancario(null)} className="text-gray-400 hover:text-black">✕</button>
                        </div>

                        <div className="mb-6 bg-indigo-50 p-3 rounded-lg">
                            <p className="text-[10px] text-indigo-400 uppercase font-bold">Hermano seleccionado</p>
                            <p className="font-bold text-indigo-900">{hermanoBancario.nombre} {hermanoBancario.apellidos}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Método de Cobro</label>
                                <select
                                    className="w-full border p-3 rounded-lg bg-gray-50 mt-1 outline-indigo-500"
                                    value={hermanoBancario.metodo_pago || 'Efectivo'}
                                    onChange={(e) => setHermanoBancario({ ...hermanoBancario, metodo_pago: e.target.value })}
                                >
                                    <option value="Efectivo">💵 Efectivo / Ventanilla</option>
                                    <option value="Domiciliado">🏛️ Domiciliación Bancaria (SEPA)</option>
                                </select>
                            </div>

                            {hermanoBancario.metodo_pago === 'Domiciliado' && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Titular de la Cuenta</label>
                                        <input
                                            type="text"
                                            className="w-full border p-3 rounded-lg mt-1 outline-indigo-500"
                                            placeholder="Nombre completo del titular"
                                            value={hermanoBancario.titular_cuenta || ''}
                                            onChange={(e) => setHermanoBancario({ ...hermanoBancario, titular_cuenta: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">IBAN de la Cuenta</label>
                                        <input
                                            type="text"
                                            className="w-full border p-3 rounded-lg mt-1 font-mono outline-indigo-500 uppercase"
                                            placeholder="ES00 0000 0000 ..."
                                            value={hermanoBancario.iban || ''}
                                            onChange={(e) => setHermanoBancario({ ...hermanoBancario, iban: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setHermanoBancario(null)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 p-3 rounded-xl font-bold text-gray-600 transition-all"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={actualizarDatosBancarios}
                                    className="flex-1 bg-indigo-900 hover:bg-indigo-800 text-white p-3 rounded-xl font-bold shadow-lg transition-all"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}