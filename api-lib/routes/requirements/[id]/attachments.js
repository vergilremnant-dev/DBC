import { verifyToken } from '../../../utils/auth.js';
import { addRequirementAttachment } from '../../../services/requirementService.js';
import { db } from '../../../utils/db.js';
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
    const paramId = Array.isArray(id) ? id[0] : id;
    if (!paramId) {
        return res.status(400).json({ success: false, message: 'Missing requirement ID parameter' });
    }
    const { fileName, fileUrl, fileType } = req.body;
    if (!fileName || !fileUrl || !fileType) {
        return res.status(400).json({ success: false, message: 'Missing attachment meta parameters' });
    }
    try {
        const requirementId = Number(paramId);
        if (!Number.isInteger(requirementId)) {
            return res.status(400).json({ success: false, message: 'Invalid requirement ID format' });
        }
        const requirement = await db.requirement.findUnique({
            where: { id: requirementId },
            select: { customer: { select: { userId: true } } },
        });
        if (!requirement) {
            return res.status(404).json({ success: false, message: 'Requirement not found' });
        }
        if (requirement.customer?.userId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Forbidden: Only the requirement owner can add attachments' });
        }
        const attachment = await addRequirementAttachment(Number(paramId), fileName, fileUrl, fileType);
        return res.status(201).json({
            success: true,
            data: attachment,
            message: 'Attachment mapped successfully',
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
