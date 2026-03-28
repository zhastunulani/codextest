import { pgTable, text, integer, serial, real, boolean, unique } from 'drizzle-orm/pg-core'

// ==================== Рөлдер & Қолданушылар ====================

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  login: text('login').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('manager'),
  departmentId: integer('department_id').references(() => departments.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== Ұйым құрылымы ====================

export const positions = pgTable('positions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== Қызметкерлер ====================

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  positionId: integer('position_id').references(() => positions.id),
  photoPath: text('photo_path'),
  faceDescriptor: text('face_descriptor'), // JSON array of 128 floats
  scheduleId: integer('schedule_id').references(() => schedules.id),
  salaryRate: real('salary_rate').notNull().default(0),
  vacationDaysLeft: integer('vacation_days_left').notNull().default(24),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== Жұмыс кестесі ====================

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // "5/2 стандарт", "2/2 ауысым", т.б.
  type: text('type').notNull(), // '5/2', '2/2', '6/1', 'shift', 'free'
  workStart: text('work_start').notNull(), // "09:00"
  workEnd: text('work_end').notNull(), // "18:00"
  workDays: text('work_days').notNull(), // JSON: [1,2,3,4,5] (1=дүйсенбі)
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== Attendance ====================

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  date: text('date').notNull(), // YYYY-MM-DD
  checkIn: text('check_in'), // HH:MM:SS
  checkOut: text('check_out'), // HH:MM:SS
  checkInPhoto: text('check_in_photo'),
  checkOutPhoto: text('check_out_photo'),
  isLate: boolean('is_late').notNull().default(false),
  lateMinutes: integer('late_minutes').notNull().default(0),
  overtimeMinutes: integer('overtime_minutes').notNull().default(0),
  status: text('status').notNull().default('present'),
}, (table) => [
  unique('attendance_employee_date').on(table.employeeId, table.date),
])

// ==================== Демалыс / Больничный ====================

export const leaves = pgTable('leaves', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  type: text('type').notNull(), // 'vacation', 'sick', 'maternity', 'other'
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  approvedBy: integer('approved_by').references(() => users.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== Айлық ====================

export const salarySettings = pgTable('salary_settings', {
  id: serial('id').primaryKey(),
  baseCurrency: text('base_currency').notNull().default('KZT'),
  overtimeCoefficient: real('overtime_coefficient').notNull().default(1.5),
  weekendCoefficient: real('weekend_coefficient').notNull().default(2.0),
  standardHoursPerDay: integer('standard_hours_per_day').notNull().default(8),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const payroll = pgTable('payroll', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  workDays: integer('work_days').notNull().default(0),
  workHours: real('work_hours').notNull().default(0),
  overtimeHours: real('overtime_hours').notNull().default(0),
  baseAmount: real('base_amount').notNull().default(0),
  overtimeAmount: real('overtime_amount').notNull().default(0),
  deductions: real('deductions').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== KPI ====================

export const kpiTargets = pgTable('kpi_targets', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').references(() => departments.id),
  metric: text('metric').notNull(), // 'attendance_rate', 'overtime_limit', 'late_limit', 'productivity'
  targetValue: real('target_value').notNull(),
  period: text('period').notNull(), // "2026-03" (year-month)
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const kpiResults = pgTable('kpi_results', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').references(() => departments.id),
  employeeId: integer('employee_id').references(() => employees.id),
  metric: text('metric').notNull(),
  actualValue: real('actual_value').notNull(),
  period: text('period').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== Overtime ережелері ====================

export const overtimeRules = pgTable('overtime_rules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  thresholdHours: real('threshold_hours').notNull(), // осы сағаттан кейін overtime
  coefficient: real('coefficient').notNull().default(1.5),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ==================== Audit Log ====================

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
