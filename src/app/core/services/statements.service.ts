import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore/lite';
import {
  AccountStatement,
  IndexedTransaction,
  StatementDetail,
  StatementRecord,
  StatementTransaction,
} from '../models/account-statement.model';
import { CategoryRulesService } from './category-rules.service';
import { findRuleFor, normalizeTransactionType } from '../utils/category-rules.util';

@Injectable({ providedIn: 'root' })
export class StatementsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly categoryRulesService = inject(CategoryRulesService);

  /** Uploads a parsed statement to Firestore, auto-categorizing transactions that match a rule. */
  async uploadStatement(fileName: string, statement: AccountStatement): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const rules = await this.categoryRulesService.listRules();
    const transactions = statement.transactions.map((t) => {
      const rule = findRuleFor(t.transactionType, rules);
      return rule ? { ...t, categoryId: rule.categoryId, categorySource: 'rule' as const } : t;
    });

    const statementsRef = collection(this.firestore, 'users', user.uid, 'statements');
    const docRef = await addDoc(statementsRef, {
      fileName,
      uploadedAt: new Date().toISOString(),
      periodStart: transactions[0]?.releaseDate ?? null,
      periodEnd: transactions.at(-1)?.releaseDate ?? null,
      summary: statement.summary,
      transactions,
    });
    return docRef.id;
  }

  /** Finds the statement (if any) already covering the same year-month as `periodStart`. */
  async findExistingForPeriod(periodStart: string | null): Promise<StatementRecord | null> {
    const periodKey = periodStart?.slice(0, 7) ?? null;
    if (!periodKey) {
      return null;
    }
    const statements = await this.getStatements();
    return statements.find((s) => s.periodStart?.slice(0, 7) === periodKey) ?? null;
  }

  /** Lists every statement previously uploaded by the current user. */
  async getStatements(): Promise<StatementRecord[]> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const statementsRef = collection(this.firestore, 'users', user.uid, 'statements');
    const snapshot = await getDocs(statementsRef);
    return snapshot.docs.map((d) => {
      const data = d.data() as Omit<StatementRecord, 'id'>;
      return { id: d.id, ...data };
    });
  }

  /** Fetches a single statement, including its full transaction list, by Firestore doc ID. */
  async getStatementById(id: string): Promise<StatementDetail> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const docRef = doc(this.firestore, 'users', user.uid, 'statements', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error('No se encontró el resumen solicitado.');
    }

    const data = snapshot.data() as Omit<StatementDetail, 'id' | 'transactions'> & {
      transactions: StatementTransaction[];
    };
    return { id: snapshot.id, ...data, transactions: withStableIds(data.transactions) };
  }

  /** Fetches every statement's full detail (including transactions) for the current user. */
  async getAllStatementDetails(): Promise<StatementDetail[]> {
    const records = await this.getStatements();
    return Promise.all(records.map((record) => this.getStatementById(record.id)));
  }

  /** Permanently deletes a statement owned by the current user. */
  async deleteStatement(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const docRef = doc(this.firestore, 'users', user.uid, 'statements', id);
    await deleteDoc(docRef);
  }

  /** Patches a single transaction (category/note) by its stable index within the statement. */
  async updateTransaction(
    statementId: string,
    index: number,
    patch: Partial<Pick<StatementTransaction, 'categoryId' | 'note' | 'categorySource'>>,
  ): Promise<IndexedTransaction[]> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const docRef = doc(this.firestore, 'users', user.uid, 'statements', statementId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error('No se encontró el resumen solicitado.');
    }

    const data = snapshot.data() as { transactions: StatementTransaction[] };
    const transactions = data.transactions.map((t, i) => {
      if (i !== index) {
        return t;
      }
      const updated: StatementTransaction = { ...t, ...patch };
      if (!updated.categoryId) {
        delete updated.categoryId;
        delete updated.categorySource;
      }
      if (!updated.note) {
        delete updated.note;
      }
      return updated;
    });

    await updateDoc(docRef, { transactions });
    return withStableIds(transactions);
  }

  /** Applies `categoryId` to every transaction (in any statement) matching `transactionType`. */
  async applyCategoryToMatchingTransactions(
    transactionType: string,
    categoryId: string,
  ): Promise<number> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const normalized = normalizeTransactionType(transactionType);
    const records = await this.getStatements();
    const counts = await Promise.all(
      records.map(async (record) => {
        const docRef = doc(this.firestore, 'users', user.uid, 'statements', record.id);
        const snapshot = await getDoc(docRef);
        const data = snapshot.data() as { transactions: StatementTransaction[] };

        let changed = 0;
        const transactions = data.transactions.map((t) => {
          if (!isRuleApplicable(t, normalized, categoryId)) {
            return t;
          }
          changed += 1;
          return { ...t, categoryId, categorySource: 'rule' as const };
        });

        if (changed > 0) {
          await updateDoc(docRef, { transactions });
        }
        return changed;
      }),
    );

    return counts.reduce((sum, c) => sum + c, 0);
  }
}

/** Stamps each transaction with its array position, giving it a stable id to address edits by. */
function withStableIds(transactions: StatementTransaction[]): IndexedTransaction[] {
  return transactions.map((t, i) => ({ ...t, id: i }));
}

/** True if `t` should be (re)assigned `targetCategoryId` by a rule matching `normalizedType`. */
function isRuleApplicable(
  t: StatementTransaction,
  normalizedType: string,
  targetCategoryId: string,
): boolean {
  if (normalizeTransactionType(t.transactionType) !== normalizedType) {
    return false;
  }
  if (t.categoryId === targetCategoryId) {
    return false;
  }
  if (t.categoryId && t.categorySource !== 'rule') {
    return false;
  }
  return true;
}
