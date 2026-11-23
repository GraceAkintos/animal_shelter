-- CreateTable
CREATE TABLE "Roles" (
    "role_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role_name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Users" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "reset_token" TEXT,
    "reset_expires" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles" ("role_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Animals" (
    "animal_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "age" INTEGER,
    "weight" REAL,
    "sex" TEXT,
    "color" TEXT,
    "intake_date" DATETIME NOT NULL,
    "intake_type" TEXT NOT NULL,
    "location" TEXT,
    "medical_history" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "photo_url" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnimalHealthRecords" (
    "health_record_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "animal_id" INTEGER NOT NULL,
    "recorded_by" INTEGER NOT NULL,
    "record_type" TEXT NOT NULL,
    "record_date" DATETIME NOT NULL,
    "notes" TEXT NOT NULL,
    "update_reason" TEXT,
    "medical_alert" BOOLEAN NOT NULL DEFAULT false,
    "condition_severity" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "AnimalHealthRecords_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "Animals" ("animal_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnimalHealthRecords_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vaccinations" (
    "vaccination_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "animal_id" INTEGER NOT NULL,
    "administered_by" INTEGER NOT NULL,
    "vaccine_name" TEXT NOT NULL,
    "vaccination_date" DATETIME NOT NULL,
    "next_due_date" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Vaccinations_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "Animals" ("animal_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vaccinations_administered_by_fkey" FOREIGN KEY ("administered_by") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnimalCareRecords" (
    "care_record_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "animal_id" INTEGER NOT NULL,
    "performed_by" INTEGER NOT NULL,
    "care_type" TEXT NOT NULL,
    "performed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "AnimalCareRecords_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "Animals" ("animal_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnimalCareRecords_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdoptionApplications" (
    "application_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "animal_id" INTEGER NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "reviewed_by" INTEGER,
    "address" TEXT NOT NULL,
    "num_adults" INTEGER NOT NULL,
    "num_children" INTEGER NOT NULL DEFAULT 0,
    "housing_type" TEXT NOT NULL,
    "landlord_approval" BOOLEAN,
    "pet_experience" TEXT,
    "comments" TEXT,
    "application_status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" DATETIME,
    "status_updated_at" DATETIME NOT NULL,
    CONSTRAINT "AdoptionApplications_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "Animals" ("animal_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdoptionApplications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdoptionApplications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Adoptions" (
    "adoption_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "application_id" INTEGER NOT NULL,
    "completed_by" INTEGER NOT NULL,
    "adoption_date" DATETIME NOT NULL,
    "adoption_fee" REAL NOT NULL DEFAULT 0,
    "agreement_url" TEXT,
    "agreement_generated_at" DATETIME,
    CONSTRAINT "Adoptions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "AdoptionApplications" ("application_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Adoptions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointments" (
    "appointment_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "animal_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "veterinarian_id" INTEGER,
    "appointment_type" TEXT NOT NULL,
    "appointment_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "comments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointments_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "Animals" ("animal_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointments_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShelterEvents" (
    "event_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_by" INTEGER NOT NULL,
    "event_title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    CONSTRAINT "ShelterEvents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItems" (
    "item_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "item_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minimum_quantity" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "expiration_date" DATETIME,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notifications" (
    "notification_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipient_id" INTEGER NOT NULL,
    "notification_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "delivery_method" TEXT NOT NULL DEFAULT 'system',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLogs" (
    "log_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "action_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" INTEGER,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FosterApplications" (
    "foster_application_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicant_id" INTEGER NOT NULL,
    "animal_id" INTEGER,
    "housing_details" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "application_status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" DATETIME,
    CONSTRAINT "FosterApplications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FosterApplications_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "Animals" ("animal_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FosterHomes" (
    "foster_home_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "foster_parent_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FosterHomes_foster_parent_id_fkey" FOREIGN KEY ("foster_parent_id") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FosterPlacements" (
    "placement_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "animal_id" INTEGER NOT NULL,
    "foster_home_id" INTEGER NOT NULL,
    "start_date" DATETIME NOT NULL,
    "expected_end_date" DATETIME,
    "return_date" DATETIME,
    "return_reason" TEXT,
    "notes" TEXT,
    "placement_status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "FosterPlacements_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "Animals" ("animal_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FosterPlacements_foster_home_id_fkey" FOREIGN KEY ("foster_home_id") REFERENCES "FosterHomes" ("foster_home_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VolunteerProfiles" (
    "volunteer_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "skills" TEXT,
    "interests" TEXT,
    "availability" TEXT,
    "volunteer_status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "VolunteerProfiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VolunteerShifts" (
    "shift_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "volunteer_id" INTEGER,
    "staff_user_id" INTEGER,
    "assigned_by" INTEGER NOT NULL,
    "shift_date" DATETIME NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "assigned_duties" TEXT NOT NULL,
    "shift_status" TEXT NOT NULL DEFAULT 'scheduled',
    "hours_worked" REAL,
    "activity_performed" TEXT,
    CONSTRAINT "VolunteerShifts_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "VolunteerProfiles" ("volunteer_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VolunteerShifts_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VolunteerShifts_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Roles_role_name_key" ON "Roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "Animals_name_idx" ON "Animals"("name");

-- CreateIndex
CREATE INDEX "Animals_species_status_idx" ON "Animals"("species", "status");

-- CreateIndex
CREATE INDEX "AnimalHealthRecords_animal_id_idx" ON "AnimalHealthRecords"("animal_id");

-- CreateIndex
CREATE INDEX "Vaccinations_next_due_date_idx" ON "Vaccinations"("next_due_date");

-- CreateIndex
CREATE INDEX "AdoptionApplications_application_status_idx" ON "AdoptionApplications"("application_status");

-- CreateIndex
CREATE UNIQUE INDEX "Adoptions_application_id_key" ON "Adoptions"("application_id");

-- CreateIndex
CREATE INDEX "Appointments_appointment_date_idx" ON "Appointments"("appointment_date");

-- CreateIndex
CREATE INDEX "Notifications_recipient_id_is_read_idx" ON "Notifications"("recipient_id", "is_read");

-- CreateIndex
CREATE INDEX "ActivityLogs_created_at_idx" ON "ActivityLogs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfiles_user_id_key" ON "VolunteerProfiles"("user_id");

-- CreateIndex
CREATE INDEX "VolunteerShifts_shift_date_idx" ON "VolunteerShifts"("shift_date");
