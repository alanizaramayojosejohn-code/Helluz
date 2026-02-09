import { BranchForm } from './../ui/admin/pages/branches/components/form/form'
import { FormGroup } from '@angular/forms'
import { FieldValue } from '@angular/fire/firestore'

export class FormUtils {
   static isValidField(form: FormGroup, fieldName: string): boolean | null {
      return !!form.controls[fieldName].errors && form.controls[fieldName].touched
   }

   static getNumberError(form: FormGroup, FieldValue: string): string | null {
      if (!form.controls[FieldValue]) return null

      const errors = form.controls[FieldValue].errors ?? {}

      for (const key of Object.keys(errors)) {
         switch (key) {
            case 'required':
               return 'Este campo es obligatorio'

            case 'minlength':
               return `Mínimo de ${errors['minlength'].requiredLength} caracteres.`

            case 'min':
               return `Valor mínimo de ${errors['min'].min}`
         }
      }

      return null;
   }
}
