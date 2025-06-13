const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AYA Backend API',
      version: '1.0.0',
      description: 'API documentation for AYA application - Employee management system',
      contact: {
        name: 'AYA Development Team',
        email: 'admin@aya.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            firstname: { type: 'string' },
            lastname: { type: 'string' },
            role: { type: 'string', enum: ['user', 'chef', 'admin'] },
            department_id: { type: 'integer' },
            chef_id: { type: 'integer', nullable: true },
            profile_image: { type: 'string', nullable: true },
            fcm_token: { type: 'string', nullable: true },
            device_type: { type: 'string', enum: ['web', 'mobile', 'both'] },
            last_login: { type: 'string', format: 'date-time', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Department: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Request: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'integer' },
            type: { 
              type: 'string', 
              enum: ['Congé annuel', 'Congé maladie', 'Congé maternité', 'Formation', 'Congé', 'Document', 'Attestation de travail', 'Document administratif', 'Prêt automobile', 'Prêt bancaire', 'Avance sur salaire', 'Autre']
            },
            status: { 
              type: 'string', 
              enum: ['en attente', 'Chef approuvé', 'Chef rejeté', 'Approuvée', 'Rejetée']
            },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            description: { type: 'string', nullable: true },
            details: { type: 'object', nullable: true },
            chef_observation: { type: 'string', nullable: true },
            admin_response: { type: 'string', nullable: true },
            working_days: { type: 'integer' },
            source: { type: 'string', enum: ['web', 'mobile'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', nullable: true },
            reference_id: { type: 'string', nullable: true },
            is_read: { type: 'boolean' },
            platform: { type: 'string', enum: ['web', 'mobile', 'both'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CalendarEvent: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            start_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            all_day: { type: 'boolean' },
            type: { type: 'string' },
            color: { type: 'string', nullable: true },
            is_public: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        PersonalInfo: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            cin: { type: 'string' },
            date_of_birth: { type: 'string', format: 'date' },
            place_of_birth: { type: 'string', nullable: true },
            nationality: { type: 'string' },
            marital_status: { type: 'string', enum: ['single', 'married', 'divorced', 'widowed'] },
            number_of_children: { type: 'integer' },
            address: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            emergency_contact_name: { type: 'string', nullable: true },
            emergency_contact_relationship: { type: 'string', nullable: true },
            emergency_contact_phone: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        ProfessionalInfo: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            employee_id: { type: 'string' },
            position: { type: 'string' },
            grade: { type: 'string', nullable: true },
            hire_date: { type: 'string', format: 'date' },
            contract_type: { type: 'string', enum: ['CDI', 'CDD', 'ANAPEC', 'Stage'] },
            salary: { type: 'number', format: 'decimal', nullable: true },
            rib: { type: 'string', nullable: true },
            bank_name: { type: 'string', nullable: true },
            cnss: { type: 'string', nullable: true },
            mutuelle: { type: 'string', nullable: true },
            annual_leave_balance: { type: 'integer' },
            sick_leave_balance: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        CreateRequestBody: {
          type: 'object',
          required: ['type', 'start_date', 'end_date', 'description', 'working_days'],
          properties: {
            type: { 
              type: 'string', 
              enum: ['Congé annuel', 'Congé maladie', 'Congé maternité', 'Formation', 'Congé', 'Document', 'Attestation de travail', 'Document administratif', 'Prêt automobile', 'Prêt bancaire', 'Avance sur salaire', 'Autre']
            },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            description: { type: 'string' },
            details: { type: 'object', nullable: true },
            working_days: { type: 'integer', minimum: 1 }
          }
        },
        UpdateRequestStatusBody: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { 
              type: 'string', 
              enum: ['Chef approuvé', 'Chef rejeté', 'Approuvée', 'Rejetée']
            },
            observation: { type: 'string', nullable: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string', nullable: true }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
