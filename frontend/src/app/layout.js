import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Hermandad del Barrio - Gestión",
  description: "Sistema de gestión de túnicas y hermanos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#f4ebf8] min-h-screen">
        
        {/* Barra de navegación global */}
        <Navbar />

        {/* Contenedor principal para todas las páginas */}
        <main className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </main>

        <footer className="text-center py-10 text-purple-300 text-xs font-bold uppercase tracking-widest">
          © 2026 Hermandad del Barrio • Sistema de Secretaría
        </footer>
        
      </body>
    </html>
  );
}