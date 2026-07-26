import { Pipe, PipeTransform } from '@angular/core';

const formatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

@Pipe({ name: 'arsCurrency' })
export class ArsCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }
    return `$ ${formatter.format(value)}`;
  }
}
