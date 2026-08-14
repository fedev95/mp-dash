import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryRulesService } from '../../../core/services/category-rules.service';
import { Category } from '../../../core/models/category.model';
import { CategoryRule } from '../../../core/models/category-rule.model';
import { CATEGORY_PALETTE, nextAvailableColor } from '../../../core/utils/category-palette';

@Component({
  selector: 'app-categories-list',
  imports: [MessageModule, ButtonModule, DialogModule, InputTextModule, FormsModule],
  templateUrl: './categories-list.html',
})
export class CategoriesList implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly categoryRulesService = inject(CategoryRulesService);

  readonly palette = CATEGORY_PALETTE;

  readonly categories = signal<Category[]>([]);
  readonly rules = signal<CategoryRule[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly deletingRuleId = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly nameValue = signal('');
  readonly colorValue = signal(CATEGORY_PALETTE[0]);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly deleteTarget = signal<Category | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  readonly ruleRows = computed(() =>
    this.rules().map((rule) => ({
      ...rule,
      category: this.categories().find((c) => c.id === rule.categoryId) ?? null,
    })),
  );

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [categories, rules] = await Promise.all([
        this.categoriesService.listCategories(),
        this.categoryRulesService.listRules(),
      ]);
      this.categories.set(categories);
      this.rules.set(rules);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteRule(rule: CategoryRule): Promise<void> {
    this.deletingRuleId.set(rule.id);
    try {
      await this.categoryRulesService.deleteRule(rule.id);
      this.rules.update((current) => current.filter((r) => r.id !== rule.id));
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.deletingRuleId.set(null);
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.nameValue.set('');
    this.colorValue.set(nextAvailableColor(this.categories().map((c) => c.color)));
    this.formError.set(null);
    this.formVisible.set(true);
  }

  openEdit(category: Category): void {
    this.editingId.set(category.id);
    this.nameValue.set(category.name);
    this.colorValue.set(category.color);
    this.formError.set(null);
    this.formVisible.set(true);
  }

  isColorTaken(color: string): boolean {
    return this.categories().some((c) => c.color === color && c.id !== this.editingId());
  }

  swatchClasses(swatch: string): string {
    const classes: string[] = [];
    if (this.colorValue() === swatch) {
      classes.push(
        'ring-2 ring-offset-2 ring-surface-900 dark:ring-surface-0 dark:ring-offset-surface-900',
      );
    }
    if (this.isColorTaken(swatch)) {
      classes.push('opacity-30 cursor-not-allowed');
    }
    return classes.join(' ');
  }

  async save(): Promise<void> {
    const name = this.nameValue().trim();
    if (!name) {
      this.formError.set('Ingresá un nombre para la categoría.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    try {
      const editingId = this.editingId();
      const color = this.colorValue();
      if (editingId) {
        await this.categoriesService.updateCategory(editingId, { name, color });
      } else {
        await this.categoriesService.createCategory(name, color);
      }
      this.formVisible.set(false);
      await this.load();
    } catch (err) {
      this.formError.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.saving.set(false);
    }
  }

  requestDelete(category: Category): void {
    this.deleteTarget.set(category);
  }

  onDeleteDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.deleteTarget.set(null);
    }
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) {
      return;
    }

    this.deleting.set(true);
    try {
      await this.categoriesService.deleteCategory(target.id);
      this.deleteTarget.set(null);
      await this.load();
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.deleting.set(false);
    }
  }
}
