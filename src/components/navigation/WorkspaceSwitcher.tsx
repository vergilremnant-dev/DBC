import { useNavigate } from 'react-router-dom';

interface WorkspaceSwitcherProps {
  role: string | undefined;
  className?: string;
}

export function WorkspaceSwitcher({ role, className = '' }: WorkspaceSwitcherProps) {
  const navigate = useNavigate();

  if (!role) return null;

  const norm = role.toUpperCase();
  const isAdmin = norm.includes('ADMIN');
  const isProvider = norm.includes('PROVIDER');

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {isAdmin ? (
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="dbc-btn dbc-btn-secondary py-1.5 px-3 rounded-lg text-3xs uppercase font-bold tracking-wider hover:bg-light-stone transition"
        >
          Admin Console
        </button>
      ) : isProvider ? (
        <button
          onClick={() => navigate('/workspace/dashboard')}
          className="dbc-btn dbc-btn-secondary py-1.5 px-3 rounded-lg text-3xs uppercase font-bold tracking-wider hover:bg-light-stone transition"
        >
          Partner Console
        </button>
      ) : (
        <button
          onClick={() => navigate('/workspace/overview')}
          className="dbc-btn dbc-btn-secondary py-1.5 px-3 rounded-lg text-3xs uppercase font-bold tracking-wider hover:bg-light-stone transition"
        >
          Customer Area
        </button>
      )}
    </div>
  );
}
