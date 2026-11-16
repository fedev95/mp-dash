import { Injectable, inject } from '@angular/core';
import { Auth, deleteUser } from '@angular/fire/auth';
import { Firestore, collection, deleteDoc, getDocs } from '@angular/fire/firestore/lite';

/** Firebase only lets a user delete their account shortly after signing in. */
export const RECENT_SIGN_IN_MS = 5 * 60 * 1000;

const USER_COLLECTIONS = ['statements', 'categories', 'categoryRules'];

const RECENT_SIGN_IN_MESSAGE =
  'Por seguridad, cerrá sesión y volvé a entrar antes de eliminar tu cuenta.';

/** True if the user signed in less than {@link RECENT_SIGN_IN_MS} ago. */
export function signedInRecently(lastSignInTime: string | undefined, now = Date.now()): boolean {
  if (!lastSignInTime) {
    return false;
  }
  const elapsed = now - new Date(lastSignInTime).getTime();
  return elapsed >= 0 && elapsed < RECENT_SIGN_IN_MS;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  /** Deletes every document the user owns, then the account itself. */
  async deleteAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }
    // Checked up front so data is never deleted while the account deletion would be rejected.
    if (!signedInRecently(user.metadata.lastSignInTime)) {
      throw new Error(RECENT_SIGN_IN_MESSAGE);
    }

    for (const name of USER_COLLECTIONS) {
      const snapshot = await getDocs(collection(this.firestore, 'users', user.uid, name));
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    }

    try {
      await deleteUser(user);
    } catch (err) {
      if ((err as { code?: string }).code === 'auth/requires-recent-login') {
        throw new Error(`Tus datos se eliminaron. ${RECENT_SIGN_IN_MESSAGE}`);
      }
      throw err;
    }
  }
}
