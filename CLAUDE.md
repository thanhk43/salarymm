# CLAUDE.md - Project Configuration

## Vibe Builder Project Reference

### CONTEXT OVERFLOW RECOVERY
**When context gets full or you feel lost in a long session:**
1. Re-read the vibe-builder skill: `.claude/skills/vibe-builder/SKILL.md`
2. Re-read `IMPLEMENTATION_PLAN.md` to check current progress
3. Re-read `TEST_PLAN.md` (if exists) to check test status
4. Follow the workflow strictly - especially the checkpoints below!

### WORKFLOW CHECKPOINTS (MANDATORY - DO NOT SKIP!)
| After Phase | Action |
| --- | --- |
| Phase 3 (Coding) complete | Create TEST_PLAN.md, **STOP for Human review** |
| Phase 4 (Test Plan) approved | Execute tests autonomously |
| Phase 5 (Testing) complete | Report results, Enter Phase 6 loop |

**CRITICAL:** After finishing ALL coding tasks, you MUST:
1. Create TEST_PLAN.md
2. **STOP and wait for Human approval**
3. DO NOT run any tests until Human reviews TEST_PLAN.md!

### Project Summary (from PRD.md)
- **App Type**: Web App - MiniCRM Salary Management (SalaryMM)
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Shadcn/UI + PostgreSQL + Prisma
- **Core Features**:
  1. Authentication (Admin/Employee roles)
  2. Employee Management (CRUD)
  3. Department & Position Management
  4. Salary Structure (base + allowances)
  5. Bonus Management (7 types, approval workflow)
  6. Payroll Processing (BHXH/BHYT/BHTN/PIT calculations)
  7. Payslip Generation (PDF export)
  8. Dashboard & Reports (Excel export)
- **Docker Services**: PostgreSQL 16
- **UI Theme**: Bright, Professional, Modern (Indigo primary, White background)

### Current Phase
- **Status**: Phase 2 approved, starting Phase 3 (Autonomous Coding)
- **Next**: Project Setup

### Primary Documentation
- `PRD.md` - Full product requirements (lazy-read sections when needed)
- `IMPLEMENTATION_PLAN.md` - Task tracking with checkboxes
- `TEST_PLAN.md` - Test cases and results (created in Phase 4)

### Coding Guidelines
- Follow `IMPLEMENTATION_PLAN.md` for tasks
- Use typed language as specified in PRD.md
- Mark completed tasks with `[x]`
- Keep code minimal and focused
