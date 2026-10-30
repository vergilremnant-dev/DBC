/**
 * Minimal in-memory Prisma stand-in for workflow tests (no database needed).
 * Supports the query shapes used by the request → quotation → project services:
 * where (equality, in/notIn/not/gte/lte/contains, OR/AND, relation some/none), include/select
 * (one level of nested where/select/orderBy), orderBy, take/skip, create/createMany/update/updateMany/delete,
 * unique constraints and $transaction.
 */
type Row = Record<string, any>;
type Rel = { model: string; many: boolean; local: string; remote: string };

const INT_IDS = new Set(['requirement', 'requirementHistory', 'requirementAttachment', 'requirementNote', 'quotation', 'proposal', 'quotationMilestone', 'quotationAttachment', 'quotationHistory', 'quotationNegotiation', 'serviceCategory']);

const RELATIONS: Record<string, Record<string, Rel>> = {
  requirement: {
    customer: { model: 'customerProfile', many: false, local: 'customerId', remote: 'id' },
    serviceCategoryRel: { model: 'serviceCategory', many: false, local: 'serviceCategoryId', remote: 'id' },
    attachments: { model: 'requirementAttachment', many: true, local: 'id', remote: 'requirementId' },
    history: { model: 'requirementHistory', many: true, local: 'id', remote: 'requirementId' },
    notes: { model: 'requirementNote', many: true, local: 'id', remote: 'requirementId' },
    conversations: { model: 'conversation', many: true, local: 'id', remote: 'requirementId' },
    quotations: { model: 'quotation', many: true, local: 'id', remote: 'requirementId' },
  },
  quotation: {
    provider: { model: 'providerProfile', many: false, local: 'providerId', remote: 'id' },
    requirement: { model: 'requirement', many: false, local: 'requirementId', remote: 'id' },
    proposal: { model: 'proposal', many: false, local: 'id', remote: 'quotationId' },
    milestones: { model: 'quotationMilestone', many: true, local: 'id', remote: 'quotationId' },
    attachments: { model: 'quotationAttachment', many: true, local: 'id', remote: 'quotationId' },
    negotiations: { model: 'quotationNegotiation', many: true, local: 'id', remote: 'quotationId' },
    history: { model: 'quotationHistory', many: true, local: 'id', remote: 'quotationId' },
  },
  conversation: {
    customer: { model: 'customerProfile', many: false, local: 'customerId', remote: 'id' },
    provider: { model: 'providerProfile', many: false, local: 'providerId', remote: 'id' },
    messages: { model: 'message', many: true, local: 'id', remote: 'conversationId' },
  },
  providerProfile: { category: { model: 'serviceCategory', many: false, local: 'categoryId', remote: 'id' } },
};

const UNIQUE: Record<string, string[]> = { project: ['requirementId', 'quotationId'], customerProfile: ['userId'], providerProfile: ['userId'] };

export function createFakePrisma() {
  const tables: Record<string, Row[]> = {};
  const seq: Record<string, number> = {};
  const t = (m: string) => (tables[m] ??= []);
  let uuid = 0;

  const cmp = (a: any, b: any) => (a instanceof Date ? a.getTime() : a) - (b instanceof Date ? b.getTime() : b);
  const related = (model: string, row: Row, key: string) => {
    const r = RELATIONS[model]?.[key];
    if (!r) return undefined;
    const rows = t(r.model).filter((x) => x[r.remote] === row[r.local] && row[r.local] != null);
    return { rel: r, rows };
  };

  function matchValue(v: any, cond: any): boolean {
    if (cond === null || typeof cond !== 'object' || cond instanceof Date) return v === cond || (v instanceof Date && cond instanceof Date && v.getTime() === cond.getTime());
    if ('in' in cond && !cond.in.includes(v)) return false;
    if ('notIn' in cond && cond.notIn.includes(v)) return false;
    if ('not' in cond && (cond.not !== null && typeof cond.not === 'object' ? matchValue(v, cond.not) : v === cond.not)) return false;
    if ('equals' in cond && v !== cond.equals) return false;
    if ('gte' in cond && !(v != null && cmp(v, cond.gte) >= 0)) return false;
    if ('gt' in cond && !(v != null && cmp(v, cond.gt) > 0)) return false;
    if ('lte' in cond && !(v != null && cmp(v, cond.lte) <= 0)) return false;
    if ('lt' in cond && !(v != null && cmp(v, cond.lt) < 0)) return false;
    if ('contains' in cond && !String(v ?? '').toLowerCase().includes(String(cond.contains).toLowerCase())) return false;
    return true;
  }

  function match(model: string, row: Row, where: any = {}): boolean {
    for (const [k, cond] of Object.entries(where ?? {})) {
      if (cond === undefined) continue;
      if (k === 'OR') { if (!(cond as any[]).some((w) => match(model, row, w))) return false; continue; }
      if (k === 'AND') { if (!(cond as any[]).every((w) => match(model, row, w))) return false; continue; }
      const rel = related(model, row, k);
      if (rel) {
        const c = cond as any;
        if (rel.rel.many) {
          if (c.some && !rel.rows.some((x) => match(rel.rel.model, x, c.some))) return false;
          if (c.none && rel.rows.some((x) => match(rel.rel.model, x, c.none))) return false;
          if (c.every && !rel.rows.every((x) => match(rel.rel.model, x, c.every))) return false;
        } else {
          const target = rel.rows[0];
          const inner = c.is ?? c;
          if (!target || !match(rel.rel.model, target, inner)) return false;
        }
        continue;
      }
      if (!matchValue(row[k], cond)) return false;
    }
    return true;
  }

  function shape(model: string, row: Row, args: any = {}): Row {
    if (args.select) {
      const out: Row = {};
      for (const [k, v] of Object.entries(args.select)) {
        if (!v) continue;
        const rel = related(model, row, k);
        if (rel) out[k] = project(rel, v === true ? {} : v);
        else out[k] = row[k];
      }
      return out;
    }
    const out: Row = { ...row };
    for (const [k, v] of Object.entries(args.include ?? {})) {
      if (!v) continue;
      const rel = related(model, row, k);
      if (rel) out[k] = project(rel, v === true ? {} : v);
    }
    return out;
  }

  function project(rel: { rel: Rel; rows: Row[] }, args: any) {
    let rows = rel.rows.filter((x) => match(rel.rel.model, x, args.where));
    rows = sort(rows, args.orderBy);
    if (args.take) rows = rows.slice(0, args.take);
    const shaped = rows.map((x) => shape(rel.rel.model, x, args));
    return rel.rel.many ? shaped : shaped[0] ?? null;
  }

  function sort(rows: Row[], orderBy: any) {
    if (!orderBy) return rows;
    const specs = (Array.isArray(orderBy) ? orderBy : [orderBy]).flatMap((o) => Object.entries(o));
    return [...rows].sort((a, b) => {
      for (const [k, dir] of specs) {
        const d = cmp(a[k] ?? 0, b[k] ?? 0) || String(a[k]).localeCompare(String(b[k]));
        if (d) return dir === 'desc' ? -d : d;
      }
      return 0;
    });
  }

  function checkUnique(model: string, row: Row, selfId?: any) {
    for (const f of UNIQUE[model] ?? []) {
      if (row[f] == null) continue;
      if (t(model).some((x) => x.id !== selfId && x[f] === row[f])) throw Object.assign(new Error(`Unique constraint failed on the fields: (\`${f}\`)`), { code: 'P2002' });
    }
  }

  const delegate = (model: string) => ({
    findUnique: async (args: any) => { const r = t(model).find((x) => match(model, x, args.where)); return r ? shape(model, r, args) : null; },
    findFirst: async (args: any = {}) => { const r = sort(t(model).filter((x) => match(model, x, args.where)), args.orderBy)[0]; return r ? shape(model, r, args) : null; },
    findMany: async (args: any = {}) => {
      let rows = sort(t(model).filter((x) => match(model, x, args.where)), args.orderBy);
      if (args.skip) rows = rows.slice(args.skip);
      if (args.take) rows = rows.slice(0, args.take);
      return rows.map((r) => shape(model, r, args));
    },
    count: async (args: any = {}) => t(model).filter((x) => match(model, x, args.where)).length,
    create: async (args: any) => {
      const id = args.data.id ?? (INT_IDS.has(model) ? (seq[model] = (seq[model] ?? 0) + 1) : `${model}-${++uuid}`);
      const row = { createdAt: new Date(Date.now() + uuid), updatedAt: new Date(), ...args.data, id };
      checkUnique(model, row);
      t(model).push(row);
      return shape(model, row, args);
    },
    createMany: async (args: any) => {
      for (const d of args.data) await delegate(model).create({ data: d });
      return { count: args.data.length };
    },
    update: async (args: any) => {
      const r = t(model).find((x) => match(model, x, args.where));
      if (!r) throw new Error(`${model} not found`);
      const next = { ...r, ...args.data, updatedAt: new Date() };
      checkUnique(model, next, r.id);
      Object.assign(r, next);
      return shape(model, r, args);
    },
    updateMany: async (args: any) => {
      const rows = t(model).filter((x) => match(model, x, args.where));
      rows.forEach((r) => Object.assign(r, args.data));
      return { count: rows.length };
    },
    upsert: async (args: any) => {
      const r = t(model).find((x) => match(model, x, args.where));
      return r ? delegate(model).update({ where: args.where, data: args.update }) : delegate(model).create({ data: args.create });
    },
    delete: async (args: any) => {
      const i = t(model).findIndex((x) => match(model, x, args.where));
      if (i < 0) throw new Error(`${model} not found`);
      return t(model).splice(i, 1)[0];
    },
  });

  const db: any = new Proxy(
    { _tables: tables, $transaction: async (fn: any) => (typeof fn === 'function' ? fn(db) : Promise.all(fn)) },
    { get: (target: any, prop: string) => (prop in target ? target[prop] : (target[prop] = delegate(prop))) },
  );
  return db;
}
