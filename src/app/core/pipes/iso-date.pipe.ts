import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'isoDate' })
export class IsoDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
}
