import { NavLink } from 'react-router-dom';

interface NavbarItemProps {
  to: string;
  end?: boolean;
  children: React.ReactNode;
}

export function NavbarItem({ to, end = false, children }: NavbarItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `
        inline-flex items-center h-10 px-3 text-sm font-medium whitespace-nowrap rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-emerald focus:outline-none
        ${isActive
          ? 'bg-light-stone text-stone-black font-semibold'
          : 'text-stone-gray hover:text-stone-black hover:bg-light-stone/60'
        }
      `}
    >
      {children}
    </NavLink>
  );
}
