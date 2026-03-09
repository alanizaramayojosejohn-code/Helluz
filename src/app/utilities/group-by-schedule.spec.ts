import { describe, it, expect } from 'vitest'

function groupBySchedule(enrollments: any[]) {
  const map = new Map<string, any>()

  for (const enrollment of enrollments) {
    const key = enrollment.scheduleId ?? 'sin-horario'

    if (!map.has(key)) {
      map.set(key, {
        scheduleId:     key,
        scheduleLabel:  enrollment.scheduleLabel ?? 'Sin horario',
        instructorName: enrollment.instructorName ?? 'Sin instructor',
        enrollments:    [],
        count:          0,
        subtotal:       0,
      })
    }

    const group = map.get(key)!
    group.enrollments.push(enrollment)
    group.count++
    group.subtotal += enrollment.cost ?? 0
  }

  return Array.from(map.values())
}

describe('groupBySchedule', () => {
  it('agrupa correctamente por scheduleId', () => {
    const enrollments = [
      { scheduleId: 'h1', scheduleLabel: '08:00 - 09:00', cost: 100 },
      { scheduleId: 'h1', scheduleLabel: '08:00 - 09:00', cost: 100 },
      { scheduleId: 'h2', scheduleLabel: '10:00 - 11:00', cost: 150 },
    ]

    const result = groupBySchedule(enrollments)

    expect(result).toHaveLength(2)
    expect(result[0].count).toBe(2)
    expect(result[0].subtotal).toBe(200)
  })

  it('retorna array vacío si no hay inscripciones', () => {
    expect(groupBySchedule([])).toHaveLength(0)
  })
})
