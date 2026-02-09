// pages/students/container/component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { StudentList } from '../components/list/container/component'
import { StudentForm } from '../components/form/container/component'
import { StudentDetail } from '../components/detail/container/component'
import { StudentQueryService } from '../../../../../services/student/student-query.service'
import { StudentService } from '../../../../../services/student/student.service'

type View = 'list' | 'form' | 'detail'

@Component({
   selector: 'x-students-container',
   imports: [StudentList, StudentForm, StudentDetail],
   providers: [StudentService, StudentQueryService],
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentsComponent {
   currentView = signal<View>('list')
   selectedStudentId = signal<string | null>(null)
   isEditMode = signal<boolean>(false)

   showList(): void {
      this.currentView.set('list')
      this.selectedStudentId.set(null)
      this.isEditMode.set(false)
   }

   showForm(studentId: string | null = null): void {
      this.currentView.set('form')
      this.selectedStudentId.set(studentId)
      this.isEditMode.set(!!studentId)
   }

   showDetail(studentId: string): void {
      this.currentView.set('detail')
      this.selectedStudentId.set(studentId)
   }
}
