import { verifyToken } from '../../../utils/auth.js';
import { getProjectAccess } from '../../../services/projectAccess.js';
import { db } from '../../../utils/db.js';
import { assignProjectResource } from '../../../services/projectService.js';
export default async function handler(req, res) {
    const method = req.method;
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }
    const { id } = req.query;
    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId) {
        return res.status(400).json({ success: false, message: 'Missing project ID parameter' });
    }
    try {
        const access = await getProjectAccess(projectId, user);
        if (!access) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        if (!access.isMember && !access.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this project' });
        }
        if (method === 'GET') {
            const resources = await db.projectResource.findMany({
                where: { projectId },
                include: { user: true },
                orderBy: { assignedAt: 'asc' },
            });
            return res.status(200).json({ success: true, data: resources });
        }
        if (method === 'POST') {
            if (!(access.isProvider)) {
                return res.status(403).json({ success: false, message: 'Only the assigned professional can assign project resources' });
            }
            const { email, role } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Missing user email to assign' });
            }
            const userToAssign = await db.user.findUnique({ where: { email } });
            if (!userToAssign) {
                return res.status(404).json({ success: false, message: 'User with requested email not found' });
            }
            const resource = await assignProjectResource(projectId, user.id, userToAssign.id, role);
            return res.status(201).json({
                success: true,
                data: resource,
                message: 'Resource assigned to project workspace successfully',
            });
        }
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
