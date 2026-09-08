import { verifyToken } from '../../../utils/auth.js';
import { getProjectById, transitionProjectStatus } from '../../../services/projectService.js';
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
        if (method === 'GET') {
            const project = await getProjectById(projectId);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            // Check ownership
            const isCustomer = project.customer.userId === user.id;
            const isProvider = project.provider.userId === user.id;
            const isAssignedResource = project.resources.some((r) => r.userId === user.id);
            if (!isCustomer && !isProvider && !isAssignedResource) {
                return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access to project workspace' });
            }
            return res.status(200).json({ success: true, data: project });
        }
        if (method === 'PUT') {
            const project = await getProjectById(projectId);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            const isCustomer = project.customer.userId === user.id;
            const isProvider = project.provider.userId === user.id;
            if (!isCustomer && !isProvider) {
                return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized project status transition' });
            }
            const { status, reason } = req.body;
            if (!status) {
                return res.status(400).json({ success: false, message: 'Missing target status parameter' });
            }
            const updated = await transitionProjectStatus(projectId, user.id, status, reason);
            return res.status(200).json({
                success: true,
                data: updated,
                message: `Project transitioned to ${status} successfully`,
            });
        }
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
