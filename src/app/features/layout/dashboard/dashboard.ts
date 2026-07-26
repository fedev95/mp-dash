import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  imports: [CardModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly stats = [
    { label: 'Usuarios activos', value: '1,204', icon: 'pi pi-users' },
    { label: 'Ingresos', value: '$8,540', icon: 'pi pi-wallet' },
    { label: 'Pedidos', value: '327', icon: 'pi pi-shopping-cart' },
  ];
}
