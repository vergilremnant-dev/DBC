import { Outlet } from 'react-router-dom';
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
          <div className="flex gap-4">
            <span className="hover:text-stone-900 cursor-pointer">About Us</span>
            <span className="hover:text-stone-900 cursor-pointer">Contact Support</span>
            <span className="hover:text-stone-900 cursor-pointer">Terms & Conditions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
