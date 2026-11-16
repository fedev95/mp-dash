// Tests firestore.rules against the Firestore emulator.
// Run from this folder: npm test (needs Java for the emulator).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mp-dash',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(() => env.cleanup());

beforeEach(() => env.clearFirestore());

/** Writes documents bypassing the rules, like an admin would from the console. */
async function seed(path, data) {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), path), data));
}

const db = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const tx = (overrides = {}) => ({
  releaseDate: '2026-03-01',
  transactionType: 'Rendimientos',
  referenceId: '1',
  netAmount: 1,
  partialBalance: 1,
  ...overrides,
});
const statement = (overrides = {}) => ({
  fileName: 'march.csv',
  uploadedAt: '2026-03-31T00:00:00.000Z',
  periodStart: '2026-03-01',
  periodEnd: '2026-03-31',
  summary: { initialBalance: 0, credits: 1, debits: -1, finalBalance: 0 },
  transactions: [tx(), tx()],
  ...overrides,
});

const statementRef = (fs, uid = 'alice', id = 's1') => doc(fs, 'users', uid, 'statements', id);
const categoryRef = (fs, uid = 'alice', id = 'c1') => doc(fs, 'users', uid, 'categories', id);
const ruleRef = (fs, uid = 'alice', id = 'r1') => doc(fs, 'users', uid, 'categoryRules', id);

describe('access control', () => {
  it('denies everyone when /config/access does not exist', async () => {
    await assertFails(setDoc(statementRef(db('alice')), statement()));
  });

  it('denies non-listed users when the project is closed', async () => {
    await seed('config/access', { open: false });
    await assertFails(setDoc(statementRef(db('alice')), statement()));
  });

  it('allows listed users when the project is closed', async () => {
    await seed('config/access', { open: false });
    await seed('allowedUsers/alice', {});
    await assertSucceeds(setDoc(statementRef(db('alice')), statement()));
  });

  it('allows listed users even without /config/access', async () => {
    await seed('allowedUsers/alice', {});
    await assertSucceeds(setDoc(statementRef(db('alice')), statement()));
  });

  it('allows any signed-in user when the project is open', async () => {
    await seed('config/access', { open: true });
    await assertSucceeds(setDoc(statementRef(db('alice')), statement()));
  });

  it('never lets clients read or change the access config', async () => {
    await seed('config/access', { open: true });
    await assertFails(getDoc(doc(db('alice'), 'config/access')));
    await assertFails(setDoc(doc(db('alice'), 'config/access'), { open: true }));
    await assertFails(setDoc(doc(db('alice'), 'allowedUsers/alice'), {}));
  });
});

describe('data rules (open project)', () => {
  beforeEach(() => seed('config/access', { open: true }));

  describe('statements', () => {
    it('lets the owner create, read, list and delete', async () => {
      const fs = db('alice');
      await assertSucceeds(addDoc(collection(fs, 'users', 'alice', 'statements'), statement()));
      await assertSucceeds(setDoc(statementRef(fs), statement()));
      await assertSucceeds(getDoc(statementRef(fs)));
      await assertSucceeds(getDocs(collection(fs, 'users', 'alice', 'statements')));
      await assertSucceeds(deleteDoc(statementRef(fs)));
    });

    it('accepts a statement without transactions', async () => {
      await assertSucceeds(
        setDoc(
          statementRef(db('alice')),
          statement({ periodStart: null, periodEnd: null, transactions: [] }),
        ),
      );
    });

    it("blocks other users and anonymous access to someone else's data", async () => {
      await seed('users/alice/statements/s1', statement());
      await assertFails(getDoc(statementRef(db('bob'))));
      await assertFails(getDoc(statementRef(anon())));
      await assertFails(setDoc(statementRef(db('bob'), 'alice', 's2'), statement()));
      await assertFails(deleteDoc(statementRef(db('bob'))));
    });

    it('rejects invalid statements', async () => {
      const fs = db('alice');
      await assertFails(setDoc(statementRef(fs), statement({ admin: true })));
      await assertFails(setDoc(statementRef(fs), statement({ periodStart: 'ayer' })));
      const missingSummary = statement();
      delete missingSummary.summary;
      await assertFails(setDoc(statementRef(fs), missingSummary));
    });

    it('only allows editing transactions without changing their count', async () => {
      await seed('users/alice/statements/s1', statement());
      const fs = db('alice');
      await assertSucceeds(
        updateDoc(statementRef(fs), {
          transactions: [tx({ categoryId: 'c1', categorySource: 'manual', note: 'hola' }), tx()],
        }),
      );
      await assertFails(updateDoc(statementRef(fs), { transactions: [tx()] }));
      await assertFails(updateDoc(statementRef(fs), { fileName: 'x.csv' }));
    });
  });

  describe('categories', () => {
    it('lets the owner create, update and delete', async () => {
      const fs = db('alice');
      await assertSucceeds(setDoc(categoryRef(fs), { name: 'Comida', color: '#ef4444' }));
      await assertSucceeds(updateDoc(categoryRef(fs), { name: 'Super' }));
      await assertSucceeds(updateDoc(categoryRef(fs), { color: '#3B82F6' }));
      await assertSucceeds(deleteDoc(categoryRef(fs)));
    });

    it('rejects invalid categories', async () => {
      const fs = db('alice');
      await assertFails(setDoc(categoryRef(fs), { name: 'X', color: 'red;background:url(x)' }));
      await assertFails(setDoc(categoryRef(fs), { name: 'a'.repeat(51), color: '#ef4444' }));
      await assertFails(setDoc(categoryRef(fs), { name: '', color: '#ef4444' }));
      await seed('users/alice/categories/c1', { name: 'Comida', color: '#ef4444' });
      await assertFails(updateDoc(categoryRef(fs), { owner: 'bob' }));
    });
  });

  describe('category rules', () => {
    it('lets the owner create and update', async () => {
      const fs = db('alice');
      await assertSucceeds(
        setDoc(ruleRef(fs), { transactionType: 'Rendimientos', categoryId: 'c1' }),
      );
      await assertSucceeds(updateDoc(ruleRef(fs), { categoryId: 'c9' }));
    });

    it('rejects invalid rules and other users', async () => {
      await assertFails(
        setDoc(ruleRef(db('alice')), { transactionType: 'X', categoryId: 'c1', x: 1 }),
      );
      await assertFails(setDoc(ruleRef(db('bob')), { transactionType: 'X', categoryId: 'c1' }));
    });
  });

  it('denies writes outside /users/{uid}', async () => {
    await assertFails(setDoc(doc(db('alice'), 'public/x'), { a: 1 }));
    await assertFails(setDoc(doc(db('alice'), 'users/alice'), { a: 1 }));
  });
});
