# Authorization Testing Guide

## Overview
This guide helps you test the zone-based Role-Based Access Control (RBAC) system implemented for KASTLEA's 22 zones and 4 user roles.

---

## 🧪 Test Setup

### 1. Start the Server
```bash
npm run dev
```

### 2. Create Test Users

Use Postman, cURL, or Swagger UI (`http://localhost:5000/api-docs`) to create users with different roles:

#### Create State Admin
```bash
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "name": "State Admin Test",
  "email": "stateadmin@test.com",
  "password": "Test123!",
  "role": "state admin",
  "phoneNo": "+2348012345001"
}
```

#### Create Zonal Head (Zone 1)
```bash
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "name": "Zonal Head Zone 1",
  "email": "zonalhead1@test.com",
  "password": "Test123!",
  "role": "zonal head",
  "zone": "1",
  "phoneNo": "+2348012345002"
}
```

#### Create Zonal Head (Zone 1annex)
```bash
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "name": "Zonal Head Zone 1 Annex",
  "email": "zonalhead1annex@test.com",
  "password": "Test123!",
  "role": "zonal head",
  "zone": "1annex",
  "phoneNo": "+2348012345003"
}
```

#### Create Booking Officer (Zone 1)
```bash
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "name": "Booking Officer Zone 1",
  "email": "officer1@test.com",
  "password": "Test123!",
  "role": "booking officer",
  "zone": "1",
  "phoneNo": "+2348012345004"
}
```

#### Create Another Booking Officer (Zone 1)
```bash
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "name": "Booking Officer 2 Zone 1",
  "email": "officer2@test.com",
  "password": "Test123!",
  "role": "booking officer",
  "zone": "1",
  "phoneNo": "+2348012345005"
}
```

#### Create Booking Officer (Zone 2)
```bash
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "name": "Booking Officer Zone 2",
  "email": "officer2zone@test.com",
  "password": "Test123!",
  "role": "booking officer",
  "zone": "2",
  "phoneNo": "+2348012345006"
}
```

#### Create Observer
```bash
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "name": "Observer Test",
  "email": "observer@test.com",
  "password": "Test123!",
  "role": "observer",
  "phoneNo": "+2348012345007"
}
```

### 3. Login and Get Tokens

For each test user, login and save their token:

```bash
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "stateadmin@test.com",
  "password": "Test123!"
}
```

**Save tokens for:**
- State Admin token → `STATE_ADMIN_TOKEN`
- Zonal Head Zone 1 token → `ZONAL_HEAD_1_TOKEN`
- Zonal Head Zone 1annex token → `ZONAL_HEAD_1ANNEX_TOKEN`
- Booking Officer 1 token → `OFFICER_1_TOKEN`
- Booking Officer 2 token → `OFFICER_2_TOKEN`
- Booking Officer Zone 2 token → `OFFICER_ZONE2_TOKEN`
- Observer token → `OBSERVER_TOKEN`

---

## 🧪 Test Cases

### Test 1: Zone Filtering for Booking Officers

**Objective:** Booking officers should only see their own bookings

#### Step 1: Create bookings as Officer 1
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <OFFICER_1_TOKEN>
Content-Type: application/json

{
  "name": "John Doe",
  "phoneNo": "+2348012345678",
  "registration": "ABC-123-XY",
  "make": "Toyota",
  "model": "Camry",
  "location": "Ikeja",
  "offence": [{
    "code": "SP001",
    "name": "Speeding",
    "amount": 5000,
    "mdasId": 12345
  }],
  "price": 5000,
  "address": "123 Main Street"
}
```

#### Step 2: Create bookings as Officer 2 (same zone)
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <OFFICER_2_TOKEN>
Content-Type: application/json

{
  "name": "Jane Smith",
  "phoneNo": "+2348087654321",
  "registration": "XYZ-789-AB",
  "make": "Honda",
  "model": "Accord",
  "location": "Yaba",
  "offence": [{
    "code": "PK001",
    "name": "Illegal Parking",
    "amount": 3000,
    "mdasId": 12346
  }],
  "price": 3000,
  "address": "456 Second Avenue"
}
```

#### Step 3: List bookings as Officer 1
```bash
GET http://localhost:5000/api/v1/booking
Authorization: Bearer <OFFICER_1_TOKEN>
```

**Expected Result:** ✅ Should only see John Doe's booking (created by Officer 1)

#### Step 4: List bookings as Officer 2
```bash
GET http://localhost:5000/api/v1/booking
Authorization: Bearer <OFFICER_2_TOKEN>
```

**Expected Result:** ✅ Should only see Jane Smith's booking (created by Officer 2)

---

### Test 2: Zonal Head Access to Main Zone + Annex

**Objective:** Zonal Head in Zone 1 should see Zone 1 AND Zone 1annex records

#### Step 1: Create booking in Zone 1 (as State Admin)
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <STATE_ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Zone 1 Record",
  "phoneNo": "+2348011111111",
  "registration": "Z1-001-AA",
  "make": "Mercedes",
  "model": "E-Class",
  "location": "Zone 1 Area",
  "offence": [{"code": "SP001", "name": "Speeding", "amount": 5000, "mdasId": 1}],
  "price": 5000,
  "address": "Zone 1 Street",
  "zone": "1"
}
```

#### Step 2: Create booking in Zone 1annex (as State Admin)
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <STATE_ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Zone 1 Annex Record",
  "phoneNo": "+2348022222222",
  "registration": "Z1A-002-BB",
  "make": "BMW",
  "model": "X5",
  "location": "Zone 1 Annex Area",
  "offence": [{"code": "SP001", "name": "Speeding", "amount": 5000, "mdasId": 1}],
  "price": 5000,
  "address": "Zone 1 Annex Street",
  "zone": "1annex"
}
```

#### Step 3: Create booking in Zone 2 (as State Admin)
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <STATE_ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Zone 2 Record",
  "phoneNo": "+2348033333333",
  "registration": "Z2-003-CC",
  "make": "Audi",
  "model": "A4",
  "location": "Zone 2 Area",
  "offence": [{"code": "SP001", "name": "Speeding", "amount": 5000, "mdasId": 1}],
  "price": 5000,
  "address": "Zone 2 Street",
  "zone": "2"
}
```

#### Step 4: List bookings as Zonal Head Zone 1
```bash
GET http://localhost:5000/api/v1/booking
Authorization: Bearer <ZONAL_HEAD_1_TOKEN>
```

**Expected Result:** ✅ Should see Zone 1 AND Zone 1annex records (NOT Zone 2)

#### Step 5: List bookings as Zonal Head Zone 1annex
```bash
GET http://localhost:5000/api/v1/booking
Authorization: Bearer <ZONAL_HEAD_1ANNEX_TOKEN>
```

**Expected Result:** ✅ Should see Zone 1annex AND Zone 1 records (NOT Zone 2)

---

### Test 3: Observer Read-Only Access

**Objective:** Observers can view all zones but cannot create/update/delete

#### Step 1: List bookings as Observer
```bash
GET http://localhost:5000/api/v1/booking
Authorization: Bearer <OBSERVER_TOKEN>
```

**Expected Result:** ✅ Should see ALL bookings from ALL zones

#### Step 2: Try to create booking as Observer
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <OBSERVER_TOKEN>
Content-Type: application/json

{
  "name": "Test",
  "phoneNo": "+2348012345678",
  "registration": "TEST-123",
  "make": "Test",
  "model": "Test",
  "location": "Test",
  "offence": [{"code": "SP001", "name": "Speeding", "amount": 5000, "mdasId": 1}],
  "price": 5000,
  "address": "Test"
}
```

**Expected Result:** ❌ Should get `403 Forbidden` - "Observers cannot create records"

#### Step 3: Try to update booking as Observer
```bash
PUT http://localhost:5000/api/v1/booking/<booking-id>
Authorization: Bearer <OBSERVER_TOKEN>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

**Expected Result:** ❌ Should get `403 Forbidden` - "Observers cannot update records"

#### Step 4: Try to delete booking as Observer
```bash
DELETE http://localhost:5000/api/v1/booking/<booking-id>
Authorization: Bearer <OBSERVER_TOKEN>
```

**Expected Result:** ❌ Should get `403 Forbidden` - "Observers cannot delete records"

---

### Test 4: State Admin Full Access

**Objective:** State Admin can see and manage ALL zones

#### Step 1: List bookings as State Admin
```bash
GET http://localhost:5000/api/v1/booking
Authorization: Bearer <STATE_ADMIN_TOKEN>
```

**Expected Result:** ✅ Should see ALL bookings from ALL zones

#### Step 2: Create booking in any zone as State Admin
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <STATE_ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Admin Created",
  "phoneNo": "+2348099999999",
  "registration": "ADMIN-999",
  "make": "Admin",
  "model": "Test",
  "location": "Any Zone",
  "offence": [{"code": "SP001", "name": "Speeding", "amount": 5000, "mdasId": 1}],
  "price": 5000,
  "address": "Admin Street",
  "zone": "15"
}
```

**Expected Result:** ✅ Should successfully create booking in Zone 15

#### Step 3: Delete any booking as State Admin
```bash
DELETE http://localhost:5000/api/v1/booking/<any-booking-id>
Authorization: Bearer <STATE_ADMIN_TOKEN>
```

**Expected Result:** ✅ Should successfully delete

---

### Test 5: Zone Auto-Population

**Objective:** User's zone should be automatically set when creating records

#### Step 1: Create booking as Officer 1 (Zone 1) without specifying zone
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <OFFICER_1_TOKEN>
Content-Type: application/json

{
  "name": "Auto Zone Test",
  "phoneNo": "+2348012345678",
  "registration": "AUTO-123",
  "make": "Toyota",
  "model": "Corolla",
  "location": "Test",
  "offence": [{"code": "SP001", "name": "Speeding", "amount": 5000, "mdasId": 1}],
  "price": 5000,
  "address": "Test"
}
```

#### Step 2: Get the created booking
```bash
GET http://localhost:5000/api/v1/booking/<booking-id>
Authorization: Bearer <OFFICER_1_TOKEN>
```

**Expected Result:** ✅ Booking should have `zone: "1"` automatically set

#### Step 3: Try to create booking with different zone
```bash
POST http://localhost:5000/api/v1/booking
Authorization: Bearer <OFFICER_1_TOKEN>
Content-Type: application/json

{
  "name": "Wrong Zone Test",
  "phoneNo": "+2348012345678",
  "registration": "WRONG-123",
  "make": "Toyota",
  "model": "Corolla",
  "location": "Test",
  "offence": [{"code": "SP001", "name": "Speeding", "amount": 5000, "mdasId": 1}],
  "price": 5000,
  "address": "Test",
  "zone": "2"
}
```

**Expected Result:** ✅ Zone should be overridden to "1" (Officer 1's zone)

---

### Test 6: Download Reports Restrictions

**Objective:** Only State Admin and Zonal Heads can download accident reports

#### Test 6A: State Admin can download
```bash
GET http://localhost:5000/api/v1/collision?download=true
Authorization: Bearer <STATE_ADMIN_TOKEN>
```

**Expected Result:** ✅ Should return CSV/Excel file

#### Test 6B: Zonal Head can download
```bash
GET http://localhost:5000/api/v1/collision?download=true
Authorization: Bearer <ZONAL_HEAD_1_TOKEN>
```

**Expected Result:** ✅ Should return CSV/Excel file (only Zone 1 + 1annex data)

#### Test 6C: Booking Officer cannot download
```bash
GET http://localhost:5000/api/v1/collision?download=true
Authorization: Bearer <OFFICER_1_TOKEN>
```

**Expected Result:** ❌ Should get `403 Forbidden` - "Only state admin and zonal heads can download accident reports"

#### Test 6D: Observer cannot download
```bash
GET http://localhost:5000/api/v1/collision?download=true
Authorization: Bearer <OBSERVER_TOKEN>
```

**Expected Result:** ❌ Should get `403 Forbidden`

---

### Test 7: User Management Restrictions

**Objective:** Only State Admin can create/delete users

#### Test 7A: State Admin can create user
```bash
POST http://localhost:5000/api/v1/users
Authorization: Bearer <STATE_ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@test.com",
  "password": "Test123!",
  "role": "booking officer",
  "zone": "3",
  "phoneNo": "+2348012345999"
}
```

**Expected Result:** ✅ Should successfully create user

#### Test 7B: Zonal Head cannot create user
```bash
POST http://localhost:5000/api/v1/users
Authorization: Bearer <ZONAL_HEAD_1_TOKEN>
Content-Type: application/json

{
  "name": "Unauthorized User",
  "email": "unauthorized@test.com",
  "password": "Test123!",
  "role": "booking officer",
  "zone": "1",
  "phoneNo": "+2348012345888"
}
```

**Expected Result:** ❌ Should get `403 Forbidden` - "User role zonal head is unauthorized to access this route"

#### Test 7C: Booking Officer cannot create user
```bash
POST http://localhost:5000/api/v1/users
Authorization: Bearer <OFFICER_1_TOKEN>
Content-Type: application/json

{
  "name": "Unauthorized User",
  "email": "unauthorized2@test.com",
  "password": "Test123!",
  "role": "booking officer",
  "zone": "1",
  "phoneNo": "+2348012345777"
}
```

**Expected Result:** ❌ Should get `403 Forbidden`

---

### Test 8: Cross-Zone Access Prevention

**Objective:** Users cannot access records outside their zone

#### Step 1: Create collision in Zone 2
```bash
POST http://localhost:5000/api/v1/collision
Authorization: Bearer <OFFICER_ZONE2_TOKEN>
Content-Type: application/json

{
  "location": "Zone 2 Location",
  "desc": "Zone 2 Accident",
  "noOfCars": 2,
  "noOfInjuries": 0,
  "noOfFatalities": 0,
  "vehicle": [{"plate": "ZONE2-123", "make": "Toyota"}]
}
```

#### Step 2: Try to access as Zone 1 Officer
```bash
GET http://localhost:5000/api/v1/collision/<zone2-collision-id>
Authorization: Bearer <OFFICER_1_TOKEN>
```

**Expected Result:** ❌ Should get `404 Not Found` or empty response (zone filter blocks it)

#### Step 3: Verify Zone 2 Officer can see it
```bash
GET http://localhost:5000/api/v1/collision/<zone2-collision-id>
Authorization: Bearer <OFFICER_ZONE2_TOKEN>
```

**Expected Result:** ✅ Should return the collision record

---

## 📊 Testing Checklist

Use this checklist to track your testing progress:

### Zone Filtering
- [ ] Booking officers see only their own records
- [ ] Booking officers cannot see other officers' records in same zone
- [ ] Zonal heads see main zone + annex
- [ ] Zonal heads cannot see other zones
- [ ] State admin sees all zones
- [ ] Observer sees all zones

### Write Permissions
- [ ] Observers blocked from POST requests
- [ ] Observers blocked from PUT requests
- [ ] Observers blocked from DELETE requests
- [ ] Booking officers can create in own zone
- [ ] Zonal heads can create in own zone
- [ ] State admin can create in any zone

### Zone Auto-Population
- [ ] Zone automatically set from user's zone
- [ ] Cannot override zone via request body (non-admin)
- [ ] State admin can set any zone

### Download Restrictions
- [ ] State admin can download accident reports
- [ ] Zonal head can download accident reports
- [ ] Booking officer blocked from accident reports
- [ ] Observer blocked from downloads

### User Management
- [ ] State admin can create users
- [ ] State admin can delete users
- [ ] Non-admin roles blocked from user creation
- [ ] Non-admin roles blocked from user deletion

### Cross-Zone Prevention
- [ ] Users cannot access other zones' records
- [ ] Zone filtering applied on list endpoints
- [ ] Zone filtering applied on single record endpoints

---

## 🐛 Common Issues & Solutions

### Issue: "User has no zone assigned"
**Solution:** All users except state admin must have a zone. Update the user:
```bash
PUT http://localhost:5000/api/v1/users/<user-id>
Authorization: Bearer <STATE_ADMIN_TOKEN>
Content-Type: application/json

{
  "zone": "1"
}
```

### Issue: Zonal head not seeing annex records
**Solution:** Verify the annex naming format. Zone "1" should show "1annex", not "1 annex" or "1_annex"

### Issue: All queries returning empty
**Solution:** Check that records have the `zone` field populated. Old records may need migration:
```javascript
// Run in MongoDB
db.bookings.updateMany(
  { zone: { $exists: false } },
  { $set: { zone: "1" } }
)
```

### Issue: State admin seeing zone filter applied
**Solution:** Check that user role is exactly "state admin" (case sensitive, with space)

---

## 📝 Quick Test Script

Save this as `test-auth.sh` for quick testing:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api/v1"

# Login as different users
echo "Testing State Admin..."
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"stateadmin@test.com","password":"Test123!"}' \
  | jq -r '.token')

echo "Testing Zonal Head..."
ZONAL_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"zonalhead1@test.com","password":"Test123!"}' \
  | jq -r '.token')

echo "Testing Booking Officer..."
OFFICER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"officer1@test.com","password":"Test123!"}' \
  | jq -r '.token')

echo "Testing Observer..."
OBSERVER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"observer@test.com","password":"Test123!"}' \
  | jq -r '.token')

# Test zone filtering
echo -e "\n--- State Admin Bookings (should see all) ---"
curl -s -X GET "$BASE_URL/booking?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.count'

echo -e "\n--- Zonal Head Bookings (should see zone 1 + 1annex) ---"
curl -s -X GET "$BASE_URL/booking?limit=5" \
  -H "Authorization: Bearer $ZONAL_TOKEN" \
  | jq '.count'

echo -e "\n--- Booking Officer Bookings (should see own only) ---"
curl -s -X GET "$BASE_URL/booking?limit=5" \
  -H "Authorization: Bearer $OFFICER_TOKEN" \
  | jq '.count'

echo -e "\n--- Observer Bookings (should see all) ---"
curl -s -X GET "$BASE_URL/booking?limit=5" \
  -H "Authorization: Bearer $OBSERVER_TOKEN" \
  | jq '.count'

# Test observer write restriction
echo -e "\n--- Observer Create (should fail) ---"
curl -s -X POST "$BASE_URL/booking" \
  -H "Authorization: Bearer $OBSERVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phoneNo":"+2348012345678"}' \
  | jq '.error'

echo -e "\nTest complete!"
```

Make executable:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

**Ready to test!** Start with Test 1 and work through each scenario. Document any failures or unexpected behavior.
