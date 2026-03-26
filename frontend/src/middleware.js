import { NextResponse } from 'next/server';

export function middleware(request) {
  const authCookie = request.cookies.get('userAuth');
  const { pathname } = request.nextUrl;

  // 1. RUTAS PÚBLICAS: Permitimos entrar siempre al Login y a la Raíz
  // Añadimos '/login' para que no te bloquee la pantalla de acceso
  if (pathname === '/' || pathname === '/login') {
    return NextResponse.next();
  }

  // 2. PROTECCIÓN: Si intenta ir a rutas privadas y NO hay cookie
  if (!authCookie) {
    console.log("🛑 BLOQUEADO: Redirigiendo al login desde " + pathname);
    
    // Lo mandamos a la página de login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Si tiene la cookie, le dejamos pasar a cualquier ruta del matcher
  return NextResponse.next();
}

// Configuración de rutas vigiladas
export const config = {
  matcher: [
    '/hermanos/:path*',
    '/tunicas/:path*',
    '/inventario/:path*',
    '/costaleros/:path*',
    '/agenda/:path*',
    '/semana-santa/:path*',
    '/historial/:path*',
    '/dashboard/:path*' // He añadido dashboard por si acaso lo usas
  ],
};