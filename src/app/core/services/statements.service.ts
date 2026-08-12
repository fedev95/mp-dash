import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs } from '@angular/fire/firestore/lite';
import { AccountStatement, StatementDetail, StatementRecord } from '../models/account-statement.model';

@Injectable({ providedIn: 'root' })
export class StatementsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  /** Uploads a parsed statement to Firestore under the current user's own subcollection. */
  async uploadStatement(fileName: string, statement: AccountStatement): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const statementsRef = collection(this.firestore, 'users', user.uid, 'statements');
    const docRef = await addDoc(statementsRef, {
      fileName,
      uploadedAt: new Date().toISOString(),
      periodStart: statement.transactions[0]?.releaseDate ?? null,
      periodEnd: statement.transactions.at(-1)?.releaseDate ?? null,
      summary: statement.summary,
      transactions: statement.transactions,
    });
    return docRef.id;
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

    const data = snapshot.data() as Omit<StatementDetail, 'id'>;
    return { id: snapshot.id, ...data };
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
}
