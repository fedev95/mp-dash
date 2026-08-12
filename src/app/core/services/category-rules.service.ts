import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from '@angular/fire/firestore/lite';
import { CategoryRule } from '../models/category-rule.model';
import { normalizeTransactionType } from '../utils/category-rules.util';

@Injectable({ providedIn: 'root' })
export class CategoryRulesService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  /** Lists every auto-categorization rule defined by the current user. */
  async listRules(): Promise<CategoryRule[]> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const rulesRef = collection(this.firestore, 'users', user.uid, 'categoryRules');
    const snapshot = await getDocs(rulesRef);
    return snapshot.docs.map((d) => {
      const data = d.data() as Omit<CategoryRule, 'id'>;
      return { id: d.id, ...data };
    });
  }

  /** Creates or updates the rule for a transaction type, pointing it at the given category. */
  async upsertRule(transactionType: string, categoryId: string): Promise<CategoryRule> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const rulesRef = collection(this.firestore, 'users', user.uid, 'categoryRules');
    const rules = await this.listRules();
    const normalized = normalizeTransactionType(transactionType);
    const existing = rules.find((r) => normalizeTransactionType(r.transactionType) === normalized);

    if (existing) {
      if (existing.categoryId === categoryId) {
        return existing;
      }
      const docRef = doc(this.firestore, 'users', user.uid, 'categoryRules', existing.id);
      await updateDoc(docRef, { categoryId });
      return { ...existing, categoryId };
    }

    const docRef = await addDoc(rulesRef, { transactionType, categoryId });
    return { id: docRef.id, transactionType, categoryId };
  }

  /** Permanently deletes a rule owned by the current user. */
  async deleteRule(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const docRef = doc(this.firestore, 'users', user.uid, 'categoryRules', id);
    await deleteDoc(docRef);
  }
}
