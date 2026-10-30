/**
 * DBC service catalog migration — idempotent, non-destructive.
 *
 *   Dry run (default, read-only):
 *     node --experimental-strip-types prisma/migrate_service_catalog.ts
 *
 *   Apply (only after reviewing the dry run and taking a database backup):
 *     CONFIRM_CATALOG_MIGRATION=yes node --experimental-strip-types prisma/migrate_service_catalog.ts --apply
 *
 * Requires Node 22.6+ and a generated Prisma client (`npx prisma generate`), with DATABASE_URL set.
 *
 * What it does:
 *   - Renames existing categories in place (ids and slugs kept) and creates only missing services.
 *   - Sets name, categoryType, workforceTypeId, displayOrder and isActive for the 23 catalog services.
 *   - Duplicate categories of the same service (e.g. "architecture" next to "architect"): their providers are
 *     moved to the canonical category and the duplicate is deactivated.
 *   - Every other active category is deactivated (isActive=false). Nothing is deleted; providers, bookings,
 *     requirements, callbacks, quotations and projects keep their existing category links.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  SERVICE_CATALOG,
  planCatalogMigration,
  activeCountAfterPlan,
  type ExistingCategoryRow,
  type CatalogPlan,
} from '../api-lib/utils/serviceCatalog.ts';

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function loadCategories() {
  return prisma.serviceCategory.findMany({
    orderBy: { id: 'asc' },
    include: {
      workforceType: { select: { name: true } },
      _count: { select: { providers: true, bookings: true, requirements: true, callbackRequests: true, children: true } },
    },
  });
}

type LoadedRow = Awaited<ReturnType<typeof loadCategories>>[number];

const toPlanRows = (rows: LoadedRow[]): ExistingCategoryRow[] =>
  rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    categoryType: r.categoryType,
    workforceTypeId: r.workforceTypeId,
    isActive: r.isActive,
    deletedAt: r.deletedAt,
    displayOrder: r.displayOrder,
    providerCount: r._count.providers,
  }));

function printReport(rows: LoadedRow[], plan: CatalogPlan) {
  console.log('\n=== Current service_categories ===');
  console.table(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      type: r.categoryType,
      workforce: r.workforceType?.name ?? '(none)',
      active: r.isActive && !r.deletedAt,
      order: r.displayOrder,
      parent: r.parentId ?? '',
      providers: r._count.providers,
      bookings: r._count.bookings,
      requirements: r._count.requirements,
      callbacks: r._count.callbackRequests,
      children: r._count.children,
    })),
  );

  console.log('\n=== Planned actions ===');
  console.table(
    plan.actions.map((a) => {
      switch (a.kind) {
        case 'UPDATE':
          return { action: 'UPDATE', id: a.id, slug: a.slug, detail: `${a.from.name} → ${a.to.name} · ${a.to.categoryType} #${a.to.displayOrder}${a.from.isActive ? '' : ' · reactivate'}`, providers: a.providerCount };
        case 'UNCHANGED':
          return { action: 'UNCHANGED', id: a.id, slug: a.slug, detail: a.name, providers: a.providerCount };
        case 'CREATE':
          return { action: 'CREATE', id: '', slug: a.slug, detail: `${a.name} · ${a.categoryType} #${a.displayOrder}`, providers: 0 };
        case 'MERGE_DUPLICATE':
          return { action: 'MERGE_DUPLICATE', id: a.id, slug: a.slug, detail: `${a.name}: move providers → #${a.intoId} (${a.intoSlug}), deactivate${a.renameTo ? `, rename to "${a.renameTo}"` : ''}`, providers: a.providerCount };
        case 'RETIRE':
          return { action: 'RETIRE', id: a.id, slug: a.slug, detail: `${a.name} (${a.reason}) — providers keep this category, hidden from discovery`, providers: a.providerCount };
        case 'ALREADY_RETIRED':
          return { action: 'ALREADY_RETIRED', id: a.id, slug: a.slug, detail: a.name, providers: a.providerCount };
      }
    }),
  );

  const retiredProviders = plan.actions
    .filter((a) => a.kind === 'RETIRE' || a.kind === 'ALREADY_RETIRED')
    .reduce((n, a) => n + a.providerCount, 0);
  const merged = plan.actions.filter((a) => a.kind === 'MERGE_DUPLICATE').reduce((n, a) => n + a.providerCount, 0);
  console.log(`\nActive catalog services after migration: ${activeCountAfterPlan(plan)} (expected ${SERVICE_CATALOG.length})`);
  console.log(`Providers moved from duplicate categories to their canonical category: ${merged}`);
  console.log(`Providers left in retired categories (kept, hidden from public discovery): ${retiredProviders}`);
  if (plan.conflicts.length) {
    console.log('\n!!! Conflicts (must be resolved before --apply):');
    plan.conflicts.forEach((c) => console.log(' - ' + c));
  }
}

async function apply(rows: LoadedRow[], plan: CatalogPlan) {
  if (plan.conflicts.length) throw new Error('Refusing to apply: resolve the conflicts listed above first.');
  if (process.env.CONFIRM_CATALOG_MIGRATION !== 'yes') {
    throw new Error('Refusing to apply without CONFIRM_CATALOG_MIGRATION=yes (take a database backup first).');
  }

  // Local snapshot of every category row and the provider→category links that will change.
  const dupIds = plan.actions.filter((a) => a.kind === 'MERGE_DUPLICATE').map((a) => a.id);
  const movedProviders = dupIds.length
    ? await prisma.providerProfile.findMany({ where: { categoryId: { in: dupIds } }, select: { id: true, categoryId: true } })
    : [];
  const dir = path.join(process.cwd(), 'prisma', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `service_categories-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify({ categories: rows, movedProviders }, null, 2));
  console.log(`\nSnapshot written: ${file}`);

  await prisma.$transaction(
    async (tx) => {
      const types = {
        BLUE_COLLAR: await tx.workforceType.upsert({ where: { name: 'BLUE_COLLAR' }, update: { isActive: true }, create: { name: 'BLUE_COLLAR', displayName: 'Blue Collar', isActive: true } }),
        WHITE_COLLAR: await tx.workforceType.upsert({ where: { name: 'WHITE_COLLAR' }, update: { isActive: true }, create: { name: 'WHITE_COLLAR', displayName: 'White Collar', isActive: true } }),
      };

      // 1. Duplicates and obsolete categories first, so their names are free before renames.
      for (const a of plan.actions) {
        if (a.kind === 'MERGE_DUPLICATE') {
          await tx.providerProfile.updateMany({ where: { categoryId: a.id }, data: { categoryId: a.intoId } });
          await tx.serviceCategory.update({ where: { id: a.id }, data: { isActive: false, ...(a.renameTo ? { name: a.renameTo } : {}) } });
        } else if (a.kind === 'RETIRE') {
          await tx.serviceCategory.update({ where: { id: a.id }, data: { isActive: false } });
        }
      }

      // 2. Catalog services: rename/realign in place, then create the missing ones.
      for (const a of plan.actions) {
        if (a.kind === 'UPDATE' || a.kind === 'UNCHANGED') {
          const svc = SERVICE_CATALOG.find((s) => s.label === (a.kind === 'UPDATE' ? a.to.name : a.name))!;
          await tx.serviceCategory.update({
            where: { id: a.id },
            data: { name: svc.label, categoryType: svc.workforce, displayOrder: svc.order, isActive: true, deletedAt: null, workforceTypeId: types[svc.workforce].id },
          });
        } else if (a.kind === 'CREATE') {
          await tx.serviceCategory.create({
            data: { name: a.name, slug: a.slug, categoryType: a.categoryType, displayOrder: a.displayOrder, isActive: true, icon: a.slug, workforceTypeId: types[a.categoryType].id },
          });
        }
      }
    },
    { timeout: 60_000 },
  );

  const after = planCatalogMigration(toPlanRows(await loadCategories()));
  const pending = after.actions.filter((a) => a.kind !== 'UNCHANGED' && a.kind !== 'ALREADY_RETIRED');
  console.log(pending.length ? `\nWARNING: ${pending.length} actions still pending after apply.` : '\nVerified: catalog is in its final state (re-running is a no-op).');
  console.log('Public category cache: redeploy or wait up to 10 minutes for /api/categories to refresh.');
}

async function main() {
  const rows = await loadCategories();
  const plan = planCatalogMigration(toPlanRows(rows));
  printReport(rows, plan);
  if (APPLY) await apply(rows, plan);
  else console.log('\nDry run only — no changes made. Re-run with --apply (and CONFIRM_CATALOG_MIGRATION=yes) to execute.');
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
