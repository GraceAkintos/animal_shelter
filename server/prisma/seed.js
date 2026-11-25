// Seed script: fills the database with demo data for development and the live demo.
// Run with: npx prisma db seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Returns a date relative to today, so demo data always looks current
// e.g. daysFromNow(0, 14) = today at 2:00 PM, daysFromNow(-30) = 30 days ago
function daysFromNow(days, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Deletes all data, children first (tables with foreign keys before the tables they point to)
async function clearDatabase() {
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.volunteerShift.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.fosterPlacement.deleteMany();
  await prisma.fosterHome.deleteMany();
  await prisma.fosterApplication.deleteMany();
  await prisma.adoption.deleteMany();
  await prisma.adoptionApplication.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.shelterEvent.deleteMany();
  await prisma.animalCareRecord.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.animalHealthRecord.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
}

async function main() {
  await clearDatabase();

  // ─────────────── ROLES (FR-05) ───────────────
  const roleDescriptions = {
    admin: 'Full system access, user and role management',
    staff: 'Manages animals, adoptions, foster care, inventory and schedules',
    vet: 'Records medical information, vaccinations and appointments',
    volunteer: 'Records animal care and volunteer hours',
    adopter: 'Browses animals and submits adoption applications',
    foster: 'Submits foster applications and cares for foster animals',
  };
  const roles = {};
  for (const [role_name, description] of Object.entries(roleDescriptions)) {
    roles[role_name] = await prisma.role.create({ data: { role_name, description } });
  }

  // ─────────────── USERS ───────────────
  // Every account uses the same demo password, hashed with bcrypt (NFR-01)
  const password_hash = await bcrypt.hash('Demo123!', 12);
  const makeUser = (full_name, email, role, phone = null) =>
    prisma.user.create({
      data: { full_name, email, phone, password_hash, role_id: roles[role].role_id },
    });

  // One demo login per role, listed on the login page for the professor
  const admin = await makeUser('Demo Admin', 'admin@demo.com', 'admin', '(417) 555-0001');
  const staff = await makeUser('Demo Staff', 'staff@demo.com', 'staff', '(417) 555-0002');
  const vet = await makeUser('Dr. Demo Vet', 'vet@demo.com', 'vet', '(417) 555-0003');
  const volunteer = await makeUser('Demo Volunteer', 'volunteer@demo.com', 'volunteer', '(417) 555-0004');
  const adopter = await makeUser('Demo Adopter', 'adopter@demo.com', 'adopter', '(417) 555-0005');
  const foster = await makeUser('Demo Foster', 'foster@demo.com', 'foster', '(417) 555-0006');

  // Extra people from the SRS mockups (Figures 13 and 14)
  const taylor = await makeUser('Taylor Brooks', 'taylor.brooks@example.com', 'adopter', '(417) 555-0110');
  const sarah = await makeUser('Sarah Johnson', 'sarah.johnson@example.com', 'foster', '(417) 555-0201');
  const emily = await makeUser('Emily Davis', 'emily.davis@example.com', 'foster', '(417) 555-0202');
  const robert = await makeUser('Robert Chen', 'robert.chen@example.com', 'foster', '(417) 555-0203');
  const maria = await makeUser('Maria Lopez', 'maria.lopez@example.com', 'foster', '(417) 555-0204');
  const michael = await makeUser('Michael Lee', 'michael.lee@example.com', 'foster', '(417) 555-0205');
  const priya = await makeUser('Priya Patel', 'priya.patel@example.com', 'foster', '(417) 555-0206');
  const tom = await makeUser('Tom Rivera', 'tom.rivera@example.com', 'foster', '(417) 555-0207');
  const john = await makeUser('John Smith', 'john.smith@example.com', 'volunteer', '(417) 555-0101');
  const emma = await makeUser('Emma Brown', 'emma.brown@example.com', 'volunteer', '(417) 555-0102');
  const david = await makeUser('David Lee', 'david.lee@example.com', 'volunteer', '(417) 555-0103');
  const ana = await makeUser('Ana Torres', 'ana.torres@example.com', 'volunteer', '(417) 555-0104');

  // ─────────────── ANIMALS (FR-06) ───────────────
  const animalData = [
    { name: 'Max', species: 'Dog', breed: 'Labrador', age: 3, weight: 65, sex: 'Male', color: 'Yellow', intake_type: 'Stray', location: 'Kennel A1', status: 'available', daysAgo: 30 },
    { name: 'Luna', species: 'Cat', breed: 'Siamese', age: 2, weight: 9, sex: 'Female', color: 'Cream', intake_type: 'Owner Surrender', location: 'Cat Room 1', status: 'adopted', daysAgo: 60 },
    { name: 'Bella', species: 'Dog', breed: 'Golden Retriever', age: 2, weight: 58, sex: 'Female', color: 'Golden', intake_type: 'Owner Surrender', location: 'Kennel A2', status: 'pending', daysAgo: 21 },
    { name: 'Charlie', species: 'Dog', breed: 'Beagle', age: 5, weight: 25, sex: 'Male', color: 'Tricolor', intake_type: 'Transfer', location: 'Kennel B1', status: 'available', daysAgo: 14 },
    { name: 'Milo', species: 'Cat', breed: 'Tabby', age: 1, weight: 8, sex: 'Male', color: 'Orange', intake_type: 'Stray', location: 'Medical Ward', status: 'medical_hold', daysAgo: 7 },
    { name: 'Daisy', species: 'Rabbit', breed: 'Holland Lop', age: 1, weight: 3, sex: 'Female', color: 'White', intake_type: 'Owner Surrender', location: 'Small Animal Room', status: 'available', daysAgo: 2 },
    { name: 'Rocky', species: 'Dog', breed: 'Pit Bull Mix', age: 4, weight: 55, sex: 'Male', color: 'Brindle', intake_type: 'Stray', location: 'Foster', status: 'in_foster', daysAgo: 45 },
    { name: 'Cleo', species: 'Cat', breed: 'Calico', age: 3, weight: 10, sex: 'Female', color: 'Calico', intake_type: 'Stray', location: 'Foster', status: 'in_foster', daysAgo: 40 },
    { name: 'Oliver', species: 'Cat', breed: 'Maine Coon', age: 6, weight: 15, sex: 'Male', color: 'Brown Tabby', intake_type: 'Owner Surrender', location: 'Foster', status: 'in_foster', daysAgo: 50 },
    { name: 'Pepper', species: 'Dog', breed: 'Border Collie', age: 1, weight: 35, sex: 'Female', color: 'Black and White', intake_type: 'Transfer', location: 'Kennel B2', status: 'available', daysAgo: 0 },
  ];
  const animals = {};
  for (const { daysAgo, ...animal } of animalData) {
    animals[animal.name] = await prisma.animal.create({
      data: { ...animal, intake_date: daysFromNow(-daysAgo) },
    });
  }
  // One archived animal (FR-29): hidden from active lists, kept for history
  await prisma.animal.create({
    data: { name: 'Buddy', species: 'Dog', breed: 'Poodle Mix', age: 8, sex: 'Male', color: 'Gray', intake_type: 'Stray', status: 'adopted', is_archived: true, intake_date: daysFromNow(-400) },
  });

  // ─────────────── HEALTH RECORDS (FR-10, FR-11, FR-37) ───────────────
  await prisma.animalHealthRecord.createMany({
    data: [
      { animal_id: animals.Milo.animal_id, recorded_by: vet.user_id, record_type: 'medical', record_date: daysFromNow(-6), notes: 'Upper respiratory infection. Started 10-day course of antibiotics.', medical_alert: true, condition_severity: 'moderate' },
      { animal_id: animals.Max.animal_id, recorded_by: staff.user_id, record_type: 'behavioral', record_date: daysFromNow(-20), notes: 'Friendly with people and other dogs. Pulls on leash.' },
      { animal_id: animals.Charlie.animal_id, recorded_by: vet.user_id, record_type: 'medical', record_date: daysFromNow(-12), notes: 'Intake exam: healthy, slightly overweight. Recommend diet food.' },
      { animal_id: animals.Rocky.animal_id, recorded_by: vet.user_id, record_type: 'medical', record_date: daysFromNow(-40), notes: 'Allergic to chicken-based food.', medical_alert: true, condition_severity: 'high' },
    ],
  });

  // ─────────────── VACCINATIONS (FR-32) ───────────────
  await prisma.vaccination.createMany({
    data: [
      { animal_id: animals.Max.animal_id, administered_by: vet.user_id, vaccine_name: 'Rabies', vaccination_date: daysFromNow(-28), next_due_date: daysFromNow(337) },
      { animal_id: animals.Max.animal_id, administered_by: vet.user_id, vaccine_name: 'DHPP', vaccination_date: daysFromNow(-28), next_due_date: daysFromNow(5) },
      { animal_id: animals.Luna.animal_id, administered_by: vet.user_id, vaccine_name: 'FVRCP', vaccination_date: daysFromNow(-55), next_due_date: daysFromNow(310) },
      { animal_id: animals.Charlie.animal_id, administered_by: vet.user_id, vaccine_name: 'Rabies', vaccination_date: daysFromNow(-370), next_due_date: daysFromNow(-5) },
      { animal_id: animals.Bella.animal_id, administered_by: vet.user_id, vaccine_name: 'DHPP', vaccination_date: daysFromNow(-20), next_due_date: daysFromNow(345) },
    ],
  });

  // ─────────────── ANIMAL CARE RECORDS (FR-20) ───────────────
  await prisma.animalCareRecord.createMany({
    data: [
      { animal_id: animals.Max.animal_id, performed_by: volunteer.user_id, care_type: 'feeding', performed_at: daysFromNow(0, 8), notes: 'Ate full portion.' },
      { animal_id: animals.Milo.animal_id, performed_by: staff.user_id, care_type: 'medical_procedure', performed_at: daysFromNow(0, 8, 30), notes: 'Morning antibiotic given.' },
      { animal_id: animals.Daisy.animal_id, performed_by: volunteer.user_id, care_type: 'feeding', performed_at: daysFromNow(0, 9) },
    ],
  });

  // ─────────────── ADOPTIONS (FR-14, FR-15, FR-17) ───────────────
  await prisma.adoptionApplication.create({
    data: { animal_id: animals.Bella.animal_id, applicant_id: adopter.user_id, address: '123 Elm St, Springfield, MO', num_adults: 2, num_children: 1, housing_type: 'House', landlord_approval: null, pet_experience: 'Had a Golden Retriever for 12 years.', application_status: 'pending', submitted_at: daysFromNow(-3) },
  });
  await prisma.adoptionApplication.create({
    data: { animal_id: animals.Charlie.animal_id, applicant_id: taylor.user_id, address: '45 Oak Ave, Springfield, MO', num_adults: 1, num_children: 0, housing_type: 'Apartment', landlord_approval: true, pet_experience: 'First dog, grew up with beagles.', application_status: 'pending', submitted_at: daysFromNow(-1) },
  });
  // Luna: approved and completed, so Demo Adopter has history (FR-30)
  const lunaApp = await prisma.adoptionApplication.create({
    data: { animal_id: animals.Luna.animal_id, applicant_id: adopter.user_id, reviewed_by: staff.user_id, address: '123 Elm St, Springfield, MO', num_adults: 2, num_children: 1, housing_type: 'House', pet_experience: 'Currently own one cat.', application_status: 'approved', submitted_at: daysFromNow(-20), reviewed_at: daysFromNow(-18) },
  });
  await prisma.adoption.create({
    data: { application_id: lunaApp.application_id, completed_by: staff.user_id, adoption_date: daysFromNow(-15), adoption_fee: 75 },
  });

  // ─────────────── APPOINTMENTS (FR-12, FR-16) and EVENTS (FR-18) ───────────────
  await prisma.appointment.createMany({
    data: [
      { animal_id: animals.Max.animal_id, veterinarian_id: vet.user_id, appointment_type: 'vet', appointment_date: daysFromNow(0, 10), comments: 'DHPP booster check' },
      { animal_id: animals.Bella.animal_id, user_id: adopter.user_id, appointment_type: 'adoption_meeting', appointment_date: daysFromNow(0, 14), comments: 'Meet and greet with family' },
      { animal_id: animals.Daisy.animal_id, appointment_type: 'grooming', appointment_date: daysFromNow(0, 15, 30) },
      { animal_id: animals.Pepper.animal_id, appointment_type: 'other', appointment_date: daysFromNow(0, 16, 15), comments: 'Intake check-in' },
      { animal_id: animals.Milo.animal_id, veterinarian_id: vet.user_id, appointment_type: 'vet', appointment_date: daysFromNow(1, 11), comments: 'Respiratory follow-up' },
    ],
  });
  await prisma.shelterEvent.createMany({
    data: [
      { created_by: admin.user_id, event_title: 'Volunteer Orientation', description: 'Training for new volunteers', start_time: daysFromNow(3, 18), end_time: daysFromNow(3, 20) },
      { created_by: staff.user_id, event_title: 'Weekend Adoption Fair', description: 'Adoption event at the Springfield park', start_time: daysFromNow(10, 10), end_time: daysFromNow(10, 16) },
    ],
  });

  // ─────────────── INVENTORY (FR-22, FR-24) ───────────────
  await prisma.inventoryItem.createMany({
    data: [
      { item_name: 'Dog Food (40 lb bag)', category: 'Food', quantity: 2, minimum_quantity: 10, description: 'Adult dry dog food' },
      { item_name: 'Cat Litter (25 lb)', category: 'Supplies', quantity: 3, minimum_quantity: 8 },
      { item_name: 'Syringes (box of 100)', category: 'Medical', quantity: 12, minimum_quantity: 5, expiration_date: daysFromNow(14) },
      { item_name: 'Rabies Vaccine (dose)', category: 'Medical', quantity: 25, minimum_quantity: 10, expiration_date: daysFromNow(120) },
      { item_name: 'Cat Food (can)', category: 'Food', quantity: 40, minimum_quantity: 15 },
      { item_name: 'Disinfectant (gallon)', category: 'Cleaning', quantity: 12, minimum_quantity: 5 },
    ],
  });

  // ─────────────── NOTIFICATIONS (FR-21) and ACTIVITY LOGS (FR-28) ───────────────
  await prisma.notification.createMany({
    data: [
      { recipient_id: staff.user_id, notification_type: 'application_update', message: 'New adoption application submitted for Charlie' },
      { recipient_id: staff.user_id, notification_type: 'inventory_alert', message: 'Dog Food (40 lb bag) is below minimum (2 left)' },
      { recipient_id: vet.user_id, notification_type: 'medical_alert', message: 'DHPP vaccine for Max is due in 5 days' },
      { recipient_id: adopter.user_id, notification_type: 'application_update', message: 'Your adoption application for Luna was approved!', is_read: true },
    ],
  });
  await prisma.activityLog.createMany({
    data: [
      { user_id: staff.user_id, action_type: 'create', entity_type: 'Animal', entity_id: animals.Pepper.animal_id, description: 'Registered new animal: Pepper', created_at: daysFromNow(0, 8) },
      { user_id: staff.user_id, action_type: 'update', entity_type: 'AdoptionApplication', entity_id: lunaApp.application_id, description: 'Approved adoption application for Luna', created_at: daysFromNow(-18) },
      { user_id: admin.user_id, action_type: 'login', description: 'Admin logged in', created_at: daysFromNow(0, 7, 45) },
    ],
  });

  // ─────────────── FOSTER CARE (FR-33, FR-34, FR-35) ───────────────
  await prisma.fosterApplication.createMany({
    data: [
      { applicant_id: michael.user_id, animal_id: animals.Max.animal_id, housing_details: 'House with fenced yard', availability: 'Weekends', application_status: 'approved', submitted_at: daysFromNow(-10), reviewed_at: daysFromNow(-8) },
      { applicant_id: priya.user_id, animal_id: animals.Daisy.animal_id, housing_details: 'Apartment, pets allowed', availability: 'Evenings', application_status: 'pending', submitted_at: daysFromNow(-2) },
      { applicant_id: tom.user_id, animal_id: animals.Charlie.animal_id, housing_details: 'House, no other pets', availability: 'Full-time', application_status: 'under_review', submitted_at: daysFromNow(-4) },
      { applicant_id: foster.user_id, animal_id: animals.Pepper.animal_id, housing_details: 'House with large yard', availability: 'Full-time', application_status: 'pending', submitted_at: daysFromNow(0, 8) },
    ],
  });
  const homeData = [
    { parent: sarah, address: '10 Maple Dr, Springfield, MO', capacity: 3, approval_status: 'approved' },
    { parent: emily, address: '22 Birch Ln, Springfield, MO', capacity: 2, approval_status: 'approved' },
    { parent: robert, address: '7 Cedar Ct, Springfield, MO', capacity: 4, approval_status: 'approved' },
    { parent: maria, address: '91 Pine St, Springfield, MO', capacity: 2, approval_status: 'pending' },
    { parent: foster, address: '300 Demo Rd, Springfield, MO', capacity: 2, approval_status: 'approved' },
  ];
  const homes = {};
  for (const { parent, ...home } of homeData) {
    homes[parent.full_name] = await prisma.fosterHome.create({
      data: { ...home, foster_parent_id: parent.user_id },
    });
  }
  await prisma.fosterPlacement.createMany({
    data: [
      { animal_id: animals.Rocky.animal_id, foster_home_id: homes['Sarah Johnson'].foster_home_id, start_date: daysFromNow(-30), expected_end_date: daysFromNow(10) },
      { animal_id: animals.Cleo.animal_id, foster_home_id: homes['Emily Davis'].foster_home_id, start_date: daysFromNow(-25), expected_end_date: daysFromNow(15) },
      { animal_id: animals.Oliver.animal_id, foster_home_id: homes['Robert Chen'].foster_home_id, start_date: daysFromNow(-40), expected_end_date: daysFromNow(2), notes: 'Return due soon' },
      // A finished placement, to show foster history (FR-34, FR-38)
      { animal_id: animals.Max.animal_id, foster_home_id: homes['Sarah Johnson'].foster_home_id, start_date: daysFromNow(-28), return_date: daysFromNow(-21), return_reason: 'Foster period completed', placement_status: 'returned' },
    ],
  });

  // ─────────────── VOLUNTEERS (FR-36, FR-39, FR-40) ───────────────
  const profileData = [
    { user: john, skills: 'Animal Care', interests: 'Dogs', availability: 'Mon, Wed, Fri 9:00 AM - 12:00 PM' },
    { user: emma, skills: 'Cleaning', interests: 'Cats', availability: 'Tue, Thu 1:00 PM - 4:00 PM' },
    { user: david, skills: 'Dog Walking', interests: 'Dogs, Training', availability: 'Mon - Fri 10:00 AM - 1:00 PM' },
    { user: ana, skills: 'Events', interests: 'Adoption events', availability: 'Weekends', volunteer_status: 'inactive' },
    { user: volunteer, skills: 'Animal Care', interests: 'All animals', availability: 'Weekends' },
  ];
  const profiles = {};
  for (const { user, ...profile } of profileData) {
    profiles[user.full_name] = await prisma.volunteerProfile.create({
      data: { ...profile, user_id: user.user_id },
    });
  }
  const shift = (name, day, startH, endH, duties, extra = {}) => ({
    volunteer_id: profiles[name].volunteer_id,
    assigned_by: staff.user_id,
    shift_date: daysFromNow(day, 0),
    start_time: daysFromNow(day, Math.floor(startH), (startH % 1) * 60),
    end_time: daysFromNow(day, Math.floor(endH), (endH % 1) * 60),
    assigned_duties: duties,
    ...extra,
  });
  await prisma.volunteerShift.createMany({
    data: [
      // Upcoming shifts (FR-39)
      shift('Demo Volunteer', 0, 9, 12, 'Animal Care'),
      shift('John Smith', 1, 9, 12, 'Animal Care'),
      shift('Emma Brown', 2, 13, 16, 'Cleaning'),
      shift('David Lee', 3, 10, 13, 'Dog Walking'),
      // Completed shifts with logged hours (FR-36)
      shift('John Smith', -2, 9, 12, 'Animal Care', { shift_status: 'completed', hours_worked: 3.0, activity_performed: 'Animal Care' }),
      shift('Emma Brown', -1, 13, 16.5, 'Cleaning', { shift_status: 'completed', hours_worked: 3.5, activity_performed: 'Cleaning' }),
      shift('David Lee', -3, 10, 13, 'Dog Walking', { shift_status: 'completed', hours_worked: 3.0, activity_performed: 'Dog Walking' }),
    ],
  });
  // A staff shift (staff_user_id instead of volunteer_id)
  await prisma.volunteerShift.create({
    data: { staff_user_id: staff.user_id, assigned_by: admin.user_id, shift_date: daysFromNow(0, 0), start_time: daysFromNow(0, 8), end_time: daysFromNow(0, 16), assigned_duties: 'Front desk and intake' },
  });

  console.log('Seed complete: demo data loaded. All demo passwords: Demo123!');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());