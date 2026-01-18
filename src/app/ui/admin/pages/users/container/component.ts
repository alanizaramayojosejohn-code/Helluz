import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
   selector: 'x-admin-users',
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminUsersComponent {}
