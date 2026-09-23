import { mobileProfessionalProjectExecutionService } from '../../services/mobileProfessionalProjectExecutionService.js';
import type { MobileDocumentItem } from '../../types/projectExecutionMobileTypes.js';

export interface ProfessionalProjectDocumentsScreenProps {
  projectId: string;
}

export class ProfessionalProjectDocumentsScreenController {
  private props: ProfessionalProjectDocumentsScreenProps;
  private state: {
    documents: MobileDocumentItem[];
    isLoading: boolean;
    isUploading: boolean;
    showUploadModal: boolean;
    uploadForm: { name: string; fileUrl: string; fileType: string };
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: ProfessionalProjectDocumentsScreenProps) {
    this.props = props;
    this.state = {
      documents: [],
      isLoading: true,
      isUploading: false,
      showUploadModal: false,
      uploadForm: { name: '', fileUrl: '', fileType: 'PDF' },
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadDocuments();
  }

  async loadDocuments(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalProjectExecutionService.getProjectDocuments(this.props.projectId);
      this.state.documents = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load project documents';
    } finally {
      this.state.isLoading = false;
    }
  }

  openUploadModal(): void {
    this.state.showUploadModal = true;
    this.state.uploadForm = { name: '', fileUrl: '', fileType: 'PDF' };
    this.state.error = null;
  }

  closeUploadModal(): void {
    this.state.showUploadModal = false;
  }

  updateUploadForm(field: keyof typeof this.state.uploadForm, value: string): void {
    this.state.uploadForm[field] = value;
  }

  async uploadDocument(): Promise<void> {
    const { name, fileUrl, fileType } = this.state.uploadForm;
    if (!name.trim() || !fileUrl.trim()) {
      this.state.error = 'Document name and file URL are required.';
      return;
    }

    if (this.state.isUploading) return;
    this.state.isUploading = true;
    this.state.error = null;

    try {
      await mobileProfessionalProjectExecutionService.uploadDocument(this.props.projectId, {
        name,
        fileUrl,
        fileType,
      });
      this.state.showUploadModal = false;
      await this.loadDocuments();
      this.state.statusMessage = 'Technical document uploaded successfully.';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to upload document';
    } finally {
      this.state.isUploading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalProjectDocumentsScreen(
  controller: ProfessionalProjectDocumentsScreenController
): string {
  const { documents, isLoading, isUploading, showUploadModal, uploadForm, error, statusMessage } =
    controller.getState();

  if (isLoading) {
    return `
      <div class="p-6 text-center text-xs font-semibold text-stone-500">
        Loading Project Repository...
      </div>
    `;
  }

  return `
    <div class="space-y-4 select-none">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Project Documents (${documents.length})</h2>
        <button
          onclick="controller.openUploadModal()"
          class="min-h-[44px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
        >
          + Upload File
        </button>
      </div>

      ${
        error
          ? `
        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
          ${error}
        </div>
      `
          : ''
      }

      ${
        statusMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${statusMessage}
        </div>
      `
          : ''
      }

      ${
        documents.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📁</span>
          <p class="text-xs font-bold text-stone-800">No project documents uploaded yet.</p>
          <p class="text-[11px] text-stone-500 font-medium">Upload blueprints, structural certificates, or site inspection reports here.</p>
        </div>
      `
          : `
        <div class="space-y-2.5">
          ${documents
            .map(
              (doc) => `
            <div class="p-3.5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-center text-xs font-black shrink-0">
                  ${doc.fileType || 'DOC'}
                </div>
                <div>
                  <h4 class="text-xs font-bold text-stone-900 line-clamp-1">${doc.name}</h4>
                  <span class="text-[10px] text-stone-400 font-semibold block">Uploaded: ${doc.formattedDate}</span>
                </div>
              </div>

              <a
                href="${doc.fileUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="min-h-[44px] min-w-[44px] flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs"
              >
                Open ↗
              </a>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }

      <!-- Upload Modal -->
      ${
        showUploadModal
          ? `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 class="text-sm font-black text-stone-900">Upload Project Document</h3>

            <div class="space-y-3">
              <div>
                <label class="text-[11px] font-bold text-stone-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  value="${uploadForm.name}"
                  onchange="controller.updateUploadForm('name', this.value)"
                  placeholder="e.g. Raft Structural Blueprint Rev2.pdf"
                  class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label class="text-[11px] font-bold text-stone-700 block mb-1">File URL / Attachment Reference *</label>
                <input
                  type="text"
                  value="${uploadForm.fileUrl}"
                  onchange="controller.updateUploadForm('fileUrl', this.value)"
                  placeholder="https://storage.dbc.in/docs/file.pdf"
                  class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label class="text-[11px] font-bold text-stone-700 block mb-1">Document Format</label>
                <select
                  onchange="controller.updateUploadForm('fileType', this.value)"
                  class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-bold"
                >
                  <option value="PDF" ${uploadForm.fileType === 'PDF' ? 'selected' : ''}>PDF Blueprint / Report</option>
                  <option value="DWG" ${uploadForm.fileType === 'DWG' ? 'selected' : ''}>DWG CAD File</option>
                  <option value="IMAGE" ${uploadForm.fileType === 'IMAGE' ? 'selected' : ''}>Site Photo / Image</option>
                  <option value="DOC" ${uploadForm.fileType === 'DOC' ? 'selected' : ''}>Document</option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button
                onclick="controller.closeUploadModal()"
                class="flex-1 min-h-[44px] py-2 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onclick="controller.uploadDocument()"
                ${isUploading ? 'disabled' : ''}
                class="flex-1 min-h-[44px] py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                ${isUploading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}
