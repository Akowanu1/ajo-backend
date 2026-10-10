require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const { User, Group } = require('../src/models');

// Safety check: never seed a live production database.
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production. Change NODE_ENV or use a local development database.');
  process.exit(1);
}

// Simple helper so the login output stays readable.
function formatLogin(email, password) {
  return `${email} / ${password}`;
}

async function seedDatabase() {
  // Connect to MongoDB.
  await connectDB();

  // Clear old test data so each seed run starts fresh.
  await User.deleteMany({});
  await Group.deleteMany({});

  // Basic sample users for testing login and role checks.
  const sampleUsers = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'Password123',
      role: 'admin',
      isVerified: true,
      status: 'active',
    },
    {
      name: 'Ben Smith',
      email: 'ben@example.com',
      password: 'Password123',
      role: 'member',
      isVerified: true,
      status: 'active',
    },
    {
      name: 'Cara Lee',
      email: 'cara@example.com',
      password: 'Password123',
      role: 'member',
      isVerified: false,
      status: 'pending',
    },
  ];

  // Hash passwords before saving.
  const usersWithHashedPasswords = await Promise.all(
    sampleUsers.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    }))
  );

  const createdUsers = await User.insertMany(usersWithHashedPasswords);
  const usersByEmail = Object.fromEntries(createdUsers.map((user) => [user.email, user]));

  // Three groups to test different states: open, active, and completed.
  const sampleGroups = [
    {
      name: 'Open Project Team',
      description: 'Open group accepting new members.',
      status: 'open',
      creator: usersByEmail['alice@example.com']._id,
      members: [usersByEmail['alice@example.com']._id, usersByEmail['ben@example.com']._id],
      startDate: null,
      endDate: null,
    },
    {
      name: 'Active Sprint Group',
      description: 'In progress and already contributing.',
      status: 'active',
      creator: usersByEmail['ben@example.com']._id,
      members: [usersByEmail['ben@example.com']._id, usersByEmail['cara@example.com']._id],
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      endDate: null,
    },
    {
      name: 'Completed Group',
      description: 'This group has already finished its work.',
      status: 'completed',
      creator: usersByEmail['cara@example.com']._id,
      members: [usersByEmail['cara@example.com']._id, usersByEmail['alice@example.com']._id],
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  ];

  const createdGroups = await Group.insertMany(sampleGroups);

  // Store the group IDs back onto each user for easy querying later.
  await Promise.all(
    createdGroups.map(async (group) => {
      await User.updateMany(
        { _id: { $in: group.members } },
        { $addToSet: { groupIds: group._id } }
      );
    })
  );

  // Show test credentials for the team.
  console.log('Seed complete. Test logins:');
  console.log(formatLogin('alice@example.com', 'Password123'));
  console.log(formatLogin('ben@example.com', 'Password123'));
  console.log(formatLogin('cara@example.com', 'Password123'));
  console.log(`Created ${createdUsers.length} users and ${createdGroups.length} groups.`);
}

// Run the seed process when this file is executed.
seedDatabase()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => process.exit(process.exitCode || 0), 250);
  });
