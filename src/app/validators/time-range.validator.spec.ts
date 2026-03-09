import '@angular/compiler'
import { describe, it, expect } from 'vitest'
import { FormControl, FormGroup } from '@angular/forms'
import { timeRangeValidator } from './time-range.validator'

function createForm(startTime: string, endTime: string): FormGroup {
   return new FormGroup(
      {
         startTime: new FormControl(startTime),
         endTime: new FormControl(endTime),
      },
      { validators: timeRangeValidator }
   )
}

describe('timeRangeValidator', () => {
   it('retorna null cuando endTime es posterior a startTime', () => {
      const form = createForm('08:00', '09:00')
      expect(timeRangeValidator(form)).toBeNull()
   })

   it('retorna null cuando hay diferencia de minutos', () => {
      const form = createForm('08:00', '08:30')
      expect(timeRangeValidator(form)).toBeNull()
   })

   it('retorna null cuando los campos están vacíos', () => {
      const form = createForm('', '')
      expect(timeRangeValidator(form)).toBeNull()
   })

   it('retorna null cuando solo startTime está vacío', () => {
      const form = createForm('', '09:00')
      expect(timeRangeValidator(form)).toBeNull()
   })

   it('retorna null cuando solo endTime está vacío', () => {
      const form = createForm('08:00', '')
      expect(timeRangeValidator(form)).toBeNull()
   })

   it('retorna error cuando endTime es igual a startTime', () => {
      const form = createForm('08:00', '08:00')
      expect(timeRangeValidator(form)).toEqual({ invalidTimeRange: true })
   })

   it('retorna error cuando endTime es anterior a startTime', () => {
      const form = createForm('10:00', '09:00')
      expect(timeRangeValidator(form)).toEqual({ invalidTimeRange: true })
   })

   it('retorna error cuando endTime es anterior por minutos', () => {
      const form = createForm('08:30', '08:00')
      expect(timeRangeValidator(form)).toEqual({ invalidTimeRange: true })
   })

   it('valida correctamente horarios de medianoche', () => {
      const form = createForm('23:00', '23:59')
      expect(timeRangeValidator(form)).toBeNull()
   })

   it('retorna error si endTime es 00:00 y startTime es 23:00', () => {
      const form = createForm('23:00', '00:00')
      expect(timeRangeValidator(form)).toEqual({ invalidTimeRange: true })
   })
})
