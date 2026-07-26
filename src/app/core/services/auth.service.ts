import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  /** Emits the current Firebase user (or null); wraps onAuthStateChanged. */
  readonly user$ = authState(this.auth);

  /** Signal form of user$, handy for templates (e.g. navbar email display). */
  readonly currentUser = toSignal(this.user$, { initialValue: undefined });

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    return signOut(this.auth);
  }
}
