const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateCodename } = require('../utils/codeGenerator');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('mission_impossible', 10);
    await prisma.user.create({
      data: {
        username: 'ethan_hunt',
        password: adminPassword,
        role: 'ADMIN'
      }
    });

    // Create handler user
    const handlerPassword = await bcrypt.hash('tech_wizard', 10);
    await prisma.user.create({
      data: {
        username: 'benji_dunn',
        password: handlerPassword,
        role: 'HANDLER'
      }
    });

    // Create regular agent user
    const agentPassword = await bcrypt.hash('rogue_nation', 10);
    await prisma.user.create({
      data: {
        username: 'ilsa_faust',
        password: agentPassword,
        role: 'AGENT'
      }
    });

    // Create gadgets
    const gadgetNames = [
      { name: 'Explosive Chewing Gum', description: 'Looks like ordinary gum, explodes when dry' },
      { name: 'Face Mapping Mask', description: 'Creates perfect facial disguises in seconds' },
      { name: 'Voice Modulator', description: 'Mimics any voice after 5 seconds of audio' },
      { name: 'Tracking Microchip', description: 'Subcutaneous chip with global tracking' },
      { name: 'Contact Lens Camera', description: 'Captures 4K images and video with a blink' }
    ];

    for (const gadget of gadgetNames) {
      await prisma.gadget.create({
        data: {
          name: gadget.name,
          description: gadget.description,
          codename: generateCodename()
        }
      });
    }

    console.log('Sample data has been seeded!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();

const { username, password } = req.body;

// Ensure username and password are defined
if (!username || !password) {
  return res.status(400).json({ message: "Username and password are required" });
}

// Find user
const user = await prisma.user.findUnique({
  where: {
    username: username,
  },
});

// Check if user exists and password matches
if (!user || user.password !== password) {
  return res.status(401).json({ message: "Login failed" });
}

// Continue with your login logic