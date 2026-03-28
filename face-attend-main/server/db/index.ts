import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import bcryptjs from 'bcryptjs'
import { sql } from 'drizzle-orm'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/faceattend'

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('neon.tech') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
})

export const db = drizzle(pool, { schema })

// Кестелерді құру
async function initDatabase() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        department_id INTEGER REFERENCES departments(id),
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        work_start TEXT NOT NULL,
        work_end TEXT NOT NULL,
        work_days TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        department_id INTEGER REFERENCES departments(id),
        position_id INTEGER REFERENCES positions(id),
        photo_path TEXT,
        face_descriptor TEXT,
        schedule_id INTEGER REFERENCES schedules(id),
        salary_rate REAL NOT NULL DEFAULT 0,
        vacation_days_left INTEGER NOT NULL DEFAULT 24,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'manager',
        department_id INTEGER REFERENCES departments(id),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        date TEXT NOT NULL,
        check_in TEXT,
        check_out TEXT,
        check_in_photo TEXT,
        check_out_photo TEXT,
        is_late BOOLEAN NOT NULL DEFAULT false,
        late_minutes INTEGER NOT NULL DEFAULT 0,
        overtime_minutes INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'present',
        UNIQUE(employee_id, date)
      );

      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS salary_settings (
        id SERIAL PRIMARY KEY,
        base_currency TEXT NOT NULL DEFAULT 'KZT',
        overtime_coefficient REAL NOT NULL DEFAULT 1.5,
        weekend_coefficient REAL NOT NULL DEFAULT 2.0,
        standard_hours_per_day INTEGER NOT NULL DEFAULT 8,
        updated_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        work_days INTEGER NOT NULL DEFAULT 0,
        work_hours REAL NOT NULL DEFAULT 0,
        overtime_hours REAL NOT NULL DEFAULT 0,
        base_amount REAL NOT NULL DEFAULT 0,
        overtime_amount REAL NOT NULL DEFAULT 0,
        deductions REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS kpi_targets (
        id SERIAL PRIMARY KEY,
        department_id INTEGER REFERENCES departments(id),
        metric TEXT NOT NULL,
        target_value REAL NOT NULL,
        period TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS kpi_results (
        id SERIAL PRIMARY KEY,
        department_id INTEGER REFERENCES departments(id),
        employee_id INTEGER REFERENCES employees(id),
        metric TEXT NOT NULL,
        actual_value REAL NOT NULL,
        period TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS overtime_rules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        threshold_hours REAL NOT NULL,
        coefficient REAL NOT NULL DEFAULT 1.5,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      );
    `)

    // Seed: default admin
    const adminCheck = await client.query("SELECT id FROM users WHERE login = 'admin'")
    if (adminCheck.rows.length === 0) {
      const hash = bcryptjs.hashSync('admin123', 10)
      await client.query('INSERT INTO users (login, password, name, role) VALUES ($1, $2, $3, $4)', ['admin', hash, 'Администратор', 'admin'])
    }

    // Seed: default departments
    const deptCheck = await client.query('SELECT id FROM departments LIMIT 1')
    if (deptCheck.rows.length === 0) {
      await client.query("INSERT INTO departments (name) VALUES ('IT бөлімі'), ('Бухгалтерия'), ('HR бөлімі')")
    }

    // Seed: head user
    const headCheck = await client.query("SELECT id FROM users WHERE login = 'head'")
    if (headCheck.rows.length === 0) {
      const hash = bcryptjs.hashSync('head123', 10)
      await client.query('INSERT INTO users (login, password, name, role, department_id) VALUES ($1, $2, $3, $4, $5)', ['head', hash, 'Бөлім басшысы', 'head', 1])
    }

    // Seed: manager user
    const managerCheck = await client.query("SELECT id FROM users WHERE login = 'manager'")
    if (managerCheck.rows.length === 0) {
      const hash = bcryptjs.hashSync('manager123', 10)
      await client.query('INSERT INTO users (login, password, name, role) VALUES ($1, $2, $3, $4)', ['manager', hash, 'Менеджер', 'manager'])
    }

    // Seed: default salary settings
    const settingsCheck = await client.query('SELECT id FROM salary_settings LIMIT 1')
    if (settingsCheck.rows.length === 0) {
      await client.query('INSERT INTO salary_settings (base_currency, overtime_coefficient, weekend_coefficient, standard_hours_per_day) VALUES ($1, $2, $3, $4)', ['KZT', 1.5, 2.0, 8])
    }

    // Seed: default schedule
    const scheduleCheck = await client.query('SELECT id FROM schedules LIMIT 1')
    if (scheduleCheck.rows.length === 0) {
      await client.query('INSERT INTO schedules (name, type, work_start, work_end, work_days) VALUES ($1, $2, $3, $4, $5)', ['Стандарт 5/2', '5/2', '09:00', '18:00', JSON.stringify([1, 2, 3, 4, 5])])
    }

    // Seed: default overtime rule
    const ruleCheck = await client.query('SELECT id FROM overtime_rules LIMIT 1')
    if (ruleCheck.rows.length === 0) {
      await client.query('INSERT INTO overtime_rules (name, threshold_hours, coefficient) VALUES ($1, $2, $3)', ['Стандарт', 8, 1.5])
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  } finally {
    client.release()
  }
}

initDatabase()

export default db
