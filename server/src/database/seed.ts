import { AppDataSource } from './data-source';
import { User, Role } from '../users/entities/user.entity';
import { Workshop, WorkshopStatus } from '../workshops/entities/workshop.entity';
import { Registration, RegistrationStatus } from '../registrations/entities/registration.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const workshopRepository = AppDataSource.getRepository(Workshop);
  const registrationRepository = AppDataSource.getRepository(Registration);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@centre.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  // Users
  let admin = await userRepository.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = userRepository.create({
      email: adminEmail,
      full_name: 'System Admin',
      password_hash: await bcrypt.hash(adminPassword, 10),
      role: Role.ADMIN,
    });
    admin = await userRepository.save(admin);
  }

  let manager = await userRepository.findOne({ where: { email: 'manager@centre.local' } });
  if (!manager) {
    manager = userRepository.create({
      email: 'manager@centre.local',
      full_name: 'Workshop Manager',
      password_hash: await bcrypt.hash('Manager123!', 10),
      role: Role.MANAGER,
    });
    manager = await userRepository.save(manager);
  }

  let staff = await userRepository.findOne({ where: { email: 'staff@centre.local' } });
  if (!staff) {
    staff = userRepository.create({
      email: 'staff@centre.local',
      full_name: 'Front Desk Staff',
      password_hash: await bcrypt.hash('Staff123!', 10),
      role: Role.STAFF,
    });
    staff = await userRepository.save(staff);
  }

  // Workshops
  const locations = ['Downtown', 'Riverside', 'Northside'];
  const now = new Date();
  
  const w1Start = new Date(now.getTime() + 1000 * 3600 * 24 * 7); // 7 days from now
  const w1End = new Date(w1Start.getTime() + 1000 * 3600 * 2);
  let w1 = await workshopRepository.findOne({ where: { code: 'POT-101' } });
  if (!w1) {
    w1 = workshopRepository.create({
      code: 'POT-101', title: 'Intro to Pottery', instructor: 'Alice Smith',
      location: locations[0], capacity: 3, status: WorkshopStatus.OPEN,
      starts_at: w1Start, ends_at: w1End, created_by: manager.id, updated_by: manager.id
    });
    w1 = await workshopRepository.save(w1);
  }

  let w2 = await workshopRepository.findOne({ where: { code: 'COD-101' } });
  if (!w2) {
    w2 = workshopRepository.create({
      code: 'COD-101', title: 'Intro to Coding', instructor: 'Bob Jones',
      location: locations[1], capacity: 10, status: WorkshopStatus.OPEN,
      starts_at: new Date(now.getTime() + 1000 * 3600 * 24 * 10), ends_at: new Date(now.getTime() + 1000 * 3600 * 24 * 10 + 1000 * 3600 * 2),
      created_by: manager.id, updated_by: manager.id
    });
    w2 = await workshopRepository.save(w2);
  }

  let w3 = await workshopRepository.findOne({ where: { code: 'FIT-101' } });
  if (!w3) {
    w3 = workshopRepository.create({
      code: 'FIT-101', title: 'Fitness Bootcamp', instructor: 'Charlie Day',
      location: locations[2], capacity: 2, status: WorkshopStatus.OPEN,
      starts_at: new Date(now.getTime() + 1000 * 3600 * 24 * 5), ends_at: new Date(now.getTime() + 1000 * 3600 * 24 * 5 + 1000 * 3600 * 1),
      created_by: manager.id, updated_by: manager.id
    });
    w3 = await workshopRepository.save(w3);
  }
  
  let w4 = await workshopRepository.findOne({ where: { code: 'ART-101' } });
  if (!w4) {
    w4 = workshopRepository.create({
      code: 'ART-101', title: 'Life Drawing', instructor: 'Diana Prince',
      location: locations[0], capacity: 20, status: WorkshopStatus.DRAFT,
      starts_at: new Date(now.getTime() + 1000 * 3600 * 24 * 15), ends_at: new Date(now.getTime() + 1000 * 3600 * 24 * 15 + 1000 * 3600 * 3),
      created_by: manager.id, updated_by: manager.id
    });
    w4 = await workshopRepository.save(w4);
  }

  // Ensure POT-101 is full (capacity 3)
  for (let i = 1; i <= 3; i++) {
    const email = `attendee${i}@pottery.local`;
    const reg = await registrationRepository.findOne({ where: { workshop_id: w1.id, attendee_email: email, status: RegistrationStatus.ACTIVE } });
    if (!reg) {
      await registrationRepository.save(registrationRepository.create({
        workshop_id: w1.id, attendee_name: `Attendee ${i}`, attendee_email: email,
        status: RegistrationStatus.ACTIVE, registered_by: staff.id
      }));
    }
  }

  // Ensure FIT-101 has 1 seat left (capacity 2, 1 registered)
  const fitEmail = 'attendee1@fitness.local';
  const fitReg = await registrationRepository.findOne({ where: { workshop_id: w3.id, attendee_email: fitEmail, status: RegistrationStatus.ACTIVE } });
  if (!fitReg) {
    await registrationRepository.save(registrationRepository.create({
      workshop_id: w3.id, attendee_name: `Attendee Fit`, attendee_email: fitEmail,
      status: RegistrationStatus.ACTIVE, registered_by: staff.id
    }));
  }
  
  // Cancelled registration demo
  const cancelledEmail = 'cancelled@coding.local';
  const cancelledReg = await registrationRepository.findOne({ where: { workshop_id: w2.id, attendee_email: cancelledEmail, status: RegistrationStatus.CANCELLED } });
  if (!cancelledReg) {
    await registrationRepository.save(registrationRepository.create({
      workshop_id: w2.id, attendee_name: `Cancelled Coder`, attendee_email: cancelledEmail,
      status: RegistrationStatus.CANCELLED, registered_by: staff.id,
      cancelled_by: manager.id, cancelled_at: new Date(), cancel_reason: 'Sick'
    }));
  }

  console.log('Seed completed.');
  await AppDataSource.destroy();
}

seed().catch(e => {
  console.error('Seed failed', e);
  process.exit(1);
});
