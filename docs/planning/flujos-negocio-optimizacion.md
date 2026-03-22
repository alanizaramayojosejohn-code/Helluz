# Helluz — Flujos de Negocio: Analisis y Propuestas de Optimizacion

> Documento de planificacion — No implementar sin revision y aprobacion.
> Fecha: 2026-03-22 | Rama: xRedesign

---

## Tabla de Contenido

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Flujo: Registro de Usuarios](#2-flujo-registro-de-usuarios)
3. [Flujo: Gestion de Alumnos](#3-flujo-gestion-de-alumnos)
4. [Flujo: Inscripciones](#4-flujo-inscripciones)
5. [Flujo: Membresias](#5-flujo-membresias)
6. [Flujo: Asistencias](#6-flujo-asistencias)
7. [Flujo: Horarios](#7-flujo-horarios)
8. [Flujo: Finanzas](#8-flujo-finanzas)
9. [Flujo: Sucursales e Instructores](#9-flujo-sucursales-e-instructores)
10. [Problemas Transversales](#10-problemas-transversales)
11. [Roadmap Sugerido](#11-roadmap-sugerido)

---

## 1. Resumen Ejecutivo

### Estado Actual
La app cubre los flujos operativos core de un gimnasio: registro, inscripciones, membresias, asistencias, horarios y finanzas. Sin embargo, presenta:

- **Pasos excesivos** en procesos clave (inscripcion: 8-10 clicks)
- **Falta de visibilidad** para alumnos e instructores (no tienen dashboard propio)
- **Datos huerfanos** al eliminar registros (sin soft delete ni cascade)
- **Valores hardcodeados** (disciplina='MMA', dias permitidos=[Lun-Vie], radio=100m)
- **Sistemas duplicados** de asistencia (3 servicios para el mismo concepto)
- **Sin tracking de pagos** (se registra el costo pero no si se cobro)

### Metricas Clave del Estado Actual
| Proceso | Pasos Actuales | Pasos Ideales | Reduccion |
|---------|---------------|---------------|-----------|
| Inscribir alumno nuevo | 14-17 | 5-7 | ~60% |
| Renovar membresia | 8-10 | 2-3 | ~70% |
| Marcar asistencia alumno | 3 | 2 | ~33% |
| Generar reporte financiero | 4 | 1-2 | ~60% |
| Registrar usuario nuevo | 5-7 | 3 | ~55% |

---

## 2. Flujo: Registro de Usuarios

### Flujo Actual (5-7 pasos)
```
Admin pre-registra email + rol en "Usuarios Pendientes"
    → Usuario visita /registrarUsuario
    → Ingresa email + password
    → Sistema busca en "usuariosPendientes"
    → Si existe: hereda rol/status, crea cuenta Firebase + Firestore
    → Si no existe: crea cuenta como "inactivo" (sin acceso)
    → Admin debe activar manualmente
```

### Problemas Detectados
1. **Flujo desconectado**: El usuario puede registrarse sin pre-registro y queda "inactivo" sin saber por que
2. **Sin notificacion**: El admin no sabe cuando un usuario pendiente se registro
3. **Sin link de invitacion**: El admin tiene que comunicar manualmente al usuario que se registre
4. **Error silencioso**: Si el admin borra el pre-registro, el usuario recibe "no autorizado" generico

### Propuestas de Valor

#### P2.1 — Registro con Link de Invitacion
**Impacto**: Alto | **Esfuerzo**: Medio
- Admin genera un link unico `/registrarUsuario?token=xxx`
- El link pre-llena el email y garantiza el rol
- Elimina la necesidad de que el usuario sepa que debe registrarse
- **Reduccion**: De 7 pasos a 3 (click link → password → listo)

#### P2.2 — Eliminar Pre-registro, Usar Aprobacion
**Impacto**: Alto | **Esfuerzo**: Bajo
- Cualquiera se registra libremente
- Admin recibe notificacion en dashboard: "3 usuarios pendientes de aprobacion"
- Admin aprueba con 1 click asignando rol
- **Reduccion**: Elimina el flujo de pre-registro completo

#### P2.3 — Registro Unificado Alumno + Usuario
**Impacto**: Medio | **Esfuerzo**: Medio
- Al crear un alumno, opcionalmente se crea cuenta de acceso
- Evita que el alumno sea una entidad sin acceso al sistema
- El alumno podria ver su dashboard (sesiones, asistencias, vencimientos)

### Decision Pendiente
> [ ] P2.1 — Link de invitacion
> [ ] P2.2 — Registro libre + aprobacion
> [ ] P2.3 — Registro unificado
> [ ] Mantener flujo actual

---

## 3. Flujo: Gestion de Alumnos

### Flujo Actual
```
Admin → Alumnos → + Nuevo Alumno
    → Llena formulario (nombre, apellido, CI, telefono, email, contacto emergencia)
    → Validacion async de CI unico
    → Guardar
    → Alumno creado pero SIN membresia ni inscripcion
    → Admin debe ir a OTRA seccion (Inscripciones) para vincular
```

### Problemas Detectados
1. **Crear alumno y inscribirlo son 2 flujos separados**: El admin debe navegar a otra seccion
2. **Sin busqueda en lista**: Solo filtro por status, no por nombre/CI
3. **Eliminacion destructiva**: `delete` real, no soft delete. Pierde historial
4. **Sin historial**: No se puede ver inscripciones/asistencias pasadas del alumno
5. **Datos de emergencia minimos**: Sin direccion, sin tipo de sangre, sin alergias

### Propuestas de Valor

#### P3.1 — Flujo "Crear Alumno + Inscribir" Unificado
**Impacto**: Alto | **Esfuerzo**: Medio
- Wizard de 2 pasos:
  1. Datos del alumno (nombre, CI, telefono)
  2. Seleccionar membresia + horario + metodo de pago
- Un solo flujo en lugar de navegar entre 2 secciones
- **Reduccion**: De 14-17 pasos a 5-7

#### P3.2 — Detalle del Alumno como Hub Central
**Impacto**: Alto | **Esfuerzo**: Medio
- La pagina de detalle del alumno muestra TODO:
  - Datos personales (editables inline)
  - Inscripcion activa (con barra de progreso de sesiones)
  - Historial de inscripciones pasadas
  - Historial de asistencias (ultimos 30 dias)
  - Boton "Renovar Membresia" directo
- Elimina la necesidad de navegar entre Alumnos/Inscripciones/Asistencias

#### P3.3 — Busqueda Global de Alumnos
**Impacto**: Medio | **Esfuerzo**: Bajo
- Barra de busqueda por nombre, apellido o CI
- Resultados instantaneos (filtro client-side sobre datos cargados)
- Acceso rapido al detalle del alumno

#### P3.4 — Soft Delete con Historial
**Impacto**: Alto | **Esfuerzo**: Bajo
- En lugar de eliminar, marcar `status: 'eliminado'`
- Mantener historial de inscripciones y asistencias
- Permitir reactivacion si el alumno regresa
- Filtro "Mostrar eliminados" en la lista

### Decision Pendiente
> [ ] P3.1 — Wizard crear + inscribir
> [ ] P3.2 — Detalle como hub central
> [ ] P3.3 — Busqueda global
> [ ] P3.4 — Soft delete

---

## 4. Flujo: Inscripciones

### Flujo Actual (8-10 pasos)
```
Inscripciones → + Nueva Inscripcion
    → Seleccionar alumno (dropdown busqueda por nombre/CI)
    → Seleccionar sucursal
    → Seleccionar membresia (auto-calcula duracion y sesiones)
    → Seleccionar horario (cascada desde sucursal)
    → Fecha inicio (default: hoy)
    → Metodo de pago (Efectivo/QR)
    → Guardar
    → Se desnormaliza: studentName, membershipName, branchName,
      scheduleLabel, instructorName, cost, totalSessions, allowedDays
```

### Problemas Detectados
1. **Demasiados campos desnormalizados**: Un cambio de nombre en cualquier entidad requiere actualizar TODAS las inscripciones
2. **Sin deteccion de conflictos de horario**: Un alumno puede inscribirse en 2 horarios que se solapan
3. **Renovacion manual**: Cuando vence, hay que crear inscripcion nueva desde cero
4. **Sin congelamiento**: Si el alumno viaja, no puede pausar sesiones
5. **Sin confirmacion de pago**: Se registra metodo de pago pero no si efectivamente pago
6. **Status auto-expiracion**: Solo se verifica al cargar la lista, no proactivamente

### Propuestas de Valor

#### P4.1 — Renovacion con 1 Click
**Impacto**: Alto | **Esfuerzo**: Bajo
- Cuando una inscripcion esta por vencer (< 7 dias o 0 sesiones):
  - Mostrar banner "Renovar" en detalle del alumno
  - Click → Pre-llena misma membresia, horario, sucursal
  - Solo confirmar metodo de pago → Listo
- **Reduccion**: De 8-10 pasos a 2-3

#### P4.2 — Eliminar Desnormalizacion Excesiva
**Impacto**: Alto | **Esfuerzo**: Alto
- Guardar solo IDs (studentId, membershipId, scheduleId, branchId)
- Resolver nombres en tiempo de lectura con joins client-side
- Beneficio: Cambiar nombre de alumno/membresia/horario no requiere actualizar inscripciones
- Tradeoff: Lecturas mas lentas (mitigar con cache local)

#### P4.3 — Estado de Pago
**Impacto**: Alto | **Esfuerzo**: Bajo
- Agregar campo `paymentStatus: 'pendiente' | 'pagado' | 'parcial'`
- Dashboard muestra "5 pagos pendientes" como alerta
- Filtro de inscripciones por estado de pago
- Reportes financieros mas precisos (recaudado vs por cobrar)

#### P4.4 — Congelamiento de Sesiones
**Impacto**: Medio | **Esfuerzo**: Medio
- Boton "Congelar" en inscripcion activa
- Pausa el conteo de dias (extiende endDate)
- No permite marcar asistencia mientras congelada
- Historial de congelamientos visible

#### P4.5 — Alerta de Vencimiento Proximo
**Impacto**: Medio | **Esfuerzo**: Bajo
- En dashboard admin: "8 membresias vencen esta semana"
- Lista clickeable que lleva directo al alumno
- Facilita la renovacion proactiva

### Decision Pendiente
> [ ] P4.1 — Renovacion 1 click
> [ ] P4.2 — Reducir desnormalizacion
> [ ] P4.3 — Estado de pago
> [ ] P4.4 — Congelamiento
> [ ] P4.5 — Alertas de vencimiento

---

## 5. Flujo: Membresias

### Flujo Actual
```
Membresias → + Nueva Membresia
    → Nombre (unico)
    → Dias de duracion (default 30)
    → Total sesiones (default 12)
    → Costo
    → Status
    → [allowedDays HARDCODEADO a Lun-Vie en el servicio]
```

### Problemas Detectados
1. **allowedDays hardcodeado**: Todas las membresias son Lun-Vie, sin importar lo que diga el form
2. **Sin tipos de membresia**: No hay distincion entre grupal/personal, manana/tarde
3. **Sin precios escalonados**: No hay descuentos por trimestre/semestre
4. **Cambio de membresia no se propaga**: Si cambias el precio, inscripciones activas mantienen el precio viejo (correcto para historial, pero confuso)

### Propuestas de Valor

#### P5.1 — Dias Permitidos Configurables
**Impacto**: Alto | **Esfuerzo**: Bajo
- Remover hardcode de `[1,2,3,4,5]` en MembershipService
- Usar los dias del formulario (checkboxes Lun-Sab)
- Permite crear membresias de fin de semana, 3x semana, etc.

#### P5.2 — Categorias de Membresia
**Impacto**: Medio | **Esfuerzo**: Bajo
- Agregar campo `category: 'individual' | 'grupal' | 'premium' | 'prueba'`
- Filtrables en lista y en dropdown de inscripcion
- Permite crear membresia de prueba (0 costo, 3 sesiones, 7 dias)

#### P5.3 — Membresia de Prueba Automatica
**Impacto**: Medio | **Esfuerzo**: Bajo
- Al crear alumno nuevo, ofrecer "Agregar clase de prueba gratis"
- Crea inscripcion con membresia-prueba pre-configurada (1 sesion, 1 dia)
- Reduce friccion para nuevos alumnos

### Decision Pendiente
> [ ] P5.1 — Dias configurables
> [ ] P5.2 — Categorias
> [ ] P5.3 — Membresia de prueba

---

## 6. Flujo: Asistencias

### Flujo Actual — Alumno
```
Alumno visita /asistenciaalumnos
    → Ingresa CI manualmente
    → Sistema busca alumno por CI
    → Busca inscripcion activa
    → Valida sesiones restantes > 0 y no marcado hoy
    → Crea registro de asistencia
    → Incrementa usedSessions en inscripcion
    → Muestra "Asistencia registrada — X sesiones restantes"
```

### Flujo Actual — Instructor
```
Instructor visita /asistenciainstructores (ruta no activa)
    → Ingresa CI
    → Sistema busca instructor y horario del dia
    → Valida geolocalizacion (100m del gym)
    → Calcula puntualidad (>10min = retrasado)
    → Crea registro con hora de llegada
    → [Mas tarde] Marca salida con hora de partida
```

### Problemas Detectados
1. **3 servicios de asistencia**: `AttendanceService` (sin usar), `StudentAttendanceService`, `InstructorAttendanceService`
2. **CI manual sin QR real**: La UI menciona QR pero no hay implementacion
3. **Sin validacion de dia de semana** en asistencia de alumno (allowedDays ignorado)
4. **Sin dashboard de alumno**: El alumno no puede ver su historial ni sesiones restantes
5. **Salida de instructor es opcional**: No hay enforcement, se pierde dato de horas trabajadas
6. **Sin notificacion de falta**: Si un alumno habitual no asiste, nadie se entera

### Propuestas de Valor

#### P6.1 — Unificar Servicios de Asistencia
**Impacto**: Alto | **Esfuerzo**: Medio
- Eliminar `AttendanceService` (codigo muerto)
- Mantener `StudentAttendanceService` e `InstructorAttendanceService` como servicios especializados
- Estandarizar interfaz comun: `markArrival()`, `markDeparture()`, `getHistory()`

#### P6.2 — Validar Dia de Semana en Asistencia de Alumno
**Impacto**: Alto | **Esfuerzo**: Bajo
- Verificar que el dia actual esta en `enrollment.allowedDays`
- Evitar que un alumno de Lun-Mie-Vie marque asistencia un Martes
- Mensaje claro: "Tu membresia no incluye este dia"

#### P6.3 — Pantalla de Asistencia Mejorada (Publica)
**Impacto**: Alto | **Esfuerzo**: Medio
- Despues de marcar asistencia, mostrar mini-dashboard:
  - Sesiones usadas / totales (barra de progreso)
  - Dias restantes de membresia
  - Proximo dia permitido
  - Historial de ultimas 5 asistencias
- Reduce llamadas al admin por "cuantas sesiones me quedan?"

#### P6.4 — QR Code Real
**Impacto**: Medio | **Esfuerzo**: Medio
- Generar QR por alumno (contenido: CI del alumno)
- Pagina publica con lector de camara
- Scan → Marca asistencia automaticamente
- Alternativa: Mantener input manual de CI como fallback

#### P6.5 — Auto-Salida de Instructor
**Impacto**: Bajo | **Esfuerzo**: Bajo
- Si el instructor no marca salida, auto-marcar al finalizar horario programado
- Job que corre al cierre del dia (o cloud function)
- Marca `status: 'sin-salida'` para audit

### Decision Pendiente
> [ ] P6.1 — Unificar servicios
> [ ] P6.2 — Validar dia de semana
> [ ] P6.3 — Mini-dashboard post-asistencia
> [ ] P6.4 — QR code
> [ ] P6.5 — Auto-salida

---

## 7. Flujo: Horarios

### Flujo Actual
```
Horarios → + Nuevo Horario
    → Sucursal (dropdown)
    → Dias (checkboxes: Lun-Sab)
    → Hora inicio / Hora fin
    → Instructor (opcional, cascada desde sucursal)
    → [discipline HARDCODEADO a 'MMA']
    → Validacion de conflictos de horario
    → Guardar
```

### Problemas Detectados
1. **Disciplina hardcodeada**: Todo es 'MMA', no se puede agregar Boxeo, BJJ, Muay Thai
2. **Sin capacidad maxima**: No hay limite de alumnos por clase
3. **Sin cancelacion de clase**: No se puede marcar "clase cancelada hoy"
4. **Sin instructor sustituto**: Si el instructor falta, no hay asignacion temporal

### Propuestas de Valor

#### P7.1 — Disciplinas Configurables
**Impacto**: Alto | **Esfuerzo**: Bajo
- Crear coleccion `disciplinas` o array en configuracion
- Dropdown en formulario de horario
- Permite: MMA, Boxeo, BJJ, Muay Thai, Kickboxing, etc.
- Filtros de horarios por disciplina

#### P7.2 — Capacidad Maxima por Clase
**Impacto**: Medio | **Esfuerzo**: Medio
- Campo `maxStudents` en Schedule
- Al inscribir, verificar que no se exceda capacidad
- Mostrar "X/Y cupos disponibles" en lista de horarios
- Beneficio: Evitar sobrecupo, mejorar calidad de clase

#### P7.3 — Vista Calendario Semanal
**Impacto**: Medio | **Esfuerzo**: Medio
- En lugar de tabla, mostrar horarios como calendario semanal
- Bloques de color por instructor o disciplina
- Vista rapida de huecos y solapamientos
- Drag & drop para reasignar (futuro)

### Decision Pendiente
> [ ] P7.1 — Disciplinas configurables
> [ ] P7.2 — Capacidad maxima
> [ ] P7.3 — Vista calendario

---

## 8. Flujo: Finanzas

### Flujo Actual
```
Finanzas → Seleccionar sucursal + rango de fechas → Buscar
    → Muestra: Total recaudado + Total inscripciones
    → Tabla agrupada por horario: label, cantidad, subtotal
```

### Problemas Detectados
1. **Solo reporta costo de inscripcion**: No verifica si el pago se recibio realmente
2. **Sin desglose por metodo de pago**: No distingue Efectivo vs QR
3. **Sin gastos**: Solo ingresos, no hay tracking de egresos
4. **Sin vista de dashboard**: Hay que buscar manualmente cada vez
5. **Sin exportacion**: No se puede descargar PDF/Excel
6. **Datos estancados**: scheduleLabel se desnormalizo al crear inscripcion, si cambia el horario el reporte muestra datos viejos

### Propuestas de Valor

#### P8.1 — Dashboard Financiero en Home del Admin
**Impacto**: Alto | **Esfuerzo**: Medio
- KPIs automaticos en el home del admin (sin buscar):
  - Ingresos del mes actual
  - Comparativa vs mes anterior (% crecimiento)
  - Inscripciones nuevas esta semana
  - Membresias por vencer esta semana
  - Pagos pendientes (si se implementa P4.3)

#### P8.2 — Desglose por Metodo de Pago
**Impacto**: Medio | **Esfuerzo**: Bajo
- Agregar al reporte: columna de metodo de pago
- Subtotal por metodo: "Efectivo: $X | QR: $Y"
- Ayuda a cuadrar caja diaria

#### P8.3 — Exportar Reporte
**Impacto**: Medio | **Esfuerzo**: Medio
- Boton "Descargar PDF" o "Descargar Excel"
- Incluye: fecha, sucursal, desglose por horario, totales
- Util para contabilidad y reportes a socios

### Decision Pendiente
> [ ] P8.1 — Dashboard financiero
> [ ] P8.2 — Desglose por pago
> [ ] P8.3 — Exportar reporte

---

## 9. Flujo: Sucursales e Instructores

### Problemas Detectados en Sucursales
1. **userId siempre 'user-default'**: No trackea quien creo la sucursal
2. **Sin datos operativos**: No hay direccion, telefono, horario de atencion
3. **Coordenadas obligatorias pero sin mapa**: El admin debe saber lat/long manualmente

### Problemas Detectados en Instructores
1. **Sin credenciales**: No se trackea certificaciones ni experiencia
2. **Sin tracking de pagos**: No hay tarifa por hora ni comisiones
3. **CI validacion async lenta**: Sin feedback visual claro

### Propuestas de Valor

#### P9.1 — Mapa para Seleccionar Ubicacion de Sucursal
**Impacto**: Medio | **Esfuerzo**: Medio
- Integrar Google Maps o Leaflet en formulario de sucursal
- Click en mapa → auto-llena lat/long
- Muestra radio de 100m para validacion de asistencia

#### P9.2 — Perfil de Instructor Enriquecido
**Impacto**: Bajo | **Esfuerzo**: Bajo
- Agregar campos: especialidad, fecha de ingreso, tarifa por hora
- Vista de detalle muestra: horarios asignados, puntualidad del mes, horas trabajadas

### Decision Pendiente
> [ ] P9.1 — Mapa para ubicacion
> [ ] P9.2 — Perfil enriquecido

---

## 10. Problemas Transversales

### 10.1 — Sin Dashboard para Alumno ni Instructor
**Estado actual**: Alumnos e instructores solo pueden marcar asistencia. No tienen visibilidad de su informacion.

**Propuesta**: Crear dashboards por rol:
- **Alumno**: Sesiones restantes, dias de membresia, historial, proxima clase
- **Instructor**: Horarios del dia, puntualidad del mes, alumnos en clase

### 10.2 — Eliminacion Destructiva en Toda la App
**Estado actual**: `delete()` real en Firestore. Sin recuperacion posible.

**Propuesta**: Implementar soft delete global:
- Campo `deletedAt: timestamp | null`
- Filtrar por `deletedAt == null` en queries
- Vista admin "Papelera" para recuperar
- Eliminar definitivamente despues de 30 dias

### 10.3 — Desnormalizacion Excesiva en Inscripciones
**Estado actual**: Enrollment guarda copias de: studentName, membershipName, branchName, scheduleLabel, instructorName, cost, allowedDays

**Propuesta**: Reducir a solo IDs + resolver en lectura. Mantener solo `cost` como snapshot (precio al momento de inscripcion).

### 10.4 — Valores Hardcodeados
| Valor | Ubicacion | Propuesta |
|-------|-----------|-----------|
| `'MMA'` | ScheduleForm | Campo editable + coleccion `disciplinas` |
| `[1,2,3,4,5]` | MembershipService | Usar valor del formulario |
| `100` metros | InstructorAttendanceService | Config por sucursal |
| `10` min tolerancia | InstructorAttendanceService | Config global |

### 10.5 — Codigo Muerto
- `AttendanceService` (generico) no se usa en produccion
- Rutas comentadas: `/alumnos`, `/inscripciones`, `/asistenciasa`
- Componente `Home` en `src/app/home/` (diferente al public home)

---

## 11. Roadmap Sugerido

### Fase 1 — Quick Wins (1-2 semanas)
Cambios de bajo esfuerzo y alto impacto:
- [ ] P5.1 — Remover hardcode de allowedDays
- [ ] P7.1 — Remover hardcode de disciplina
- [ ] P3.3 — Busqueda de alumnos
- [ ] P3.4 — Soft delete
- [ ] P6.2 — Validar dia de semana en asistencia
- [ ] Limpiar codigo muerto (AttendanceService, rutas comentadas)

### Fase 2 — Flujos Optimizados (2-4 semanas)
Reducir pasos en procesos clave:
- [ ] P3.1 — Wizard crear alumno + inscribir
- [ ] P4.1 — Renovacion con 1 click
- [ ] P4.3 — Estado de pago
- [ ] P4.5 — Alertas de vencimiento
- [ ] P8.1 — Dashboard financiero en home admin

### Fase 3 — Visibilidad y UX (3-4 semanas)
Mejorar la experiencia de todos los roles:
- [ ] P3.2 — Detalle de alumno como hub central
- [ ] P6.3 — Mini-dashboard post-asistencia
- [ ] P10.1 — Dashboard de alumno
- [ ] P10.1 — Dashboard de instructor
- [ ] P8.2 — Desglose por metodo de pago

### Fase 4 — Features Avanzados (4-6 semanas)
- [ ] P6.4 — QR code real
- [ ] P7.3 — Vista calendario semanal
- [ ] P9.1 — Mapa para sucursales
- [ ] P8.3 — Exportar reportes
- [ ] P4.4 — Congelamiento de sesiones
- [ ] P2.1 o P2.2 — Mejorar flujo de registro

---

## Notas

- Este documento es de planificacion. Ninguna propuesta debe implementarse sin aprobacion.
- Los numeros de "pasos" son estimados basados en el analisis del codigo actual.
- Las fases del roadmap son sugeridas y pueden reordenarse segun prioridades del negocio.
- Cada propuesta con prefijo `P#.#` es independiente y puede aprobarse/rechazarse individualmente.
