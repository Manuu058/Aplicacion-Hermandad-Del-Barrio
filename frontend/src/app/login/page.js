"use client";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        document.cookie = "userAuth=true; path=/; max-age=86400; SameSite=Lax";
        localStorage.setItem("userAuth", "true");
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("userData", JSON.stringify(data.user));
        window.location.href = "/";
      } else {
        setError(data.message || "Credenciales incorrectas");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0a0212] overflow-hidden flex items-center justify-center">
      
      {/* Fondo con gradiente radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b0764_0%,#0a0212_80%)] opacity-80"></div>

      {/* Contenedor principal sin scroll */}
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        
        {/* ESCUDO */}
        <div className="relative mb-6 transform hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-purple-500 blur-[60px] opacity-20 rounded-full"></div>
          <Image 
            src="/escudo.png" 
            alt="Escudo Hermandad" 
            width={110} 
            height={110} 
            className="drop-shadow-[0_0_20px_rgba(168,85,247,0.3)] object-contain relative z-10"
            priority
          />
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="w-full bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] border border-white/20 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#1a0633] uppercase tracking-tighter">
              Acceso <span className="text-purple-600">Privado</span>
            </h2>
            <div className="h-1 w-8 bg-purple-600 mx-auto mt-2 rounded-full"></div>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em] mt-3">
              Secretaría Virtual
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-[10px] rounded-xl border border-red-100 font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              {/* Texto gris corregido a un Slate-600 más legible y fuerte */}
              <label className="text-[10px] font-black uppercase text-slate-600 ml-4 tracking-[0.15em]">Email</label>
              <input
                type="email"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-100/50 border border-slate-200 outline-none focus:border-purple-500 focus:bg-white text-slate-900 transition-all text-sm shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              {/* Texto gris corregido a un Slate-600 más legible y fuerte */}
              <label className="text-[10px] font-black uppercase text-slate-600 ml-4 tracking-[0.15em]">Contraseña</label>
              <input
                type="password"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-100/50 border border-slate-200 outline-none focus:border-purple-500 focus:bg-white text-slate-900 transition-all text-sm shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a0633] text-white font-black py-4 rounded-2xl shadow-xl hover:bg-purple-900 active:scale-[0.98] transition-all mt-4 uppercase text-[11px] tracking-[0.3em] border border-white/10"
            >
              {loading ? "Entrando..." : "Entrar al Sistema"}
            </button>
          </form>

          <div className="mt-10 pt-4 border-t border-slate-100 text-center">
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.5em]">
              Hermandad del Barrio • MMXXVI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}