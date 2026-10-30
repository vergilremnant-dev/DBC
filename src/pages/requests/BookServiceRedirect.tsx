import { Navigate, useLocation } from 'react-router-dom';

/**
 * Legacy /book-service?providerId=&categoryId= links (appointment-style booking) now open the
 * project request form with the same professional and service. Existing bookings stay viewable
 * under /workspace/bookings.
 */
export function BookServiceRedirect() {
  const { search } = useLocation();
  const old = new URLSearchParams(search);
  const next = new URLSearchParams();
  const professional = old.get('providerId') || old.get('professional');
  if (professional) next.set('professional', professional);
  const categoryId = old.get('categoryId');
  if (categoryId && Number(categoryId) > 0) next.set('categoryId', categoryId);
  const service = old.get('service');
  if (service) next.set('service', service);
  const qs = next.toString();
  return <Navigate to={`/request-project${qs ? `?${qs}` : ''}`} replace />;
}
