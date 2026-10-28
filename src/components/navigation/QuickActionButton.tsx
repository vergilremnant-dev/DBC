import { useNavigate } from 'react-router-dom';

interface QuickActionButtonProps {
  role: string | null | undefined;
  className?: string;
  onClickCallback?: () => void;
}

export function QuickActionButton({ role, className = '', onClickCallback }: QuickActionButtonProps) {
  const navigate = useNavigate();

  const getActionConfig = () => {
    if (!role) {
      return {
        label: 'Become a Professional',
        action: () => navigate('/login'),
      };
    }
    const norm = role.toUpperCase();
    if (norm.includes('PROVIDER')) {
      return {
        label: 'Browse Leads',
        action: () => navigate('/workspace/leads'),
      };
    }
    if (norm.includes('ADMIN')) {
      return {
        label: 'Create Announcement',
        action: () => navigate('/workspace/overview'), // or trigger notification/news tab
      };
    }
    // Default to Customer
    return {
      label: 'Post Requirement',
      action: () => navigate('/book-service'),
    };
  };

  const { label, action } = getActionConfig();

  const handleTrigger = () => {
    action();
    if (onClickCallback) {
      onClickCallback();
    }
  };

  return (
    <button
      onClick={handleTrigger}
      className={`dbc-btn dbc-btn-primary tracking-wider text-2xs font-bold uppercase rounded-lg shadow-apple-sm ${className}`}
    >
      {label}
    </button>
  );
}
