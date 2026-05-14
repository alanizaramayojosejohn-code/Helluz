import { Injectable } from '@angular/core'
import ExcelJS from 'exceljs'
import { InstructorAttendance } from '../../app/models/instructorAttendance.model'
import { StudentAttendance } from '../../app/models/studentattendance.model'
import { ScheduleGroup } from '../../app/ui/admin/pages/finance/container/component'

const BRAND_RED = 'FFB91C1C'
const HEADER_BG = 'FFF5F0EE'
const SUBTOTAL_BG = 'FFFAF6EE'
const TOTAL_BG = 'FFFDE8E8'
const WHITE = 'FFFFFFFF'
const DARK_INK = 'FF1A1410'

function dateTag(): string {
  return new Date().toISOString().slice(0, 10)
}

function applyHeaderRow(row: ExcelJS.Row, columns: number): void {
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > columns) return
    cell.font = { bold: true, color: { argb: DARK_INK }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFDDCCBB' } },
    }
  })
  row.height = 20
}

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  async exportFinanzas(
    groups: ScheduleGroup[],
    totalRecaudado: number,
    totalInscripciones: number,
    dateRange: { start: Date; end: Date },
  ): Promise<void> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Helluz'
    const ws = wb.addWorksheet('Finanzas')

    ws.columns = [
      { key: 'horario', width: 30 },
      { key: 'instructor', width: 22 },
      { key: 'alumno', width: 24 },
      { key: 'membresia', width: 20 },
      { key: 'metodo', width: 18 },
      { key: 'monto', width: 14 },
    ]

    // Title
    ws.mergeCells('A1:F1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `Reporte de Finanzas — ${dateRange.start.toLocaleDateString('es-BO')} al ${dateRange.end.toLocaleDateString('es-BO')}`
    titleCell.font = { bold: true, size: 13, color: { argb: BRAND_RED } }
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
    ws.getRow(1).height = 26

    // Summary
    ws.mergeCells('A2:C2')
    ws.getCell('A2').value = `Total inscripciones: ${totalInscripciones}`
    ws.getCell('A2').font = { size: 10, color: { argb: DARK_INK } }
    ws.mergeCells('D2:F2')
    ws.getCell('D2').value = `Total recaudado: Bs ${totalRecaudado.toFixed(2)}`
    ws.getCell('D2').font = { bold: true, size: 10, color: { argb: BRAND_RED } }
    ws.getRow(2).height = 18

    ws.addRow([])

    // Column headers
    const headerRow = ws.addRow(['Horario', 'Instructor', 'Alumno', 'Membresía', 'Método de Pago', 'Monto (Bs)'])
    applyHeaderRow(headerRow, 6)

    for (const group of groups) {
      for (const enrollment of group.enrollments) {
        const dataRow = ws.addRow([
          group.scheduleLabel,
          group.instructorName,
          enrollment.studentName,
          enrollment.membershipName ?? '',
          enrollment.paymentMethod ?? '',
          enrollment.cost ?? 0,
        ])
        dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
          if (col > 6) return
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } }
          cell.font = { size: 10, color: { argb: DARK_INK } }
          cell.alignment = { vertical: 'middle' }
          if (col === 6) {
            cell.numFmt = '#,##0.00'
            cell.alignment = { horizontal: 'right', vertical: 'middle' }
          }
        })
        dataRow.height = 18
      }

      // Subtotal row
      const subtotalRow = ws.addRow(['', '', '', '', 'Subtotal', group.subtotal])
      subtotalRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > 6) return
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTOTAL_BG } }
        cell.font = { bold: true, size: 10, color: { argb: DARK_INK } }
        if (col === 6) {
          cell.numFmt = '#,##0.00'
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
          cell.font = { bold: true, size: 10, color: { argb: 'FF166534' } }
        }
      })
      subtotalRow.height = 18
    }

    // Grand total
    const totalRow = ws.addRow(['', '', '', '', 'TOTAL', totalRecaudado])
    totalRow.eachCell({ includeEmpty: true }, (cell, col) => {
      if (col > 6) return
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } }
      cell.font = { bold: true, size: 11, color: { argb: BRAND_RED } }
      if (col === 6) {
        cell.numFmt = '#,##0.00'
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
    })
    totalRow.height = 22

    await this.download(wb, `finanzas_${dateTag()}.xlsx`)
  }

  async exportAsistenciaInstructores(attendances: InstructorAttendance[], fecha: Date): Promise<void> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Helluz'
    const ws = wb.addWorksheet('Asistencia Instructores')

    ws.columns = [
      { key: 'fecha', width: 20 },
      { key: 'instructor', width: 22 },
      { key: 'horario', width: 18 },
      { key: 'llegada', width: 12 },
      { key: 'retraso', width: 14 },
      { key: 'salida', width: 12 },
      { key: 'hProg', width: 14 },
      { key: 'hReal', width: 12 },
      { key: 'estado', width: 18 },
    ]

    // Title
    ws.mergeCells('A1:I1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `Asistencia Instructores — ${fecha.toLocaleDateString('es-BO')}`
    titleCell.font = { bold: true, size: 13, color: { argb: BRAND_RED } }
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
    ws.getRow(1).height = 26

    ws.addRow([])

    const headerRow = ws.addRow([
      'Fecha / Hora', 'Instructor', 'Horario',
      'Llegada', 'Retraso (min)', 'Salida',
      'Horas Prog.', 'Horas Real', 'Estado',
    ])
    applyHeaderRow(headerRow, 9)

    const statusLabel: Record<string, string> = {
      presente: 'Presente',
      retrasado: 'Retrasado',
      falta: 'Falta',
      permiso: 'Permiso',
      'salida-anticipada': 'Salida anticipada',
    }
    const statusColor: Record<string, string> = {
      presente: 'FF166534',
      retrasado: 'FF92400E',
      falta: BRAND_RED,
      permiso: 'FF1E40AF',
      'salida-anticipada': 'FF9A3412',
    }

    for (const a of attendances) {
      const fecha = a.createdAt.toDate().toLocaleString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      const dataRow = ws.addRow([
        fecha,
        a.instructorName,
        `${a.expectedStartTime} - ${a.expectedEndTime}`,
        a.actualArrivalTime,
        a.isLate ? a.minutesLate : 0,
        a.actualDepartureTime ?? '—',
        a.scheduledHours,
        a.actualHours ?? '—',
        statusLabel[a.status] ?? a.status,
      ])
      dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > 9) return
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } }
        cell.font = { size: 10, color: { argb: DARK_INK } }
        cell.alignment = { vertical: 'middle' }
        if (col === 9) {
          cell.font = { bold: true, size: 10, color: { argb: statusColor[a.status] ?? DARK_INK } }
        }
      })
      dataRow.height = 18
    }

    await this.download(wb, `asistencia_instructores_${dateTag()}.xlsx`)
  }

  async exportAsistenciaAlumnos(attendances: StudentAttendance[], fecha: Date): Promise<void> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Helluz'
    const ws = wb.addWorksheet('Asistencia Alumnos')

    ws.columns = [
      { key: 'fecha', width: 20 },
      { key: 'alumno', width: 24 },
      { key: 'sesion', width: 12 },
      { key: 'restantes', width: 14 },
      { key: 'estado', width: 14 },
    ]

    // Title
    ws.mergeCells('A1:E1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `Asistencia Alumnos — ${fecha.toLocaleDateString('es-BO')}`
    titleCell.font = { bold: true, size: 13, color: { argb: BRAND_RED } }
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
    ws.getRow(1).height = 26

    ws.addRow([])

    const headerRow = ws.addRow(['Fecha / Hora', 'Estudiante', 'Sesión #', 'Sesiones Rest.', 'Estado'])
    applyHeaderRow(headerRow, 5)

    const statusColor: Record<string, string> = {
      presente: 'FF166534',
      falta: BRAND_RED,
      permiso: 'FF92400E',
    }

    for (const a of attendances) {
      const fecha = a.createdAt.toDate().toLocaleString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      const dataRow = ws.addRow([
        fecha,
        a.studentName,
        a.sessionNumber,
        a.remainingSessionsAfter,
        a.status.charAt(0).toUpperCase() + a.status.slice(1),
      ])
      dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > 5) return
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } }
        cell.font = { size: 10, color: { argb: DARK_INK } }
        cell.alignment = { vertical: 'middle' }
        if (col === 5) {
          cell.font = { bold: true, size: 10, color: { argb: statusColor[a.status] ?? DARK_INK } }
        }
      })
      dataRow.height = 18
    }

    await this.download(wb, `asistencia_alumnos_${dateTag()}.xlsx`)
  }

  private async download(wb: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
