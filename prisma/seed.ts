import { PrismaClient, Role, PlanTier, JobStatus, QuoteStatus, InvoiceStatus, PaymentMethod, PlanFrequency, ReminderType, ReminderChannel, ReminderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PestPilot database with realistic pest control data...");

  // 1. Password hash for demo users
  const passwordHash = await bcrypt.hash("PestPilot123!", 10);

  // 2. Demo Company
  const org = await prisma.organization.upsert({
    where: { slug: "apex-pest-solutions" },
    update: {},
    create: {
      name: "Apex Pest Solutions",
      slug: "apex-pest-solutions",
      currency: "USD",
      timezone: "America/Chicago",
      taxRatePercent: 8.25,
      invoicePrefix: "INV-",
      nextInvoiceNum: 1041,
      quotePrefix: "QTE-",
      nextQuoteNum: 1025,
      address: "4800 Freidrich Ln, Austin, TX 78744",
      phone: "(512) 555-PEST",
      email: "service@apexcontrol.com",
      website: "https://apexcontrol.com",
      planTier: PlanTier.PRO,
      subscription: {
        create: {
          plan: PlanTier.PRO,
          status: "active",
        },
      },
    },
  });

  // 3. Demo Users (Owner and Technicians)
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@apexcontrol.com" },
    update: {},
    create: {
      name: "Dan Reynolds (Owner)",
      email: "owner@apexcontrol.com",
      passwordHash,
      phone: "(512) 555-0101",
      licenseNumber: "TX-CA-884920",
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: ownerUser.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: ownerUser.id,
      role: Role.OWNER,
      inviteAccepted: true,
    },
  });

  const tech1User = await prisma.user.upsert({
    where: { email: "tech1@apexcontrol.com" },
    update: {},
    create: {
      name: "Jake Miller (Lead Tech)",
      email: "tech1@apexcontrol.com",
      passwordHash,
      phone: "(512) 555-0102",
      licenseNumber: "TX-AP-992143",
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: tech1User.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: tech1User.id,
      role: Role.TECHNICIAN,
      inviteAccepted: true,
    },
  });

  const tech2User = await prisma.user.upsert({
    where: { email: "tech2@apexcontrol.com" },
    update: {},
    create: {
      name: "Carlos Gomez (Technician)",
      email: "tech2@apexcontrol.com",
      passwordHash,
      phone: "(512) 555-0103",
      licenseNumber: "TX-AP-773124",
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: tech2User.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: tech2User.id,
      role: Role.TECHNICIAN,
      inviteAccepted: true,
    },
  });

  // 4. Create 20 Realistic Customers with Properties
  const customerData = [
    { first: "Sarah", last: "Jenkins", email: "sarah.j@gmail.com", phone: "(512) 555-1122", addr: "1402 Willow Creek Dr", city: "Austin", zip: "78741", gate: "#1402", warn: "Friendly golden retriever in yard", tags: "Residential, Quarterly" },
    { first: "Robert", last: "Decker", email: "rdecker@austintacos.com", phone: "(512) 555-2233", company: "Decker's Cantina", addr: "2104 S Congress Ave", city: "Austin", zip: "78704", gate: "Back alley keybox 9921", warn: "Commercial Kitchen - Night service only", tags: "Commercial, High Priority" },
    { first: "Emily", last: "Chen", email: "emily.chen@techcorp.io", phone: "(512) 555-3344", addr: "8805 Mountain Ridge Dr", city: "Austin", zip: "78759", gate: "*4920", warn: "Crawlspace entry on south wall", tags: "Residential, Termite Warranty" },
    { first: "Michael", last: "Sterling", email: "msterling@sterlinglaw.com", phone: "(512) 555-4455", addr: "310 W 11th St", city: "Austin", zip: "78701", gate: "Front buzzer 302", warn: "Office building 3rd floor", tags: "Commercial" },
    { first: "Amanda", last: "Rodriguez", email: "amanda.r@icloud.com", phone: "(512) 555-5566", addr: "4912 Manchaca Rd", city: "Austin", zip: "78745", gate: "Side latch only", warn: "2 toddler kids, please avoid lawn spray near swings", tags: "Residential, Bi-monthly" },
    { first: "David", last: "Kim", email: "dkim@summitbrew.com", phone: "(512) 555-6677", company: "Summit Craft Brewing", addr: "1002 E 6th St", city: "Austin", zip: "78702", gate: "Loading dock ramp", warn: "Grain storage warehouse - rodent bait stations", tags: "Commercial, Rodent Exclusion" },
    { first: "Jessica", last: "Walsh", email: "jwalsh@austinhomes.net", phone: "(512) 555-7788", addr: "7301 Burnet Rd", city: "Austin", zip: "78757", gate: "None", warn: "Carpenter ant activity in oak tree branches", tags: "Residential" },
    { first: "Brian", last: "O'Connor", email: "brian.oc@yahoo.com", phone: "(512) 555-8899", addr: "2204 Barton Springs Rd", city: "Austin", zip: "78704", gate: "#0077", warn: "Bee hive under back deck eaves", tags: "Residential, Specialty" },
    { first: "Rachel", last: "Foster", email: "rfoster@fosterdental.com", phone: "(512) 555-9900", company: "Foster Family Dental", addr: "12309 N Mopac Expy", city: "Austin", zip: "78758", gate: "Main lobby keycard", warn: "Sterile clinical rooms", tags: "Commercial" },
    { first: "Kevin", last: "Nguyen", email: "knguyen@austinrealty.com", phone: "(512) 555-1020", addr: "5501 Balcones Dr", city: "Austin", zip: "78731", gate: "Call box 104", warn: "Subterranean termite mud tubes on foundation", tags: "Residential, Termite Treatment" },
    { first: "Laura", last: "Martinez", email: "lmartinez@greenlawn.com", phone: "(512) 555-2030", addr: "3600 S Lamar Blvd", city: "Austin", zip: "78704", gate: "#7721", warn: "Large backyard garden - use organic/botanical perimeter", tags: "Residential, Eco-friendly" },
    { first: "Thomas", last: "Wright", email: "twright@wrightsupply.com", phone: "(512) 555-3040", company: "Wright Building Supply", addr: "700 E Ben White Blvd", city: "Austin", zip: "78704", gate: "Yard gate open 7am-6pm", warn: "Lumber stacks have brown recluse spiders", tags: "Commercial" },
    { first: "Hannah", last: "Scott", email: "hannah.scott@gmail.com", phone: "(512) 555-4050", addr: "1604 Westlake Dr", city: "Austin", zip: "78746", gate: "*9910", warn: "Infinity pool perimeter - do not spray water line", tags: "Residential, High Value" },
    { first: "Marcus", last: "Johnson", email: "mjohnson@capitalgym.com", phone: "(512) 555-5060", company: "Capital Fitness Center", addr: "4401 Guadalupe St", city: "Austin", zip: "78751", gate: "Rear staff door", warn: "Locker room plumbing drains", tags: "Commercial" },
    { first: "Olivia", last: "Taylor", email: "otaylor@outlook.com", phone: "(512) 555-6070", addr: "910 Enfield Rd", city: "Austin", zip: "78703", gate: "#1288", warn: "Historic wood trim foundation", tags: "Residential, Quarterly" },
    { first: "William", last: "Clark", email: "wclark@austinbakery.com", phone: "(512) 555-7080", company: "Cedar Door Bakery", addr: "1104 E 11th St", city: "Austin", zip: "78702", gate: "Back kitchen door", warn: "Flour moths and pantry beetle traps in dry storage", tags: "Commercial, Food Grade" },
    { first: "Sophia", last: "Lewis", email: "slewis@gmail.com", phone: "(512) 555-8090", addr: "2801 Exposition Blvd", city: "Austin", zip: "78703", gate: "#3341", warn: "2 indoor cats, harmless", tags: "Residential, Quarterly" },
    { first: "James", last: "Hall", email: "jhall@hallauto.com", phone: "(512) 555-9011", company: "Hall European Automotive", addr: "8500 Research Blvd", city: "Austin", zip: "78758", gate: "Service bay gate open", warn: "Black widow spiders in spare tire rack", tags: "Commercial" },
    { first: "Chloe", last: "Young", email: "cyoung@youngdesign.co", phone: "(512) 555-0122", addr: "604 Deep Eddy Ave", city: "Austin", zip: "78703", gate: "#8812", warn: "Mosquito misting system in backyard", tags: "Residential, Monthly" },
    { first: "Daniel", last: "Harris", email: "dharris@gmail.com", phone: "(512) 555-1234", addr: "4201 Spicewood Springs Rd", city: "Austin", zip: "78759", gate: "Keybox 2024", warn: "Bedbug inspection requested for second floor guest suite", tags: "Residential, Urgent" },
  ];

  const createdCustomers: any[] = [];
  const createdProperties: any[] = [];

  for (const c of customerData) {
    const cust = await prisma.customer.create({
      data: {
        organizationId: org.id,
        firstName: c.first,
        lastName: c.last,
        companyName: c.company || null,
        email: c.email,
        phone: c.phone,
        tags: c.tags,
        notes: `Customer account established. Gate: ${c.gate}. Safety note: ${c.warn}`,
      },
    });
    createdCustomers.push(cust);

    const prop = await prisma.property.create({
      data: {
        organizationId: org.id,
        customerId: cust.id,
        address: c.addr,
        city: c.city,
        state: "TX",
        postalCode: c.zip,
        gateCode: c.gate,
        petsKidsWarnings: c.warn,
        notes: `Main service location for ${c.first} ${c.last}`,
      },
    });
    createdProperties.push(prop);
  }

  // 5. Create 40 Jobs across Today, Past, and Future
  const technicians = [tech1User.id, tech2User.id];
  const now = new Date();

  const chemicals = [
    { name: "Demand CS (Lambda-cyhalothrin)", epa: "100-1066", pest: "Ants, Spiders, Scorpions", qty: "1.5 gal 0.03%" },
    { name: "Taurus SC (Fipronil)", epa: "53883-279", pest: "Subterranean Termites", qty: "4 gal 0.06% trenching" },
    { name: "Advion Cockroach Gel (Indoxacarb)", epa: "100-1484", pest: "German Cockroaches", qty: "10 bait placements" },
    { name: "Alpine WSG (Dinotefuran)", epa: "499-561", pest: "Fleas, Wasps, Ants", qty: "1 gal 20g" },
    { name: "Contrac All-Weather Blox (Bromadiolone)", epa: "12455-79", pest: "Roof Rats / House Mice", qty: "6 tamper-proof bait boxes" },
    { name: "Talstar P (Bifenthrin)", epa: "279-3206", pest: "Mosquitoes & Chiggers", qty: "3 gal 0.05% mist" },
  ];

  console.log("Generating 40 jobs, treatment logs, invoices, and service plans...");

  for (let i = 0; i < 40; i++) {
    const custIndex = i % createdCustomers.length;
    const cust = createdCustomers[custIndex];
    const prop = createdProperties[custIndex];
    const techId = technicians[i % technicians.length];

    // Distribute dates: 10 today, 20 past, 10 future
    let jobDate = new Date();
    let status: JobStatus = JobStatus.SCHEDULED;

    if (i < 8) {
      // Today's jobs
      jobDate = new Date(now);
      if (i === 0 || i === 1) status = JobStatus.COMPLETED;
      else if (i === 2) status = JobStatus.IN_PROGRESS;
      else if (i === 3) status = JobStatus.EN_ROUTE;
      else status = JobStatus.SCHEDULED;
    } else if (i < 28) {
      // Past completed jobs
      const daysAgo = (i - 7) * 2;
      jobDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      status = JobStatus.COMPLETED;
    } else {
      // Future scheduled jobs
      const daysAhead = (i - 27) * 3;
      jobDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      status = JobStatus.SCHEDULED;
    }

    const startHour = 8 + (i % 6);
    const startStr = `${startHour.toString().padStart(2, "0")}:00`;
    const endStr = `${(startHour + 1).toString().padStart(2, "0")}:30`;

    const job = await prisma.job.create({
      data: {
        organizationId: org.id,
        customerId: cust.id,
        propertyId: prop.id,
        technicianId: techId,
        title: i % 3 === 0 ? "Quarterly Perimeter Defense" : i % 3 === 1 ? "Termite Barrier Inspection" : "Interior/Exterior Rodent Sweep",
        description: `Routine scheduled pest treatment for ${cust.firstName} ${cust.lastName}`,
        status,
        scheduledDate: jobDate,
        scheduledStartTime: startStr,
        scheduledEndTime: endStr,
        routeOrder: (i % 8) + 1,
        completedAt: status === JobStatus.COMPLETED ? jobDate : null,
        notes: `Route stop #${(i % 8) + 1}. Gate: ${prop.gateCode || "Open"}`,
      },
    });

    // If job is completed, create realistic TreatmentLog (EPA compliance)
    if (status === JobStatus.COMPLETED) {
      const chem = chemicals[i % chemicals.length];
      await prisma.treatmentLog.create({
        data: {
          organizationId: org.id,
          jobId: job.id,
          technicianId: techId,
          pestType: chem.pest,
          chemicalProduct: chem.name,
          epaRegistrationNumber: chem.epa,
          quantity: chem.qty,
          areasTreated: "Exterior foundation perimeter (3ft up, 3ft out), crawlspace voids, garage baseboards",
          applicatorName: techId === tech1User.id ? "Jake Miller" : "Carlos Gomez",
          licenseNumber: techId === tech1User.id ? "TX-AP-992143" : "TX-AP-773124",
          technicianSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          windSpeed: `${3 + (i % 5)} mph SE`,
          temperature: `${72 + (i % 12)}°F`,
          notes: "Treated foundation according to EPA label directions. Customer gate closed upon departure.",
        },
      });

      // Create Invoice for completed job
      const invNum = `INV-${1000 + i}`;
      const subtotalCents = 12500;
      const taxCents = Math.round(subtotalCents * 0.0825);
      const totalCents = subtotalCents + taxCents;
      const isPaid = i % 4 !== 0; // 75% paid, 25% unpaid/overdue

      const inv = await prisma.invoice.create({
        data: {
          organizationId: org.id,
          customerId: cust.id,
          jobId: job.id,
          invoiceNumber: invNum,
          status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.OVERDUE,
          subtotalCents,
          taxCents,
          totalCents,
          paidCents: isPaid ? totalCents : 0,
          dueDate: new Date(jobDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          notes: "Thank you for trusting Apex Pest Solutions with your property.",
          lineItems: {
            create: [
              {
                description: `${job.title} - ${chem.name}`,
                quantity: 1,
                unitPriceCents: subtotalCents,
                totalCents: subtotalCents,
              },
            ],
          },
        },
      });

      if (isPaid) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            amountCents: totalCents,
            method: i % 2 === 0 ? PaymentMethod.CARD : PaymentMethod.CHECK,
            reference: i % 2 === 0 ? "STRIPE_TX_DEMO_9982" : "CHK#4910",
            notes: "Payment settled in full",
            paidAt: jobDate,
          },
        });
      }
    }

    // Create a few Recurring ServicePlans
    if (i < 8) {
      await prisma.servicePlan.create({
        data: {
          organizationId: org.id,
          propertyId: prop.id,
          name: "Quarterly Home Defense Protection",
          frequency: PlanFrequency.QUARTERLY,
          priceCents: 12500,
          nextServiceDate: new Date(now.getTime() + (i + 1) * 15 * 24 * 60 * 60 * 1000),
          autoInvoice: true,
          active: true,
        },
      });
    }

    // Create a few Quotes
    if (i < 6) {
      await prisma.quote.create({
        data: {
          organizationId: org.id,
          customerId: cust.id,
          propertyId: prop.id,
          quoteNumber: `QTE-${1000 + i}`,
          title: "Comprehensive Termite & Rodent Exclusion Proposal",
          status: i === 0 ? QuoteStatus.ACCEPTED : i === 1 ? QuoteStatus.SENT : QuoteStatus.DRAFT,
          subtotalCents: 65000,
          taxCents: Math.round(65000 * 0.0825),
          totalCents: 70363,
          validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          notes: "Full exclusion of roof returns, attic sanitization, and liquid perimeter termite barrier.",
          lineItems: {
            create: [
              { description: "Termite Liquid Trench & Treat (Taurus SC)", quantity: 1, unitPriceCents: 45000, totalCents: 45000 },
              { description: "Rodent Attic Exclusion & Mesh Sealing", quantity: 1, unitPriceCents: 20000, totalCents: 20000 },
            ],
          },
        },
      });
    }
  }

  console.log("✅ PestPilot database seeded successfully with realistic fleet data!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

