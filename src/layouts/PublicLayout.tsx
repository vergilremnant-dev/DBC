import { Link, Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';

import { BRAND } from '../config/branding';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-warm-cream flex flex-col justify-between pb-16 lg:pb-0">
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />

      {/* Shared Persistent Footer */}
      <footer className="border-t border-light-border bg-white py-12 text-center text-stone-600 text-xs">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 {BRAND.fullName} Inc. All rights reserved.</p>
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link to="/services" className="hover:text-stone-900 hover:underline">Services</Link>
            <Link to="/search" className="hover:text-stone-900 hover:underline">Professionals</Link>
            <Link to="/know-more" className="hover:text-stone-900 hover:underline">About Us</Link>
            <Link to="/blog" className="hover:text-stone-900 hover:underline">Blog</Link>
            <Link to="/request-callback" className="hover:text-stone-900 hover:underline">Contact Support</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
