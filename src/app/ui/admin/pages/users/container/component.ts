// pages/users/container/component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UserList } from '../components/list/container/component';
import { UserForm } from '../components/form/container/component';
import { UserDetail } from '../components/detail/container/component';
import { UserService } from '../../../../../services/user/user.service';
import { UserQueryService } from '../../../../../services/user/user-query.service';

type View = 'list' | 'form' | 'detail';

@Component({
  selector: 'x-users-container',
  imports: [UserList, UserForm, UserDetail],
  providers: [UserService, UserQueryService],
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersComponent {
  currentView = signal<View>('list');
  selectedUserId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);

  showList(): void {
    this.currentView.set('list');
    this.selectedUserId.set(null);
    this.isEditMode.set(false);
  }

  showForm(userId: string | null = null): void {
    this.currentView.set('form');
    this.selectedUserId.set(userId);
    this.isEditMode.set(!!userId);
  }

  showDetail(userId: string): void {
    this.currentView.set('detail');
    this.selectedUserId.set(userId);
  }
}
