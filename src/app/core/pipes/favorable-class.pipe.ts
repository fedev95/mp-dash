import { Pipe, PipeTransform } from '@angular/core';
import { NEGATIVE_CLASS, POSITIVE_CLASS } from './amount-class.pipe';

const NEUTRAL_CLASS = 'text-surface-400 dark:text-surface-500';

/** Text color for a period-over-period change: green/red by whether it's favorable, not by sign. */
@Pipe({ name: 'favorableClass' })
export class FavorableClassPipe implements PipeTransform {
  transform(favorable: boolean | null | undefined): string {
    if (favorable === true) {
      return POSITIVE_CLASS;
    }
    if (favorable === false) {
      return NEGATIVE_CLASS;
    }
    return NEUTRAL_CLASS;
  }
}
