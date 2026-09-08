import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { db } from '../../../utils/db.js';
import { getProjectDocuments, addProjectDocument, deleteProjectDocument } from '../../../services/projectService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { customer: true, provider: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isCustomer = project.customer?.userId === user.id;
    const isProvider = project.provider?.userId === user.id;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this project' });
    }

    if (method === 'GET') {
      const documents = await getProjectDocuments(projectId);
      return res.status(200).json({ success: true, data: documents });
    }

    if (method === 'POST') {
      const { name, fileUrl, fileType } = req.body || {};

      if (!name || !fileUrl) {
        return res.status(400).json({ success: false, message: 'Missing required document name or fileUrl' });
      }

      const doc = await addProjectDocument(projectId, user.id, name, fileUrl, fileType || 'DOCUMENT');

      return res.status(201).json({
        success: true,
        data: doc,
        message: 'Document uploaded successfully',
      });
    }

    if (method === 'DELETE') {
      const documentId = (req.body?.documentId || req.query.documentId) as string;

      if (!documentId) {
        return res.status(400).json({ success: false, message: 'Missing documentId parameter' });
      }

      const result = await deleteProjectDocument(projectId, documentId, user.id);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Document deleted successfully',
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
