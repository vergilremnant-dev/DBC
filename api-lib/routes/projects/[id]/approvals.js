import { verifyToken } from '../../../utils/auth.js';
import { getProjectAccess } from '../../../services/projectAccess.js';
import { requestProjectApproval, submitProjectApproval } from '../../../services/projectService.js';
export default async function handler(req, res) {
    const method = req.method;
    if (method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }
    const { id } = req.query;
    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId) {
        return res.status(400).json({ success: false, message: 'Missing project ID parameter' });
    }
    const { action, targetType, targetId, approvalId, isApproved, remarks } = req.body;
    if (!action) {
        return res.status(400).json({ success: false, message: 'Missing action parameter (REQUEST or RESOLVE)' });
    }
    try {
        const access = await getProjectAccess(projectId, user);
        if (!access) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        if (!access.isMember && !access.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this project' });
        }
        if (action === 'REQUEST') {
            if (!(access.isCustomer || access.isProvider)) {
                return res.status(403).json({ success: false, message: 'Only project participants can request approvals' });
            }
            if (!targetType || !targetId) {
                return res.status(400).json({ success: false, message: 'Missing target details for approval request' });
            }
            const approval = await requestProjectApproval(projectId, user.id, targetType, targetId);
            return res.status(201).json({
                success: true,
                data: approval,
                message: 'Approval request generated successfully',
            });
        }
        if (action === 'RESOLVE') {
            if (!approvalId || isApproved === undefined) {
                return res.status(400).json({ success: false, message: 'Missing approvalId or signature option' });
            }
            const approval = await submitProjectApproval(approvalId, user.id, isApproved, remarks);
            return res.status(200).json({
                success: true,
                data: approval,
                message: 'Approval request resolved successfully',
            });
        }
        return res.status(400).json({ success: false, message: 'Invalid action parameter value' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
