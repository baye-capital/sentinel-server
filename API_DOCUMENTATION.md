# Sentinel Server API Documentation

## Overview

Comprehensive Swagger/OpenAPI documentation for the Sentinel Server API has been implemented. The API documentation is now accessible via an interactive Swagger UI interface.

---

## 🌐 Accessing the Documentation

### Development Environment
```
http://localhost:9000/api-docs
```

### Production Environment
```
https://sentinel-server-827154816062.europe-west1.run.app/api-docs
```

---

## 📖 What's Documented

### Complete API Coverage

All endpoints across 11 major resource categories are fully documented:

1. **Authentication** (`/api/v1/auth`)
   - User registration & login
   - Password management (reset, update)
   - Profile management
   - Avatar upload
   - Health check

2. **Users** (`/api/v1/users`)
   - User management (State Admin only)
   - User invitations
   - User statistics
   - CRUD operations with role-based access

3. **Bookings** (`/api/v1/booking`)
   - Traffic offense bookings/citations
   - Zone-filtered queries
   - Payment checking
   - Statistics & revenue reports
   - Role-based access (Booking Officer+)

4. **Collisions** (`/api/v1/collision`)
   - Accident/collision reports
   - Image & video upload support
   - Zone-filtered access
   - Download restrictions (Admin & Zonal Head only)

5. **Insurance** (`/api/v1/insurance`)
   - Building insurance policies
   - Document uploads
   - Statistics with charts (bar, pie, graph)
   - Zone-filtered records

6. **Inspections** (`/api/v1/inspection`)
   - Building inspections
   - Document management
   - Statistics & daily reports
   - Zone-filtered data

7. **Fire** (`/api/v1/fire`)
   - Fire incident reports
   - Casualty tracking
   - Statistics by zone

8. **Fine** (`/api/v1/fine`)
   - Fine management
   - Payment tracking
   - Zone-based filtering

9. **Building** (`/api/v1/building`)
   - Building records
   - Status tracking
   - Related incidents

10. **Organisation** (`/api/v1/org`)
    - Organisation management
    - Zone assignments

11. **Payments** (`/api/v1/payment`)
    - Payment initialization (Paystack & PayKaduna)
    - Webhooks
    - Transaction history

---

## 🔐 Authentication

### Security Schemes

The API supports two authentication methods:

#### 1. Bearer Token (Recommended)
```http
Authorization: Bearer <your-jwt-token>
```

#### 2. Cookie Authentication
```http
Cookie: token=<your-jwt-token>
```

### Getting a Token

**Login Endpoint:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "booking officer",
    "zone": "1"
  }
}
```

### Using the Token in Swagger UI

1. Click the **"Authorize"** button (🔒 icon) at the top right
2. Enter your JWT token in the "bearerAuth" field
3. Click **"Authorize"**
4. Click **"Close"**

All subsequent requests will include the authentication token automatically.

---

## 👥 Role-Based Access Control

### User Roles

| Role | Code | Access Level |
|------|------|--------------|
| State Admin | `state admin` | Full access to all zones and admin functions |
| Zonal Head | `zonal head` | Access to assigned zone + annex, no admin functions |
| Booking Officer | `booking officer` | Own records only in assigned zone |
| Operator | `operator` | Standard operations in assigned zone |
| Observer | `observer` | Read-only access to all zones |

### Zone System

**Supported Zones:**
```
1, 1annex, 2, 2annex, 3, 3annex, 4, 4annex, 5, 6, 6annex,
7, 9, 10, 12, 13, 14, 15, Unit 1, Unit 2, Unit 3, Unit 4
```

### Access Matrix

| Action | State Admin | Zonal Head | Booking Officer | Observer |
|--------|-------------|------------|-----------------|----------|
| View all zones | ✅ | ❌ | ❌ | ✅ |
| View own zone | ✅ | ✅ | ✅ (own records) | ✅ |
| Create records | ✅ (any zone) | ✅ (own zone) | ✅ (own zone) | ❌ |
| Update records | ✅ | ✅ (zone records) | ✅ (own records) | ❌ |
| Delete records | ✅ | ❌ | ❌ | ❌ |
| User management | ✅ | ❌ | ❌ | ❌ |
| Download accident reports | ✅ | ✅ | ❌ | ❌ |
| Download booking reports | ✅ | ✅ | ✅ | ❌ |

---

## 📊 Query Parameters

### Pagination

All list endpoints support pagination:

```
?page=1&limit=25
```

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 25)

### Sorting

Sort by any field (prefix with `-` for descending):

```
?sort=-createdAt
?sort=name
```

### Field Selection

Select specific fields:

```
?select=name,email,phone
```

### Filtering

Filter by any model field:

```
?zone=1
?paid=true
?status=success
```

### Search

Search within fields (use `_search` prefix):

```
?_searchname=john
?_searchemail=example.com
```

### Boolean Filters

Use `_bool` prefix for boolean fields:

```
?_boolpaid=true
```

### Date Range Filtering

```
?rangeStart=2025-01-01
?rangeEnd=2025-12-31
```

---

## 📝 Request Examples

### Create a Booking

```bash
POST /api/v1/booking
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phoneNo": "+2348012345678",
  "registration": "ABC-123-XY",
  "make": "Toyota",
  "model": "Camry",
  "location": "Ikeja",
  "offence": [
    {
      "code": "SP001",
      "name": "Speeding",
      "amount": 5000,
      "mdasId": 12345
    }
  ],
  "price": 5000,
  "address": "123 Main Street"
}
```

### Create a Collision Report

```bash
POST /api/v1/collision
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Form fields:
location: Lekki-Epe Expressway
desc: Head-on collision
noOfCars: 2
noOfInjuries: 3
noOfFatalities: 0
vehicle: [{"plate":"ABC123","make":"Toyota"}]
img: <binary file>
vid: <binary file>
```

### Get Zone-Filtered Bookings

```bash
GET /api/v1/booking?page=1&limit=25&sort=-createdAt&zone=1
Authorization: Bearer <token>
```

---

## 🎨 Swagger UI Features

### Interactive Testing

1. **Try it out**: Test any endpoint directly from the browser
2. **Request Builder**: Automatically formats requests
3. **Response Viewer**: See formatted responses with syntax highlighting
4. **Schema Explorer**: Browse all data models and structures
5. **Authentication**: Built-in token management

### Example Responses

Each endpoint includes:
- Success response examples (200, 201)
- Error response examples (400, 401, 403, 404)
- Schema definitions with data types
- Required vs optional fields

### Models & Schemas

Browse all data models in the "Schemas" section at the bottom:
- User
- Booking
- Collision
- Insurance
- Inspection
- Fire
- Fine
- Building
- Organisation

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or malformed request |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User lacks permission for this action |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

### Error Examples

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Not Authorized to access this route"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "User role booking officer is unauthorized to access this route"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Please add a valid email"
}
```

---

## 🔄 Response Formats

### Single Resource

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### List with Pagination

```json
{
  "success": true,
  "total": 150,
  "count": 25,
  "limit": 25,
  "pagination": {
    "next": {
      "page": 2,
      "limit": 25
    },
    "prev": {
      "page": 1,
      "limit": 25
    }
  },
  "data": [
    { /* resource 1 */ },
    { /* resource 2 */ }
  ]
}
```

---

## 📦 File Uploads

### Supported Endpoints

- `/api/v1/auth/avatar` - User avatar (image)
- `/api/v1/collision` - Accident photos/videos
- `/api/v1/insurance` - Policy documents (PDF)
- `/api/v1/inspection` - Inspection documents (PDF)
- `/api/v1/users` - User avatar during creation

### File Constraints

- **Max file size**: 5MB (configurable via `MAX_FILE_UPLOAD`)
- **Image formats**: JPG, PNG, GIF
- **Document formats**: PDF only
- **Video formats**: MP4, MOV, AVI

### Upload Example

```bash
curl -X POST http://localhost:9000/api/v1/collision \
  -H "Authorization: Bearer <token>" \
  -F "location=Ikeja" \
  -F "desc=Minor accident" \
  -F "img=@photo.jpg" \
  -F "vid=@video.mp4"
```

---

## 🎯 Best Practices

### 1. Always Use HTTPS in Production
```
https://sentinel-server-827154816062.europe-west1.run.app
```

### 2. Include Authorization Header
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Set Content-Type
```http
Content-Type: application/json
```

### 4. Handle Errors Gracefully
Check the `success` field in responses:
```javascript
if (!response.success) {
  console.error(response.error);
}
```

### 5. Respect Rate Limits
- 1000 requests per 10 minutes per IP
- Adjust request frequency accordingly

### 6. Use Pagination for Large Datasets
```
?page=1&limit=50
```

### 7. Filter Early, Filter Often
```
?zone=1&paid=true&sort=-createdAt
```

---

## 🛠️ Development

### Running Locally

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Access Swagger UI:**
   ```
   http://localhost:9000/api-docs
   ```

3. **Test endpoints:**
   Use the "Try it out" feature in Swagger UI

### Updating Documentation

Documentation is defined in:
- `/config/swagger.js` - Main configuration & schemas
- `/routes/*.js` - JSDoc comments above route definitions

To add new endpoints:
1. Add JSDoc comment above the route
2. Follow the existing format
3. Restart the server to see changes

---

## 📚 Additional Resources

### OpenAPI Specification
The API follows OpenAPI 3.0.0 specification.

### Swagger UI Documentation
- [Swagger UI Official Docs](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)

### API Testing Tools
- **Swagger UI**: Built-in browser testing
- **Postman**: Import OpenAPI spec
- **cURL**: Command-line testing
- **Insomnia**: REST client

---

## 🤝 Support

For API support or questions:
- **Email**: support@motohub.ng
- **Documentation**: `/api-docs`
- **GitHub**: Check repository issues

---

**Version:** 1.0.0  
**Last Updated:** December 5, 2025  
**API Base URL:** `https://sentinel-server-827154816062.europe-west1.run.app/api/v1`
