import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf-8');

describe('Requirement form uses the live service catalog', () => {
  const form = read('src/components/workspace/requirements/RequirementForm.tsx');

  it('no longer contains a hard-coded service list', () => {
    expect(form).not.toMatch(/const CATEGORIES\s*=/);
    expect(form).not.toContain('CCTV Installation');
    expect(form).not.toContain('Tiles Specialist');
  });

  it('loads services from the categories API and groups them by workforce', () => {
    expect(form).toContain("from '../../../services/category/categoryService'");
    expect(form).toContain('categoryApi');
    expect(form).toContain('.getCategories()');
    expect(form).toContain("'WHITE_COLLAR'");
    expect(form).toContain("'BLUE_COLLAR'");
    expect(form).toContain('<optgroup');
  });

  it('shows loading / error states and keeps a retired service when editing an old requirement', () => {
    expect(form).toContain('Loading services');
    expect(form).toContain("categoriesState === 'error'");
    expect(form).toContain('(no longer offered)');
  });

  it('sends the selected category id with the requirement', () => {
    const page = read('src/pages/workspace/WorkspaceRequirements.tsx');
    expect(form).toContain('categoryId: match?.id');
    expect(page.match(/serviceCategoryId: formData\.categoryId/g)?.length).toBe(2);
  });
});
