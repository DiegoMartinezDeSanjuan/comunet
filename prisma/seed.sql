-- COMUNET Seed Script (Production)
-- Password: Demo1234!
BEGIN;

-- Clean all tables
DELETE FROM audit_logs;
DELETE FROM notifications;
DELETE FROM payments;
DELETE FROM debts;
DELETE FROM receipts;
DELETE FROM budget_lines;
DELETE FROM budgets;
DELETE FROM fee_rules;
DELETE FROM incident_comments;
DELETE FROM incidents;
DELETE FROM documents;
DELETE FROM votes;
DELETE FROM attendances;
DELETE FROM agenda_items;
DELETE FROM meetings;
DELETE FROM minutes;
DELETE FROM board_positions;
DELETE FROM ownerships;
DELETE FROM units;
DELETE FROM buildings;
DELETE FROM users;
DELETE FROM tenants;
DELETE FROM owners;
DELETE FROM providers;
DELETE FROM communities;
DELETE FROM offices;

-- Office
INSERT INTO offices (id, name, slug, nif, email, phone, address, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(), 'Fincas Martínez', 'fincas-martinez', 'B12345678',
  'admin@fincasmartinez.es', '912345678', 'Calle Gran Vía 12, 28013 Madrid',
  NOW(), NOW()
);

-- Community
INSERT INTO communities (id, "officeId", name, cif, address, iban, "fiscalYear", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Edificio Los Pinos', 'H87654321',
  'Calle de los Pinos 45, 28020 Madrid', 'ES9121000418401234567890',
  2026, 'Comunidad principal de demostración.', NOW(), NOW()
FROM offices WHERE slug = 'fincas-martinez';

-- Building
INSERT INTO buildings (id, "communityId", name, code, "createdAt", "updatedAt")
SELECT gen_random_uuid(), c.id, 'Bloque A', 'A', NOW(), NOW()
FROM communities c WHERE c.name = 'Edificio Los Pinos';

-- Units
INSERT INTO units (id, "communityId", "buildingId", reference, type, floor, door, "areaM2", coefficient, "quotaPercent", active, "createdAt", "updatedAt")
SELECT gen_random_uuid(), c.id, b.id, '1A', 'APARTMENT', '1', 'A', 95, 0.08, 8, true, NOW(), NOW()
FROM communities c JOIN buildings b ON b."communityId" = c.id WHERE c.name = 'Edificio Los Pinos';

INSERT INTO units (id, "communityId", "buildingId", reference, type, floor, door, "areaM2", coefficient, "quotaPercent", active, "createdAt", "updatedAt")
SELECT gen_random_uuid(), c.id, b.id, '1B', 'APARTMENT', '1', 'B', 110, 0.10, 10, true, NOW(), NOW()
FROM communities c JOIN buildings b ON b."communityId" = c.id WHERE c.name = 'Edificio Los Pinos';

INSERT INTO units (id, "communityId", "buildingId", reference, type, floor, door, "areaM2", coefficient, "quotaPercent", active, "createdAt", "updatedAt")
SELECT gen_random_uuid(), c.id, b.id, '2A', 'APARTMENT', '2', 'A', 88, 0.07, 7, true, NOW(), NOW()
FROM communities c JOIN buildings b ON b."communityId" = c.id WHERE c.name = 'Edificio Los Pinos';

-- Owners
INSERT INTO owners (id, "officeId", "fullName", dni, email, phone, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Laura Gómez Prieto', '11111111A', 'propietario@comunet.test', '600111001', NOW(), NOW()
FROM offices WHERE slug = 'fincas-martinez';

INSERT INTO owners (id, "officeId", "fullName", dni, email, phone, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'María Pérez Torres', '22222222B', 'presidenta@comunet.test', '600111002', NOW(), NOW()
FROM offices WHERE slug = 'fincas-martinez';

INSERT INTO owners (id, "officeId", "fullName", dni, email, phone, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Carlos Ruiz Serrano', '33333333C', 'carlos@example.com', '600111003', NOW(), NOW()
FROM offices WHERE slug = 'fincas-martinez';

-- Tenant
INSERT INTO tenants (id, "officeId", "fullName", dni, email, phone, address, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Inés Sánchez Martín', '44444444D', 'ines@example.com', '611222333', 'Calle de los Pinos 45, 2A', NOW(), NOW()
FROM offices WHERE slug = 'fincas-martinez';

-- Provider
INSERT INTO providers (id, "officeId", name, cif, email, phone, category, address, notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Fontanería Rápida 24h', 'B99887766',
  'proveedor@comunet.test', '915001122', 'Fontanería',
  'Calle Galileo 14, Madrid', 'Proveedor principal para urgencias de fontanería.',
  NOW(), NOW()
FROM offices WHERE slug = 'fincas-martinez';

-- Ownerships
INSERT INTO ownerships (id, "unitId", "ownerId", "ownershipPercent", "isPrimaryBillingContact")
SELECT gen_random_uuid(), u.id, o.id, 100, true
FROM units u JOIN owners o ON o.email = 'propietario@comunet.test'
WHERE u.reference = '1A';

INSERT INTO ownerships (id, "unitId", "ownerId", "ownershipPercent", "isPrimaryBillingContact")
SELECT gen_random_uuid(), u.id, o.id, 100, true
FROM units u JOIN owners o ON o.email = 'presidenta@comunet.test'
WHERE u.reference = '1B';

INSERT INTO ownerships (id, "unitId", "ownerId", "ownershipPercent", "isPrimaryBillingContact")
SELECT gen_random_uuid(), u.id, o.id, 100, true
FROM units u JOIN owners o ON o.email = 'carlos@example.com'
WHERE u.reference = '2A';

-- Board position (president)
INSERT INTO board_positions (id, "communityId", "ownerId", role, "startDate")
SELECT gen_random_uuid(), c.id, o.id, 'PRESIDENT', NOW()
FROM communities c, owners o WHERE c.name = 'Edificio Los Pinos' AND o.email = 'presidenta@comunet.test';

-- Users (password: Demo1234!)
INSERT INTO users (id, "officeId", name, email, "passwordHash", role, status, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Administrador', 'admin@comunet.test',
  '$2b$12$TpuLyvG1twPC0JX5jOO52.ubafFi4HV9MtRluX9krpa5OBC3sH4ti',
  'OFFICE_ADMIN', 'ACTIVE', NOW(), NOW()
FROM offices WHERE slug = 'fincas-martinez';

INSERT INTO users (id, "officeId", name, email, "passwordHash", role, status, "linkedOwnerId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), off.id, 'Laura Gómez (Propietaria)', 'propietario@comunet.test',
  '$2b$12$TpuLyvG1twPC0JX5jOO52.ubafFi4HV9MtRluX9krpa5OBC3sH4ti',
  'OWNER', 'ACTIVE', o.id, NOW(), NOW()
FROM offices off, owners o WHERE off.slug = 'fincas-martinez' AND o.email = 'propietario@comunet.test';

INSERT INTO users (id, "officeId", name, email, "passwordHash", role, status, "linkedOwnerId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), off.id, 'María Pérez (Presidenta)', 'presidenta@comunet.test',
  '$2b$12$TpuLyvG1twPC0JX5jOO52.ubafFi4HV9MtRluX9krpa5OBC3sH4ti',
  'PRESIDENT', 'ACTIVE', o.id, NOW(), NOW()
FROM offices off, owners o WHERE off.slug = 'fincas-martinez' AND o.email = 'presidenta@comunet.test';

INSERT INTO users (id, "officeId", name, email, "passwordHash", role, status, "linkedProviderId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), off.id, 'Fontanería Rápida (Industrial)', 'proveedor@comunet.test',
  '$2b$12$TpuLyvG1twPC0JX5jOO52.ubafFi4HV9MtRluX9krpa5OBC3sH4ti',
  'PROVIDER', 'ACTIVE', p.id, NOW(), NOW()
FROM offices off, providers p WHERE off.slug = 'fincas-martinez' AND p.email = 'proveedor@comunet.test';

COMMIT;
