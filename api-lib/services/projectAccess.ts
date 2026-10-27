import { db } from '../utils/db.js';

/**
 * Resolves the caller's relationship to a project from the database. Used by
 * project sub-routes so access is decided server-side from ownership, never
 * from anything the client sends.
 */
export interface ProjectAccess {
  isCustomer: boolean;
  isProvider: boolean;
  isResource: boolean;
  isAdmin: boolean;
  /** Customer, assigned professional or assigned resource. */
  isMember: boolean;
}

type ProjectLookup = Pick<typeof db, 'project'>;

export async function getProjectAccess(
  projectId: string,
  user: { id: string; role: string },
  client: ProjectLookup = db
): Promise<ProjectAccess | null> {
  const project = await client.project.findUnique({
    where: { id: projectId },
    select: {
      customer: { select: { userId: true } },
      provider: { select: { userId: true } },
      resources: { select: { userId: true } },
    },
  });
  if (!project) return null;

  const isCustomer = project.customer?.userId === user.id;
  const isProvider = project.provider?.userId === user.id;
  const isResource = (project.resources || []).some((r: { userId: string }) => r.userId === user.id);
  return {
    isCustomer,
    isProvider,
    isResource,
    isAdmin: user.role === 'ADMIN',
    isMember: isCustomer || isProvider || isResource,
  };
}
