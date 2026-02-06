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

- [ ] Install and configure NextAuth.js
- [ ] Create User model in Prisma
- [ ] Implement credentials provider
- [ ] Create login page UI
- [ ] Implement session management
- [ ] Create auth middleware for protected routes
- [ ] Implement role-based access (ADMIN/EMPLOYEE)
- [ ] Create logout functionality

## Phase 3: Core Layout & Navigation

- [ ] Create main layout component
- [ ] Implement sidebar navigation
- [ ] Create header with user menu
- [ ] Implement responsive design
- [ ] Add dark/light mode toggle
- [ ] Create breadcrumb component

## Phase 4: Department Management

- [ ] Create Department model in Prisma
- [ ] Implement API routes (CRUD)
- [ ] Create departments list page
- [ ] Create add/edit department modal
- [ ] Implement delete with confirmation
- [ ] Add search and filter functionality

## Phase 5: Position Management

- [ ] Create Position model in Prisma
- [ ] Implement API routes (CRUD)
- [ ] Create positions list page
- [ ] Create add/edit position modal
- [ ] Implement delete with confirmation

## Phase 6: Employee Management

- [ ] Create Employee model in Prisma
- [ ] Implement API routes (CRUD)
- [ ] Create employees list page with data table
- [ ] Implement pagination
- [ ] Implement search and filters
- [ ] Create add employee form
- [ ] Create edit employee form
- [ ] Implement avatar upload
- [ ] Implement employee detail view
- [ ] Link employees to departments and positions

## Phase 7: Salary Structure

- [ ] Create SalaryStructure model in Prisma
- [ ] Create Allowance model in Prisma
- [ ] Implement salary structure API routes
- [ ] Create salary setup UI for employees
- [ ] Implement allowance management (add/edit/delete)
- [ ] Create salary history tracking
- [ ] Implement insurance participation toggles

## Phase 7.5: Bonus Management

- [ ] Create Bonus model in Prisma (type, amount, reason, month, year, status)
- [ ] Implement Bonus API routes (CRUD)
- [ ] Create bonuses list page with data table
- [ ] Implement filters (month, year, status, employee)
- [ ] Create add/edit bonus modal
- [ ] Implement bonus type selection (Monthly, Quarterly, Annual, Tet, Project, Performance, Other)
- [ ] Implement approve/reject bonus functionality
- [ ] Create employee bonus history view
- [ ] Add bonus summary cards (pending, approved, total amount)
- [ ] Implement bonus report export

## Phase 8: Payroll Processing

- [ ] Create Payroll model in Prisma
- [ ] Implement insurance calculation logic (BHXH, BHYT, BHTN)
- [ ] Implement PIT calculation logic
- [ ] Create payroll calculation API (including approved bonuses)
- [ ] Create payroll processing page
- [ ] Implement month/year selection
- [ ] Display calculated payroll table (base salary + allowances + bonuses - deductions)
- [ ] Implement save/confirm payroll
- [ ] Create payroll status management (DRAFT/CONFIRMED/PAID)
- [ ] Show bonus breakdown in payroll details

## Phase 9: Payslip Generation

- [ ] Create payslip detail view
- [ ] Implement PDF generation with @react-pdf/renderer
- [ ] Create payslip PDF template (Vietnamese format)
- [ ] Implement PDF download API
- [ ] Create employee payslip view (self-service)

## Phase 10: Dashboard & Reports

- [ ] Create dashboard page
- [ ] Implement statistics cards (total payroll, employees, etc.)
- [ ] Create salary by department chart
- [ ] Create recent payroll runs list
- [ ] Implement Excel export with ExcelJS
- [ ] Create payroll summary report

## Phase 11: Employee Self-Service

- [ ] Create employee dashboard
- [ ] Implement "My Payslips" page
- [ ] Create payslip history view
- [ ] Implement payslip PDF download for employees
- [ ] Create profile view (read-only)

## Phase 12: Polish & Optimization

- [ ] Add loading states and skeletons
- [ ] Implement error handling and toast notifications
- [ ] Add form validation with Zod
- [ ] Optimize database queries
- [ ] Add responsive design polish
- [ ] Implement accessibility improvements
- [ ] Add Vietnamese number formatting (currency, amounts in words)

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
| 2026-02-04 | Phase 2 | In Progress | Authentication setup |
