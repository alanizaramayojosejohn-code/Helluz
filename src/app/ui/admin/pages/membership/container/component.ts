// pages/memberships/container/component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MembershipList } from '../components/list/container/component';
import { MembershipForm } from '../components/form/container/component';
import { MembershipDetail } from '../components/detail/container/component';
import { MembershipQueryService } from '../../../services/membership/membership-query.service';
import { MembershipService } from '../../../services/membership/membership.service';

type View = 'list' | 'form' | 'detail';

@Component({
  selector: 'x-memberships-container',
  imports: [MembershipList, MembershipForm, MembershipDetail],
  providers: [MembershipService, MembershipQueryService],
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MembershipsComponent {
  currentView = signal<View>('list');
  selectedMembershipId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);

  showList(): void {
    this.currentView.set('list');
    this.selectedMembershipId.set(null);
    this.isEditMode.set(false);
  }

  showForm(membershipId: string | null = null): void {
    this.currentView.set('form');
    this.selectedMembershipId.set(membershipId);
    this.isEditMode.set(!!membershipId);
  }

  showDetail(membershipId: string): void {
    this.currentView.set('detail');
    this.selectedMembershipId.set(membershipId);
  }
}
