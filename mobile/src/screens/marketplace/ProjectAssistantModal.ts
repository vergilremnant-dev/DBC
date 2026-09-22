/**
 * Mobile Project Assistant Guided Modal Component & Controller for DBC Mobile Application.
 * Step-by-step guided assistant for project scope, location, and budget estimation.
 */

import { mobileMarketplaceService } from '../../services/mobileMarketplaceService';
import { mobileTheme } from '../../theme/themeTokens';
import { ProjectAssistantStep, ProjectRequestContext } from '../../types/marketplaceMobileTypes';

export interface ProjectAssistantState {
  currentStepIndex: number;
  steps: ProjectAssistantStep[];
  selectedProjectType: string;
  selectedCity: string;
  selectedBudget: string;
  isComplete: boolean;
}

export class ProjectAssistantController {
  private state: ProjectAssistantState;

  constructor() {
    this.state = {
      currentStepIndex: 1,
      steps: mobileMarketplaceService.getProjectAssistantSteps(),
      selectedProjectType: '',
      selectedCity: 'Hyderabad',
      selectedBudget: '',
      isComplete: false,
    };
  }

  getState(): ProjectAssistantState {
    return { ...this.state };
  }

  selectOption(stepIndex: number, value: string) {
    if (stepIndex === 1) {
      this.state.selectedProjectType = value;
    } else if (stepIndex === 2) {
      this.state.selectedCity = value;
    } else if (stepIndex === 3) {
      this.state.selectedBudget = value;
    }
  }

  nextStep() {
    if (this.state.currentStepIndex < this.state.steps.length) {
      this.state.currentStepIndex += 1;
    } else {
      this.state.isComplete = true;
    }
  }

  previousStep() {
    if (this.state.currentStepIndex > 1) {
      this.state.currentStepIndex -= 1;
    }
  }

  getProjectRequestContext(): ProjectRequestContext {
    return {
      categoryName: this.state.selectedProjectType || 'General Project',
      city: this.state.selectedCity || 'Hyderabad',
      estimatedBudget: this.state.selectedBudget || 'Custom Quote',
      notes: `Guided Project Request: ${this.state.selectedProjectType} in ${this.state.selectedCity}`,
    };
  }
}

export const renderProjectAssistantModalDescriptor = (state: ProjectAssistantState) => {
  const currentStep = state.steps.find((s) => s.stepIndex === state.currentStepIndex) || state.steps[0];

  return {
    type: 'Modal',
    name: 'ProjectAssistantModal',
    styles: {
      backgroundColor: mobileTheme.colors.surface,
      borderRadius: mobileTheme.borderRadius.lg,
      padding: mobileTheme.spacing.lg,
    },
    header: {
      title: 'Guided Project Assistant',
      progress: `Step ${state.currentStepIndex} of ${state.steps.length}`,
    },
    stepContent: {
      title: currentStep.title,
      subtitle: currentStep.subtitle,
      options: currentStep.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        icon: opt.icon,
        minHeight: mobileTheme.touchTargets.buttonHeight,
      })),
    },
    actions: {
      backButton: {
        label: 'Back',
        disabled: state.currentStepIndex === 1,
        minHeight: mobileTheme.touchTargets.minTouchArea,
      },
      nextButton: {
        label: state.currentStepIndex === state.steps.length ? 'Generate Request Context' : 'Continue',
        minHeight: mobileTheme.touchTargets.buttonHeight,
        backgroundColor: mobileTheme.colors.primary,
      },
    },
  };
};
