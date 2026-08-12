import { Pipe, PipeTransform } from '@angular/core';

export const NEGATIVE_CLASS = 'text-red-600 dark:text-red-400';
export const POSITIVE_CLASS = 'text-green-600 dark:text-green-400';

/** Text color classes for a monetary amount: red when negative, green when positive. */
@Pipe({ name: 'amountClass' })
export class AmountClassPipe implements PipeTransform {
  transform(value: number | null | undefined, greenWhenPositive = true): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value < 0) {
      return NEGATIVE_CLASS;
    }
    if (value > 0 && greenWhenPositive) {
      return POSITIVE_CLASS;
    }
    return '';
  }
}
