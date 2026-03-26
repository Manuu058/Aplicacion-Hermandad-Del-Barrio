"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const auth = localStorage.getItem("userAuth");
    setIsLoggedIn(auth === "true");
  }, [pathname]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isLoggedIn) return null;

  const handleLogout = () => {
    document.cookie =
      "userAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    localStorage.removeItem("userAuth");
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "/login";
  };

  const enlaces = [
    { nombre: "Inicio", ruta: "/", icono: "🏠" },
    { nombre: "Hermanos", ruta: "/hermanos", icono: "👤" },
    { nombre: "Túnicas", ruta: "/tunicas", icono: "🧥" },
    { nombre: "Inventario", ruta: "/inventario", icono: "📦" },
    { nombre: "Costaleros", ruta: "/costaleros", icono: "🧍" },
    { nombre: "Semana Santa", ruta: "/semana-santa", icono: "✝️" },
    { nombre: "Agenda", ruta: "/agenda", icono: "📅" },
    { nombre: "Actas", ruta: "/actas", icono: "📝" },
    { nombre: "Correo", ruta: "/correo", icono: "✉️" },
  ];

  const enlaceMenuStyle = (ruta) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-wide transition-all ${
      pathname === ruta || (ruta !== "/" && pathname.startsWith(ruta))
        ? "bg-purple-100 text-purple-700 shadow-sm"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-20 flex items-center justify-between gap-4">
          {/* IZQUIERDA */}
          <Link href="/" className="flex items-center gap-4 min-w-0 group">
            <div className="relative w-12 h-12 shrink-0">
              <Image
                src="/escudo.png"
                alt="Escudo de la Hermandad"
                fill
                className="object-contain"
                sizes="48px"
                priority
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-slate-900 font-black leading-none text-lg uppercase tracking-tight">
                Hermandad <span className="text-purple-700">del Barrio</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1">
                Gestión integral
              </p>
            </div>
          </Link>

          {/* DERECHA */}
          <div className="relative flex items-center gap-3" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex items-center gap-2 bg-[#1a0633] hover:bg-[#2a0a52] text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all"
            >
              <span className="text-base">{menuAbierto ? "✕" : "☰"}</span>
              <span>Menú</span>
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-red-100 transition-all"
            >
              <span>Salir</span>
            </button>

            {menuAbierto && (
              <div className="absolute top-full right-0 mt-3 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-[#1a0633] px-5 py-4">
                  <h2 className="text-white font-black uppercase tracking-widest text-xs">
                    Navegación
                  </h2>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
                    Accesos principales
                  </p>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {enlaces.map((enlace) => (
                      <Link
                        key={enlace.ruta}
                        href={enlace.ruta}
                        className={enlaceMenuStyle(enlace.ruta)}
                        onClick={() => setMenuAbierto(false)}
                      >
                        <span className="text-lg w-6 text-center">{enlace.icono}</span>
                        <span>{enlace.nombre}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 sm:hidden">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all"
                    >
                      Salir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}