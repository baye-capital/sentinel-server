const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sentinel Server API",
      version: "1.0.0",
      //   description:
      //     "Comprehensive API documentation for Sentinel Server - A vehicle and building management system for KASTLEA with role-based access control and zone management.",
      //   contact: {
      //     name: "API Support",
      //     email: "support@motohub.ng",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
    // },
    // servers: [
    //   {
    //     url: "http://localhost:9000",
    //     description: "Development server",
    //   },
    //   {
    //     url: "https://sentinel-server-827154816062.europe-west1.run.app",
    //     description: "Production server",
    //   },
    // ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in cookie",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
            },
          },
        },
        User: {
          type: "object",
          required: ["firstName", "lastName", "email"],
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            firstName: {
              type: "string",
              example: "John",
            },
            lastName: {
              type: "string",
              example: "Doe",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            role: {
              type: "string",
              enum: [
                "state admin",
                "zonal head",
                "booking officer",
                "operator",
                "observer",
              ],
              example: "booking officer",
            },
            zone: {
              type: "string",
              enum: [
                "1",
                "1annex",
                "2",
                "2annex",
                "3",
                "3annex",
                "4",
                "4annex",
                "5",
                "6",
                "6annex",
                "7",
                "9",
                "10",
                "12",
                "13",
                "14",
                "15",
              ],
              example: "1",
            },
            unit: {
              type: "string",
              enum: [
                "Unit 1",
                "Unit 2",
                "Unit 3",
                "Unit 4",
              ],
              example: "Unit 1",
            },
            state: {
              type: "string",
              example: "Lagos",
            },
            phone: {
              type: "string",
              example: "+2348012345678",
            },
            picture: {
              type: "string",
              example: "https://bucket.s3.amazonaws.com/avatar.jpg",
            },
            lastActive: {
              type: "string",
              format: "date-time",
            },
            unit: {
              type: "string",
              enum: ["Unit 1", "Unit 2", "Unit 3", "Unit 4"],
              example: "Unit 1",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Booking: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            license: {
              type: "string",
              example: "ABC123456",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            phoneNo: {
              type: "string",
              example: "+2348012345678",
            },
            registration: {
              type: "string",
              example: "ABC-123-XY",
            },
            color: {
              type: "string",
              example: "Blue",
            },
            make: {
              type: "string",
              example: "Toyota",
            },
            model: {
              type: "string",
              example: "Camry",
            },
            zone: {
              type: "string",
              example: "1",
            },
            unit: {
              type: "string",
              enum: ["Unit 1", "Unit 2", "Unit 3", "Unit 4"],
              example: "Unit 1",
            },
            location: {
              type: "string",
              example: "Ikeja",
            },
            offence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  name: { type: "string" },
                  penalty: { type: "string" },
                  amount: { type: "number" },
                  mdasId: { type: "number" },
                },
              },
            },
            price: {
              type: "number",
              example: 5000,
            },
            billRef: {
              type: "string",
            },
            paid: {
              type: "boolean",
              default: false,
            },
            completed: {
              type: "boolean",
              default: false,
            },
            createdBy: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Collision: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            zone: {
              type: "string",
              example: "1",
            },
            unit: {
              type: "string",
              enum: ["Unit 1", "Unit 2", "Unit 3", "Unit 4"],
              example: "Unit 1",
            },
            location: {
              type: "string",
              example: "Lekki-Epe Expressway",
            },
            desc: {
              type: "string",
              example: "Head-on collision",
            },
            state: {
              type: "string",
              example: "Lagos",
            },
            noOfCars: {
              type: "number",
              example: 2,
            },
            noOfInjuries: {
              type: "number",
              example: 3,
            },
            noOfFatalities: {
              type: "number",
              example: 0,
            },
            vehicle: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  plate: { type: "string" },
                  make: { type: "string" },
                  model: { type: "string" },
                  name: { type: "string" },
                  phone: { type: "string" },
                  driverImg: { type: "string" },
                  vehicleImg: { type: "string" },
                },
              },
            },
            witness: {
              type: "array",
              items: {
                type: "object",
              },
            },
            img: {
              type: "string",
            },
            vid: {
              type: "string",
            },
            createdBy: {
              type: "string",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Insurance: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            policy: {
              type: "string",
              enum: ["Occupiers Liability Insurance", "Public Liability Insurance"],
              example: "Occupiers Liability Insurance",
            },
            buildingNo: {
              type: "string",
            },
            area: {
              type: "string",
            },
            price: {
              type: "number",
              example: 50000,
            },
            address: {
              type: "string",
            },
            state: {
              type: "string",
            },
            status: {
              type: "string",
              enum: ["pending", "failed", "success"],
            },
            reference: {
              type: "string",
            },
            claim: {
              type: "boolean",
              default: false,
            },
            expiry: {
              type: "string",
              format: "date-time",
            },
            createdBy: {
              type: "string",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Inspection: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            building: {
              type: "string",
            },
            progress: {
              type: "string",
              enum: ["Completed", "Uncompleted"],
            },
            comment: {
              type: "string",
            },
            address: {
              type: "string",
            },
            state: {
              type: "string",
            },
            price: {
              type: "number",
            },
            status: {
              type: "string",
              enum: ["pending", "failed", "success"],
            },
            complete: {
              type: "string",
              enum: ["complete", "pending", "missed"],
            },
            paid: {
              type: "boolean",
            },
            date: {
              type: "string",
              format: "date-time",
            },
            expiry: {
              type: "string",
              format: "date-time",
            },
            createdBy: {
              type: "string",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Fire: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            address: {
              type: "string",
            },
            state: {
              type: "string",
            },
            type: {
              type: "string",
              enum: ["Electrical", "Chemical", "Structural", "Other"],
            },
            cause: {
              type: "string",
            },
            extent: {
              type: "string",
            },
            injuries: {
              type: "number",
            },
            fatalities: {
              type: "number",
            },
            date: {
              type: "string",
              format: "date-time",
            },
            createdBy: {
              type: "string",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Fine: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            address: {
              type: "string",
            },
            state: {
              type: "string",
            },
            price: {
              type: "number",
            },
            reason: {
              type: "string",
            },
            paid: {
              type: "boolean",
            },
            createdBy: {
              type: "string",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            next: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
              },
            },
            prev: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                error: "Not Authorized to access this route",
              },
            },
          },
        },
        ForbiddenError: {
          description: "User does not have permission to perform this action",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                error: "User role booking officer is unauthorized to access this route",
              },
            },
          },
        },
        NotFoundError: {
          description: "The specified resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                error: "Resource not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error in request data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                error: "Please add a valid email",
              },
            },
          },
        },
      },
      parameters: {
        idParam: {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "MongoDB ObjectId",
        },
        pageParam: {
          name: "page",
          in: "query",
          schema: {
            type: "integer",
            default: 1,
          },
          description: "Page number for pagination",
        },
        limitParam: {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            default: 25,
          },
          description: "Number of items per page",
        },
        sortParam: {
          name: "sort",
          in: "query",
          schema: {
            type: "string",
            example: "-createdAt",
          },
          description: "Sort by field (prefix with - for descending)",
        },
        selectParam: {
          name: "select",
          in: "query",
          schema: {
            type: "string",
            example: "name,email,phone",
          },
          description: "Select specific fields (comma-separated)",
        },
        zoneFilter: {
          name: "zone",
          in: "query",
          schema: {
            type: "string",
          },
          description: "Filter by zone",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and account management",
      },
      {
        name: "Users",
        description: "User management (admin only)",
      },
      {
        name: "Bookings",
        description: "Traffic offense bookings and citations",
      },
      {
        name: "Collisions",
        description: "Accident and collision reports",
      },
      {
        name: "Insurance",
        description: "Building insurance management",
      },
      {
        name: "Inspections",
        description: "Building inspection records",
      },
      {
        name: "Fire",
        description: "Fire incident reports",
      },
      {
        name: "Fine",
        description: "Fine management",
      },
      {
        name: "Building",
        description: "Building records",
      },
      {
        name: "Organisation",
        description: "Organisation management",
      },
      {
        name: "Payments",
        description: "Payment processing and webhooks",
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
