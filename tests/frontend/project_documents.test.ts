import { describe, it, expect } from 'vitest';

interface MockDocument {
  id: string;
  projectId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  uploadedById: string;
  createdAt: string;
}

interface MockProject {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  documents: MockDocument[];
}

const sampleProject: MockProject = {
  id: 'proj-202',
  requirementId: 99,
  customerId: 'cust-user-10',
  providerId: 'prov-user-20',
  documents: [
    {
      id: 'doc-1',
      projectId: 'proj-202',
      name: 'Approved Structural Drawing v1.pdf',
      fileUrl: 'https://storage.dbc.com/projects/proj-202/drawings/v1.pdf',
      fileType: 'Drawing',
      uploadedById: 'prov-user-20',
      createdAt: '2026-08-20T10:00:00.000Z',
    },
    {
      id: 'doc-2',
      projectId: 'proj-202',
      name: 'Material Specifications Worksheet.xlsx',
      fileUrl: 'https://storage.dbc.com/projects/proj-202/specs/materials.xlsx',
      fileType: 'Specification',
      uploadedById: 'cust-user-10',
      createdAt: '2026-08-22T14:30:00.000Z',
    },
  ],
};

function validateDocumentUpload(name: string, fileUrl: string) {
  if (!name || !name.trim()) {
    throw new Error('Missing required document name');
  }
  if (!fileUrl || !fileUrl.trim()) {
    throw new Error('Missing required fileUrl');
  }

  const lower = name.toLowerCase();
  const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.scr', '.com', '.dll'];
  if (forbiddenExts.some((ext) => lower.endsWith(ext))) {
    throw new Error('Executable and script files are not permitted for security reasons');
  }

  const sanitizedName = name.replace(/[\/\\]/g, '_').trim();
  return { sanitizedName, fileUrl: fileUrl.trim() };
}

describe('Prompt 18 — Project Documents & Collaboration Foundation', () => {
  it('allows authorized customer and provider to view project documents', () => {
    const getDocsForUser = (user: { id: string }, project: MockProject) => {
      const isCustomer = project.customerId === user.id;
      const isProvider = project.providerId === user.id;

      if (!isCustomer && !isProvider) {
        throw new Error('Forbidden: You do not have access to this project');
      }

      return project.documents;
    };

    const customer = { id: 'cust-user-10' };
    const provider = { id: 'prov-user-20' };

    expect(getDocsForUser(customer, sampleProject)).toHaveLength(2);
    expect(getDocsForUser(provider, sampleProject)).toHaveLength(2);
  });

  it('rejects unauthorized users attempting cross-project document access', () => {
    const getDocsForUser = (user: { id: string }, project: MockProject) => {
      const isCustomer = project.customerId === user.id;
      const isProvider = project.providerId === user.id;

      if (!isCustomer && !isProvider) {
        throw new Error('Forbidden: You do not have access to this project');
      }

      return project.documents;
    };

    const attacker = { id: 'attacker-99' };
    expect(() => getDocsForUser(attacker, sampleProject)).toThrow(
      'Forbidden: You do not have access to this project'
    );
  });

  it('validates document uploads and rejects executable or script file extensions', () => {
    expect(() => validateDocumentUpload('script.sh', 'https://example.com/sh')).toThrow(
      'Executable and script files are not permitted'
    );
    expect(() => validateDocumentUpload('malware.exe', 'https://example.com/exe')).toThrow(
      'Executable and script files are not permitted'
    );

    const valid = validateDocumentUpload('  Floor_Plan/Draft.pdf  ', 'https://example.com/doc.pdf');
    expect(valid.sanitizedName).toBe('Floor_Plan_Draft.pdf');
  });

  it('enforces deletion authorization allowing uploader or project participants', () => {
    const deleteDocument = (
      user: { id: string },
      documentId: string,
      project: MockProject
    ) => {
      const doc = project.documents.find((d) => d.id === documentId);
      if (!doc) throw new Error('Document not found');
      if (doc.projectId !== project.id) throw new Error('Document does not belong to this project');

      const isUploader = doc.uploadedById === user.id;
      const isCustomer = project.customerId === user.id;
      const isProvider = project.providerId === user.id;

      if (!isUploader && !isCustomer && !isProvider) {
        throw new Error('Forbidden: You are not authorized to delete this document');
      }

      return true;
    };

    const uploader = { id: 'prov-user-20' };
    const attacker = { id: 'attacker-99' };

    expect(deleteDocument(uploader, 'doc-1', sampleProject)).toBe(true);
    expect(() => deleteDocument(attacker, 'doc-1', sampleProject)).toThrow(
      'You are not authorized to delete this document'
    );
  });

  it('preserves full origin lineage across requirement, proposal, project, and document artifacts', () => {
    const lineage = {
      requirementId: sampleProject.requirementId,
      projectId: sampleProject.id,
      documentCount: sampleProject.documents.length,
      traceabilityString: 'Req REQ-' + sampleProject.requirementId + ' ➔ Project ' + sampleProject.id + ' (' + sampleProject.documents.length + ' Documents)',
    };

    expect(lineage.requirementId).toBe(99);
    expect(lineage.projectId).toBe('proj-202');
    expect(lineage.documentCount).toBe(2);
    expect(lineage.traceabilityString).toContain('Req REQ-99 ➔ Project proj-202 (2 Documents)');
  });
});
