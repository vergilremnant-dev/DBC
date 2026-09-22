/**
 * Mobile Customer Project Documents Screen Component & Controller for DBC Mobile Application.
 * Displays project document repository list (blueprints, contracts, reports) with secure open/download links.
 */

import { mobileProjectExecutionService } from '../../services/mobileProjectExecutionService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileDocumentItem } from '../../types/projectExecutionMobileTypes';

export interface CustomerProjectDocumentsState {
  projectId: string;
  documents: MobileDocumentItem[];
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerProjectDocumentsController {
  private state: CustomerProjectDocumentsState;

  constructor(projectId: string = '') {
    this.state = {
      projectId,
      documents: [],
      isLoading: false,
      errorMessage: null,
    };
  }

  getState(): CustomerProjectDocumentsState {
    return { ...this.state };
  }

  async loadDocuments(id?: string): Promise<void> {
    const targetId = id || this.state.projectId;
    if (!targetId) return;

    this.state.projectId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.documents = await mobileProjectExecutionService.getProjectDocuments(targetId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load project documents';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerProjectDocumentsScreenDescriptor = (state: CustomerProjectDocumentsState) => ({
  type: 'Screen',
  name: 'CustomerProjectDocumentsScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'Project Documents & Drawings',
    subtitle: 'Access blueprints, contracts, permits, and inspection reports',
  },
  documentCards: state.documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    fileType: doc.fileType,
    uploadedBy: doc.uploadedByEmail,
    formattedDate: doc.formattedDate,
    fileUrl: doc.fileUrl,
    actionLabel: 'Open Document',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  })),
  emptyState: !state.isLoading && state.documents.length === 0 ? {
    title: 'No project documents uploaded yet.',
    subtitle: 'Project documents will appear here when they are uploaded by your contractor partner.',
  } : null,
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
