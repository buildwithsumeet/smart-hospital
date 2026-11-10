export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Hospital Management & Appointment Platform API',
    version: '1.0.0',
    description: 'Enterprise Healthcare Microservices Platform with RBAC, Concurrency Control, Event-Driven Messaging, and Ollama AI Engine.',
    contact: {
      name: 'Engineering Team',
      email: 'engineering@hospital.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'API Gateway (Local Development)'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token as: Bearer <token>'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System Health Check',
        tags: ['System'],
        security: [],
        responses: {
          200: { description: 'Service is UP and healthy' }
        }
      }
    },
    '/ready': {
      get: {
        summary: 'System Readiness Probe',
        tags: ['System'],
        security: [],
        responses: {
          200: { description: 'Service is READY to receive traffic' }
        }
      }
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register new Patient or Staff account',
        tags: ['Authentication & RBAC'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', example: 'newpatient@hospital.com' },
                  password: { type: 'string', example: 'Password@1234' },
                  firstName: { type: 'string', example: 'Alice' },
                  lastName: { type: 'string', example: 'Smith' },
                  role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'ACCOUNTANT'], default: 'PATIENT' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User successfully registered' },
          409: { description: 'Email address already exists' }
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login and receive JWT Access & Rotating Refresh Tokens',
        tags: ['Authentication & RBAC'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'patient@hospital.com' },
                  password: { type: 'string', example: 'Patient@12345' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Rotate refresh token and issue new token pair',
        tags: ['Authentication & RBAC'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Tokens refreshed' }
        }
      }
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        tags: ['Authentication & RBAC'],
        responses: {
          200: { description: 'Current user profile data' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/v1/doctors': {
      get: {
        summary: 'Search & filter doctors directory',
        tags: ['Doctors & Schedules'],
        security: [],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or specialty' },
          { name: 'departmentId', in: 'query', schema: { type: 'string' }, description: 'Filter by department UUID' }
        ],
        responses: {
          200: { description: 'List of matching doctors' }
        }
      }
    },
    '/api/v1/doctors/departments': {
      get: {
        summary: 'List active medical departments',
        tags: ['Doctors & Schedules'],
        security: [],
        responses: {
          200: { description: 'List of hospital departments' }
        }
      }
    },
    '/api/v1/doctors/{id}/slots': {
      get: {
        summary: 'Calculate available 30-minute consultation time slots for a given date',
        tags: ['Doctors & Schedules'],
        security: [],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-11-24' } }
        ],
        responses: {
          200: { description: 'Array of computed 30-min time slots' }
        }
      }
    },
    '/api/v1/appointments': {
      get: {
        summary: 'List appointments (filtered by patient or doctor)',
        tags: ['Appointments & Concurrency'],
        responses: {
          200: { description: 'List of appointments' }
        }
      },
      post: {
        summary: 'Book appointment (Guaranteed Concurrency Control & Double Booking Protection)',
        tags: ['Appointments & Concurrency'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['doctorId', 'appointmentDate', 'startTime', 'endTime', 'consultationFee'],
                properties: {
                  doctorId: { type: 'string' },
                  appointmentDate: { type: 'string', example: '2026-11-24' },
                  startTime: { type: 'string', example: '09:00' },
                  endTime: { type: 'string', example: '09:30' },
                  consultationFee: { type: 'number', example: 120.0 },
                  reason: { type: 'string', example: 'Regular cardiac consultation' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Appointment created & billing/notification events triggered' },
          409: { description: 'Slot conflict: Doctor already has a booking at this time' }
        }
      }
    },
    '/api/v1/appointments/{id}/status': {
      patch: {
        summary: 'Update clinical appointment status (Doctor / Receptionist)',
        tags: ['Appointments & Concurrency'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'] },
                  notes: { type: 'string', example: 'Consultation completed. Prescribed beta-blockers.' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Status updated' }
        }
      }
    },
    '/api/v1/appointments/{id}/cancel': {
      post: {
        summary: 'Cancel appointment and release slot immediately for other patients',
        tags: ['Appointments & Concurrency'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: { type: 'string', example: 'Personal emergency' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Appointment cancelled and slot released' }
        }
      }
    },
    '/api/v1/billing/invoices': {
      get: {
        summary: 'List billing invoices',
        tags: ['Billing & Payments'],
        responses: {
          200: { description: 'List of invoices' }
        }
      }
    },
    '/api/v1/billing/invoices/{id}/pay': {
      post: {
        summary: 'Process mock payment for consultation invoice',
        tags: ['Billing & Payments'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'paymentMethod'],
                properties: {
                  amount: { type: 'number', example: 120.0 },
                  paymentMethod: { type: 'string', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'CASH', 'INSURANCE'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Payment processed and confirmation receipt triggered' },
          409: { description: 'Invoice has already been paid' }
        }
      }
    },
    '/api/v1/billing/payments/{paymentId}/refund': {
      post: {
        summary: 'Simulate refund for paid transaction (Accountant / Admin only)',
        tags: ['Billing & Payments'],
        parameters: [
          { name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: { type: 'string', example: 'Doctor emergency rescheduling' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Refund simulation completed' }
        }
      }
    },
    '/api/v1/billing/analytics/revenue': {
      get: {
        summary: 'Get hospital financial revenue analytics (Accountant / Admin only)',
        tags: ['Billing & Payments'],
        responses: {
          200: { description: 'Revenue metrics' }
        }
      }
    },
    '/api/v1/ai/triage': {
      post: {
        summary: 'AI Patient Symptom Checker & Specialist Triage (Ollama Engine)',
        tags: ['AI Clinical Assistant (Ollama)'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symptoms'],
                properties: {
                  symptoms: { type: 'string', example: 'Chest pressure radiating to shoulder with shortness of breath' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Recommended department, urgency, and medical questions' }
        }
      }
    },
    '/api/v1/ai/copilot': {
      post: {
        summary: 'AI Doctor Clinical Diagnostic Copilot & Prescription Helper',
        tags: ['AI Clinical Assistant (Ollama)'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symptoms'],
                properties: {
                  symptoms: { type: 'string', example: 'Persistent elevated blood pressure 160/95 and headache' },
                  patientAge: { type: 'number', example: 52 },
                  gender: { type: 'string', example: 'MALE' },
                  history: { type: 'string', example: 'Hyperlipidemia' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Differential diagnoses and suggested clinical plan' }
        }
      }
    },
    '/api/v1/ai/health': {
      get: {
        summary: 'Check Ollama container connectivity (alpine/ollama:latest)',
        tags: ['AI Clinical Assistant (Ollama)'],
        security: [],
        responses: {
          200: { description: 'Engine status' }
        }
      }
    }
  }
};
