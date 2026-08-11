import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding for PF-QMS (MySQL)...");

  // Clean existing tables
  await prisma.token.deleteMany({});
  await prisma.counterIssue.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.counter.deleteMany({});

  const defaultPassword = await bcrypt.hash("admin123", 10);
  const defaultCounterPassword = await bcrypt.hash("counter123", 10);
  const defaultReceptionPassword = await bcrypt.hash("reception123", 10);

  // 1. Create Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      username: "superadmin",
      password: defaultPassword,
      name: "Global Super Admin",
      role: "SUPER_ADMIN",
      city: "Headquarters"
    }
  });
  console.log("✓ Super Admin created:", superAdmin.username);

  // 2. Create System Admin 1 (Delhi)
  const admin1 = await prisma.user.create({
    data: {
      username: "admin",
      password: defaultPassword,
      name: "Delhi Main System Admin",
      role: "ADMIN",
      city: "Delhi"
    }
  });
  console.log("✓ System Admin 1 created:", admin1.username, "(City: Delhi)");

  // Create Receptionist for Admin 1
  await prisma.user.create({
    data: {
      username: "reception",
      password: defaultReceptionPassword,
      name: "Delhi Reception Desk",
      role: "RECEPTION",
      adminId: admin1.id
    }
  });

  // Counters & Issues for Admin 1 (Delhi)
  const delhiCounters = [
    {
      name: "Counter 1 (PF Withdrawal & Advance)",
      tokenPrefix: "W",
      operatorUsername: "counter1",
      operatorName: "Rajesh Kumar (Operator 1)",
      issues: [
        "Form 19 - Final PF Settlement",
        "Form 31 - PF Advance / Illness / House Construction"
      ]
    },
    {
      name: "Counter 2 (Pension & Death Claims)",
      tokenPrefix: "P",
      operatorUsername: "counter2",
      operatorName: "Anita Sharma (Operator 2)",
      issues: [
        "Form 10C - Scheme Certificate & Pension Withdrawal",
        "Form 10D - Monthly Pension Claim",
        "Form 5IF - EDLI Insurance / Death Claim"
      ]
    },
    {
      name: "Counter 3 (KYC & UAN Linking)",
      tokenPrefix: "K",
      operatorUsername: "counter3",
      operatorName: "Vikram Singh (Operator 3)",
      issues: [
        "UAN Activation / Name & DOB Correction",
        "Aadhaar / Bank Account KYC Approval",
        "Joint Declaration Submission"
      ]
    },
    {
      name: "Counter 4 (Transfer & Passbook Complaints)",
      tokenPrefix: "T",
      operatorUsername: "counter4",
      operatorName: "Pooja Verma (Operator 4)",
      issues: [
        "Form 13 - PF Account Transfer Claim",
        "Passbook Discrepancy & Missing Interest"
      ]
    },
    {
      name: "Counter 5 (General Enquiry & Grievance)",
      tokenPrefix: "G",
      operatorUsername: "counter5",
      operatorName: "Suresh Mehta (Operator 5)",
      issues: [
        "EPFiGMS Grievance Follow-up & Enquiry",
        "General Helpdesk & Token Guidance",
        "Other Custom Issue / General Help"
      ]
    }
  ];

  for (const cfg of delhiCounters) {
    const counter = await prisma.counter.create({
      data: {
        name: cfg.name,
        tokenPrefix: cfg.tokenPrefix,
        status: "ACTIVE",
        adminId: admin1.id
      }
    });

    await prisma.user.create({
      data: {
        username: cfg.operatorUsername,
        password: defaultCounterPassword,
        name: cfg.operatorName,
        role: "COUNTER",
        counterId: counter.id,
        adminId: admin1.id
      }
    });

    for (const issueName of cfg.issues) {
      const issue = await prisma.issue.create({
        data: {
          name: issueName,
          status: "PENDING",
          counterId: counter.id,
          adminId: admin1.id
        }
      });

      await prisma.counterIssue.create({
        data: {
          counterId: counter.id,
          issueId: issue.id
        }
      });
    }
    console.log(`✓ Delhi: ${cfg.name} configured.`);
  }

  // 3. Create System Admin 2 (Mumbai)
  const admin2 = await prisma.user.create({
    data: {
      username: "admin2",
      password: defaultPassword,
      name: "Mumbai Regional Admin",
      role: "ADMIN",
      city: "Mumbai"
    }
  });
  console.log("✓ System Admin 2 created:", admin2.username, "(City: Mumbai)");

  // Create Receptionist for Admin 2
  await prisma.user.create({
    data: {
      username: "reception_mumbai",
      password: defaultReceptionPassword,
      name: "Mumbai Reception Desk",
      role: "RECEPTION",
      adminId: admin2.id
    }
  });

  // Counters & Issues for Admin 2 (Mumbai) - Standard Counters 1-5 & Issues
  for (let i = 0; i < delhiCounters.length; i++) {
    const cfg = delhiCounters[i];
    const counterIndex = i + 1;

    const counter = await prisma.counter.create({
      data: {
        name: cfg.name,
        tokenPrefix: cfg.tokenPrefix,
        status: "ACTIVE",
        adminId: admin2.id
      }
    });

    await prisma.user.create({
      data: {
        username: `counter_mumbai_${counterIndex}`,
        password: defaultCounterPassword,
        name: `Mumbai Operator ${counterIndex}`,
        role: "COUNTER",
        counterId: counter.id,
        adminId: admin2.id
      }
    });

    for (const issueName of cfg.issues) {
      const issue = await prisma.issue.create({
        data: {
          name: issueName,
          status: "PENDING",
          counterId: counter.id,
          adminId: admin2.id
        }
      });

      await prisma.counterIssue.create({
        data: {
          counterId: counter.id,
          issueId: issue.id
        }
      });
    }
    console.log(`✓ Mumbai: ${cfg.name} configured.`);
  }

  // Create sample tokens for testing descending order & breakdown
  const todayStr = new Date().toISOString().split("T")[0];

  const firstDelhiCounter = await prisma.counter.findFirst({ where: { adminId: admin1.id } });
  const firstDelhiIssue = await prisma.issue.findFirst({ where: { adminId: admin1.id } });

  if (firstDelhiCounter && firstDelhiIssue) {
    await prisma.token.createMany({
      data: [
        {
          tokenNumber: "W001",
          visitorName: "Ramesh Sharma",
          mobile: "9876543210",
          uan: "100987654321",
          status: "COMPLETED",
          date: todayStr,
          counterId: firstDelhiCounter.id,
          issueId: firstDelhiIssue.id
        },
        {
          tokenNumber: "W002",
          visitorName: "Suresh Gupta",
          mobile: "9876543211",
          uan: "100987654322",
          status: "SERVING",
          date: todayStr,
          counterId: firstDelhiCounter.id,
          issueId: firstDelhiIssue.id
        },
        {
          tokenNumber: "W003",
          visitorName: "Ankit Verma",
          mobile: "9876543212",
          uan: "100987654323",
          status: "WAITING",
          date: todayStr,
          counterId: firstDelhiCounter.id,
          issueId: firstDelhiIssue.id
        }
      ]
    });
  }

  const firstMumbaiCounter = await prisma.counter.findFirst({ where: { adminId: admin2.id } });
  const firstMumbaiIssue = await prisma.issue.findFirst({ where: { adminId: admin2.id } });

  if (firstMumbaiCounter && firstMumbaiIssue) {
    await prisma.token.createMany({
      data: [
        {
          tokenNumber: "W001",
          visitorName: "Sachin Patil",
          mobile: "9988776655",
          uan: "100998877665",
          status: "WAITING",
          date: todayStr,
          counterId: firstMumbaiCounter.id,
          issueId: firstMumbaiIssue.id
        }
      ]
    });
  }

  console.log("\nSeeding complete! MySQL tables populated successfully with identical Counters 1-5 for both Admins.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
