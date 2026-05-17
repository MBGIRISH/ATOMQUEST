import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')
  
  // Clear existing
  await prisma.auditLog.deleteMany()
  await prisma.quarterlyCheckin.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()

  // 1. Departments
  const engDept = await prisma.department.create({
    data: { name: 'Engineering', description: 'Software Engineering & IT' }
  })
  
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources', description: 'People & Culture' }
  })

  // 2. Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@atomquest.com',
      name: 'System Admin',
      role: "ADMIN",
      departmentId: hrDept.id
    }
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@atomquest.com',
      name: 'Sarah Manager',
      role: "MANAGER",
      departmentId: engDept.id
    }
  })

  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@atomquest.com',
      name: 'John Developer',
      role: "EMPLOYEE",
      departmentId: engDept.id,
      managerId: manager.id
    }
  })
  
  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@atomquest.com',
      name: 'Jane Designer',
      role: "EMPLOYEE",
      departmentId: engDept.id,
      managerId: manager.id
    }
  })

  // 3. Shared Department KPI
  const deptKpi = await prisma.goal.create({
    data: {
      title: 'Increase Platform Adoption by 20%',
      description: 'Q3 Enterprise Goal for all Engineering staff',
      thrustArea: 'Growth',
      uomType: "PERCENTAGE",
      target: 20,
      weightage: 30,
      deadline: new Date('2026-12-31'),
      status: "APPROVED",
      priority: "HIGH",
      ownerId: manager.id,
      departmentId: engDept.id,
      isShared: true
    }
  })

  // 4. Personal Goals
  const devGoal = await prisma.goal.create({
    data: {
      title: 'Migrate to Next.js 15',
      description: 'Upgrade the core application to Next.js 15 App Router',
      thrustArea: 'Technical Excellence',
      uomType: "PERCENTAGE",
      target: 100,
      weightage: 50,
      deadline: new Date('2026-09-30'),
      status: "UNDER_REVIEW",
      priority: "CRITICAL",
      ownerId: employee1.id,
    }
  })
  
  const sharedDevGoal = await prisma.goal.create({
    data: {
      title: 'Increase Platform Adoption by 20%',
      description: 'Q3 Enterprise Goal for all Engineering staff',
      thrustArea: 'Growth',
      uomType: "PERCENTAGE",
      target: 20,
      weightage: 20,
      deadline: new Date('2026-12-31'),
      status: "APPROVED",
      priority: "HIGH",
      ownerId: employee1.id,
      departmentId: engDept.id,
      isShared: true,
      parentGoalId: deptKpi.id
    }
  })

  // 5. Quarterly Check-ins
  await prisma.quarterlyCheckin.create({
    data: {
      goalId: devGoal.id,
      quarter: 1,
      year: 2026,
      achievement: 25,
      status: "ON_TRACK",
      employeeNotes: 'Started the migration process',
      managerNotes: 'Good progress so far'
    }
  })

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
