import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore/lite';
import { Category } from '../models/category.model';
import { AUTO_CATEGORY_NAMES } from '../utils/transaction-category';
import { nextAvailableColor } from '../utils/category-palette';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  /**
   * Lists every category defined by the current user, seeding into Firestore (with a color
   * from the palette) whichever automatically-detected categories don't exist yet.
   */
  async listCategories(): Promise<Category[]> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const categoriesRef = collection(this.firestore, 'users', user.uid, 'categories');
    const snapshot = await getDocs(categoriesRef);
    const categories = snapshot.docs.map((d) => {
      const data = d.data() as Omit<Category, 'id'>;
      return { id: d.id, ...data };
    });

    const missingNames = AUTO_CATEGORY_NAMES.filter(
      (name) => !categories.some((c) => c.name === name),
    );
    if (missingNames.length === 0) {
      return categories;
    }

    const usedColors = categories.map((c) => c.color);
    for (const name of missingNames) {
      const color = nextAvailableColor(usedColors);
      usedColors.push(color);
      const id = await this.createCategory(name, color);
      categories.push({ id, name, color });
    }
    return categories;
  }

  /** Creates a new category under the current user's own subcollection. */
  async createCategory(name: string, color: string): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const categoriesRef = collection(this.firestore, 'users', user.uid, 'categories');
    const docRef = await addDoc(categoriesRef, { name, color });
    return docRef.id;
  }

  /** Updates the name and/or color of an existing category. */
  async updateCategory(
    id: string,
    patch: Partial<Pick<Category, 'name' | 'color'>>,
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const docRef = doc(this.firestore, 'users', user.uid, 'categories', id);
    await updateDoc(docRef, patch);
  }

  /** Permanently deletes a category owned by the current user. */
  async deleteCategory(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const docRef = doc(this.firestore, 'users', user.uid, 'categories', id);
    await deleteDoc(docRef);
  }
}
