# Implementation Plan - SalaryMM

## Phase 1: Project Setup

- [x] Initialize Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS
- [x] Install and configure Shadcn/UI
- [x] Setup ESLint and Prettier
- [x] Create docker-compose.yml with PostgreSQL
- [x] Setup Prisma ORM
- [x] Create initial database schema
- [x] Run database migrations
- [x] Seed database with sample data

## Phase 2: Authentication

- [x] Install and configure NextAuth.js
- [x] Create User model in Prisma
- [x] Implement credentials provider
- [x] Create login page UI
- [x] Implement session management
- [x] Create auth middleware for protected routes
- [x] Implement role-based access (ADMIN/EMPLOYEE)
- [x] Create logout functionality

## Phase 3: Core Layout & Navigation

- [x] Create main layout component
- [x] Implement sidebar navigation
- [x] Create header with user menu
- [x] Implement responsive design
- [x] Add dark/light mode toggle
- [x] Create breadcrumb component

## Phase 4: Department Management

- [x] Create Department model in Prisma
- [x] Implement API routes (CRUD)
- [x] Create departments list page
- [x] Create add/edit department modal
- [x] Implement delete with confirmation
- [x] Add search and filter functionality

## Phase 5: Position Management

- [x] Create Position model in Prisma
- [x] Implement API routes (CRUD)
- [x] Create positions list page
- [x] Create add/edit position modal
- [x] Implement delete with confirmation

## Phase 6: Employee Management

- [x] Create Employee model in Prisma
- [x] Implement API routes (CRUD)
- [x] Create employees list page with data table
- [x] Implement pagination
- [x] Implement search and filters
- [x] Create add employee form
- [x] Create edit employee form
- [x] Implement avatar upload
- [x] Implement employee detail view
- [x] Link employees to departments and positions

## Phase 7: Salary Structure

- [x] Create SalaryStructure model in Prisma
- [x] Create Allowance model in Prisma
- [x] Implement salary structure API routes
- [x] Create salary setup UI for employees
- [x] Implement allowance management (add/edit/delete)
- [x] Create salary history tracking
- [x] Implement insurance participation toggles

## Phase 7.5: Bonus Management

- [x] Create Bonus model in Prisma (type, amount, reason, month, year, status)
- [x] Implement Bonus API routes (CRUD)
- [x] Create bonuses list page with data table
- [x] Implement filters (month, year, status, employee)
- [x] Create add/edit bonus modal
- [x] Implement bonus type selection (Monthly, Quarterly, Annual, Tet, Project, Performance, Other)
- [x] Implement approve/reject bonus functionality
- [x] Create employee bonus history view
- [x] Add bonus summary cards (pending, approved, total amount)
- [x] Implement bonus report export

## Phase 8: Payroll Processing

- [x] Create Payroll model in Prisma
- [x] Implement insurance calculation logic (BHXH, BHYT, BHTN)
- [x] Implement PIT calculation logic
- [x] Create payroll calculation API (including approved bonuses)
- [x] Create payroll processing page
- [x] Implement month/year selection
- [x] Display calculated payroll table (base salary + allowances + bonuses - deductions)
- [x] Implement save/confirm payroll
- [x] Create payroll status management (DRAFT/CONFIRMED/PAID)
- [x] Show bonus breakdown in payroll details

## Phase 9: Payslip Generation

- [x] Create payslip detail view
- [x] Implement PDF generation with jsPDF
- [x] Create payslip PDF template (Vietnamese format)
- [x] Implement PDF download API
- [x] Create employee payslip view (self-service)

## Phase 10: Dashboard & Reports

- [x] Create dashboard page
- [x] Implement statistics cards (total payroll, employees, etc.)
- [x] Create salary by department chart
- [x] Create recent payroll runs list
- [x] Implement Excel export with ExcelJS
- [x] Create payroll summary report

## Phase 11: Employee Self-Service

- [x] Create employee dashboard
- [x] Implement "My Payslips" page
- [x] Create payslip history view
- [x] Implement payslip PDF download for employees
- [x] Create profile view (read-only)

## Phase 12: Polish & Optimization

- [x] Add loading states and skeletons
- [x] Implement error handling and toast notifications
- [x] Add form validation with Zod
- [x] Optimize database queries
- [x] Add responsive design polish
- [x] Implement accessibility improvements
- [x] Add Vietnamese number formatting (currency, amounts in words)

---

## WORKFLOW CHECKPOINT REMINDER

**When ALL tasks above are marked [x]:**
1. Report "Phase 3 Complete"
2. Create TEST_PLAN.md
3. **STOP and wait for Human to review TEST_PLAN.md**
4. Only proceed to run tests AFTER Human approves

**Context Overflow?** Re-read skill file: `.claude/skills/vibe-builder/SKILL.md`

---

## Progress Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2026-02-04 | Planning | Completed | PRD.md and IMPLEMENTATION_PLAN.md created |
| 2026-02-04 | Phase 1 | Completed | Project setup, Prisma, Docker, Shadcn/UI |
| 2026-02-04 | Phase 2 | Completed | Authentication setup |
| 2026-02-09 | Phase 3-12 | Completed | All remaining features implemented |
