# PayGlobe API Documentation

## Overview

PayGlobe is a comprehensive fintech platform API that provides payment processing, merchant management, user authentication, and financial services. This documentation covers all available API endpoints organized by functionality.

## Base URL
```
http://localhost:8000
```

## Authentication

PayGlobe uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/accounts/login/` | User login |
| POST | `/api/v1/accounts/register/` | User registration |
| POST | `/api/v1/accounts/token/refresh/` | Refresh JWT token |
| POST | `/api/v1/accounts/token/validate/` | Validate JWT token |
| POST | `/api/v1/accounts/logout/` | User logout |

## API Categories

### 1. User Management (`/api/users/`)

Complete user lifecycle management including authentication, KYC, and profile management.

#### Core User Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List all users |
| POST | `/api/users/` | Create new user |
| GET | `/api/users/{id}/` | Get user details |
| PUT | `/api/users/{id}/` | Update user |
| PATCH | `/api/users/{id}/` | Partial update user |
| DELETE | `/api/users/{id}/` | Delete user |
| GET | `/api/users/me/` | Get current user profile |
| GET | `/api/users/search/` | Search users |

#### Customer Management (`/api/users/customers/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/customers/` | List customers |
| POST | `/api/users/customers/` | Create customer |
| GET | `/api/users/customers/{id}/` | Get customer details |
| PUT | `/api/users/customers/{id}/` | Update customer |
| POST | `/api/users/customers/{id}/check-liveness/` | Check biometric liveness |
| POST | `/api/users/customers/{id}/submit_kyc/` | Submit KYC documents |
| POST | `/api/users/customers/{id}/verify-biometrics/` | Verify biometrics |

#### Merchant Management (`/api/users/merchants/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/merchants/` | List merchants |
| POST | `/api/users/merchants/` | Create merchant |
| GET | `/api/users/merchants/{id}/` | Get merchant details |
| PUT | `/api/users/merchants/{id}/` | Update merchant |
| POST | `/api/users/merchants/{id}/approve/` | Approve merchant |
| POST | `/api/users/merchants/{id}/reject/` | Reject merchant |
| GET | `/api/users/merchants/search/` | Search merchants |

#### KYC Operations (`/api/users/kyc/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/kyc-documents/` | List KYC documents |
| POST | `/api/users/kyc-documents/` | Upload KYC document |
| GET | `/api/users/kyc-documents/{id}/` | Get KYC document |
| PUT | `/api/users/kyc-documents/{id}/` | Update KYC document |
| POST | `/api/users/kyc-documents/{id}/approve/` | Approve KYC document |
| POST | `/api/users/kyc-documents/{id}/reject/` | Reject KYC document |
| POST | `/api/users/kyc/initiate/` | Initiate KYC process |
| GET | `/api/users/kyc/status/` | Get KYC status |

### 2. Payments (`/api/payments/`)

Comprehensive payment processing including transactions, payment methods, mobile money, and cross-border transfers.

#### Payment Methods (`/api/payments/payment-methods/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/payment-methods/` | List payment methods |
| POST | `/api/payments/payment-methods/` | Add payment method |
| GET | `/api/payments/payment-methods/{id}/` | Get payment method |
| PUT | `/api/payments/payment-methods/{id}/` | Update payment method |
| DELETE | `/api/payments/payment-methods/{id}/` | Delete payment method |

#### Transactions (`/api/payments/transactions/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/transactions/` | List transactions |
| POST | `/api/payments/transactions/` | Create transaction |
| GET | `/api/payments/transactions/{id}/` | Get transaction details |
| PUT | `/api/payments/transactions/{id}/` | Update transaction |
| POST | `/api/payments/transactions/{id}/refund/` | Refund transaction |
| POST | `/api/payments/transactions/{id}/add_late_fee/` | Add late fee |
| POST | `/api/payments/transactions/process_payment/` | Process payment |
| GET | `/api/payments/transactions/analytics/` | Transaction analytics |
| GET | `/api/payments/transactions/provider_stats/` | Provider statistics |

#### Mobile Money (`/api/payments/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/verify-mobile/` | Verify mobile number |
| POST | `/api/payments/ussd-transactions/` | Create USSD transaction |
| GET | `/api/payments/ussd-transactions/` | List USSD transactions |
| POST | `/api/payments/ussd/callback/` | USSD callback handler |

#### Cross-Border Payments (`/api/payments/cross-border/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/cross-border/` | List cross-border transfers |
| POST | `/api/payments/cross-border/` | Create cross-border transfer |
| GET | `/api/payments/cross-border/{id}/` | Get transfer details |
| PUT | `/api/payments/cross-border/{id}/` | Update transfer |
| POST | `/api/payments/cross-border/initiate/` | Initiate transfer |
| POST | `/api/payments/cross-border/{id}/request-exemption/` | Request exemption |
| POST | `/api/payments/cross-border/{id}/approve-exemption/` | Approve exemption |
| POST | `/api/payments/cross-border/{id}/reject-exemption/` | Reject exemption |

#### Remittances (`/api/payments/cross-border/remittances/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/cross-border/remittances/` | List remittances |
| POST | `/api/payments/cross-border/remittances/` | Create remittance |
| GET | `/api/payments/cross-border/remittances/{id}/` | Get remittance details |
| POST | `/api/payments/cross-border/remittances/initiate_transfer/` | Initiate transfer |

#### Bill Payments (`/api/payments/bill-payments/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/bill-payments/` | Create bill payment |
| GET | `/api/payments/bill-payments/pending/` | Get pending bills |
| POST | `/api/payments/bill-payments/{id}/add-late-fee/` | Add late fee |
| POST | `/api/payments/transactions/process_bill_payment/` | Process bill payment |

#### Scheduled Payouts (`/api/payments/scheduled-payouts/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/scheduled-payouts/` | List scheduled payouts |
| POST | `/api/payments/scheduled-payouts/` | Create scheduled payout |
| GET | `/api/payments/scheduled-payouts/{id}/` | Get payout details |
| PUT | `/api/payments/scheduled-payouts/{id}/` | Update payout |
| POST | `/api/payments/scheduled-payouts/{id}/process_now/` | Process immediately |
| POST | `/api/payments/scheduled-payouts/{id}/update_schedule/` | Update schedule |

#### Payment Verification (`/api/payments/verify/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/verify/funds/` | Verify funds availability |
| POST | `/api/payments/verify/phone/` | Verify phone number |
| GET | `/api/payments/verify/providers/` | List verification providers |
| POST | `/api/payments/verify/test/` | Test verification |

### 3. Merchants (`/api/merchants/`)

Merchant onboarding, product management, store operations, and business analytics.

#### Onboarding (`/api/merchants/onboarding/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchants/onboarding/` | Get onboarding status |
| POST | `/api/merchants/onboarding/` | Submit onboarding application |
| POST | `/api/merchants/onboarding/verify/` | Verify merchant |

#### Products (`/api/merchants/products/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchants/products/` | List products |
| POST | `/api/merchants/products/` | Create product |
| GET | `/api/merchants/products/{id}/` | Get product details |
| PUT | `/api/merchants/products/{id}/` | Update product |
| DELETE | `/api/merchants/products/{id}/` | Delete product |
| POST | `/api/merchants/products/{id}/toggle_availability/` | Toggle availability |
| GET | `/api/merchants/products/search/` | Search products |

#### Stores (`/api/merchants/stores/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchants/stores/` | List stores |
| POST | `/api/merchants/stores/` | Create store |
| GET | `/api/merchants/stores/{id}/` | Get store details |
| PUT | `/api/merchants/stores/{id}/` | Update store |
| DELETE | `/api/merchants/stores/{id}/` | Delete store |
| POST | `/api/merchants/stores/{id}/toggle_active/` | Toggle active status |

#### Dashboard (`/api/merchants/dashboard/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchants/dashboard/summary/` | Dashboard summary |
| GET | `/api/merchants/dashboard/sales_trend/` | Sales trend data |

### 4. Notifications (`/api/notifications/`)

Real-time notification system for user communications.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/` | List notifications |
| POST | `/api/notifications/` | Create notification |
| GET | `/api/notifications/{id}/` | Get notification details |
| PUT | `/api/notifications/{id}/` | Update notification |
| DELETE | `/api/notifications/{id}/` | Delete notification |
| POST | `/api/notifications/{id}/mark_read/` | Mark as read |
| GET | `/api/notifications/analytics/` | Notification analytics |

### 5. Admin Operations (`/api/v1/accounts/admin/`)

Administrative functions for user management and system oversight.

#### User Administration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/accounts/admin/users/` | List all users (admin) |
| POST | `/api/v1/accounts/admin/users/` | Create user (admin) |
| GET | `/api/v1/accounts/admin/users/{id}/` | Get user details (admin) |
| PUT | `/api/v1/accounts/admin/users/{id}/` | Update user (admin) |
| DELETE | `/api/v1/accounts/admin/users/{id}/` | Delete user (admin) |

#### System Administration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/metrics` | Admin dashboard metrics |
| GET | `/api/audit-logs/` | System audit logs |
| GET | `/api/v1/accounts/admin-activity/` | Admin activity logs |
| GET | `/api/v1/accounts/auth-logs/` | Authentication logs |
| GET | `/api/v1/accounts/security-audit/` | Security audit |

### 6. Accounts & Authentication (`/api/v1/accounts/`)

Advanced account management, MFA, impersonation, and security features.

#### Multi-Factor Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/accounts/mfa/setup/` | Setup MFA |
| POST | `/api/v1/accounts/mfa/verify/` | Verify MFA code |
| GET | `/api/v1/accounts/mfa/backup-codes/` | Get backup codes |
| POST | `/api/v1/accounts/mfa/backup-codes/` | Generate backup codes |

#### Password Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/accounts/password-reset/` | Request password reset |
| POST | `/api/v1/accounts/password-reset/confirm/` | Confirm password reset |
| GET | `/api/v1/accounts/password-policy/` | Get password policy |
| POST | `/api/v1/accounts/password-policy/` | Update password policy |

#### Session Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/accounts/sessions/` | List user sessions |
| GET | `/api/v1/accounts/sessions/concurrent-check/` | Check concurrent sessions |
| POST | `/api/v1/accounts/sessions/logout-others/` | Logout other sessions |
| GET | `/api/v1/accounts/session-test/` | Test session |

#### Admin Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/accounts/impersonate/{user_id}/` | Impersonate user |
| POST | `/api/v1/accounts/stop-impersonating/` | Stop impersonation |
| GET | `/api/v1/accounts/search/` | Search users/accounts |

#### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/accounts/webhooks/stripe/` | Stripe webhook |
| POST | `/api/v1/accounts/webhooks/paypal/` | PayPal webhook |
| POST | `/api/v1/accounts/webhooks/mobile-money/` | Mobile money webhook |

### 7. Additional Services

#### Health Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/` | Health check |

#### Schema & Documentation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schema/` | OpenAPI schema |
| GET | `/api/docs/` | Swagger UI documentation |
| GET | `/api/redoc/` | ReDoc documentation |

## Response Codes

- **200**: Success
- **201**: Created
- **204**: No Content
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error

## Rate Limiting

- **General**: 100 requests per minute per IP
- **Payment endpoints**: 30 requests per hour per user
- **Admin endpoints**: 100 requests per hour per user

## Webhooks

PayGlobe supports webhooks for real-time notifications:

- **Stripe payments**: `/api/v1/accounts/webhooks/stripe/`
- **PayPal payments**: `/api/v1/accounts/webhooks/paypal/`
- **Mobile money**: `/api/v1/accounts/webhooks/mobile-money/`

## Data Models

### Key Entities
- **User**: Base user account with authentication
- **Customer**: End customer with KYC and payment methods
- **Merchant**: Business entity with products and stores
- **Transaction**: Payment transaction record
- **PaymentMethod**: Stored payment method (card, mobile money)
- **Product**: Merchant product for sale
- **Store**: Merchant physical/online store location

### Transaction Types
- **PAYMENT**: Standard payment
- **REFUND**: Payment refund
- **TRANSFER**: Money transfer
- **BILL_PAYMENT**: Utility bill payment
- **REMITTANCE**: Cross-border remittance
- **PAYOUT**: Merchant payout

### Transaction Statuses
- **PENDING**: Transaction initiated
- **PROCESSING**: Being processed
- **COMPLETED**: Successfully completed
- **FAILED**: Transaction failed
- **CANCELLED**: Transaction cancelled

## Security Features

- **JWT Authentication**: Token-based authentication
- **Rate Limiting**: DDoS protection
- **CORS**: Cross-origin request protection
- **CSP**: Content Security Policy
- **Audit Logging**: All admin actions logged
- **Session Management**: Secure session handling
- **MFA Support**: Multi-factor authentication
- **Biometric Verification**: Face/fingerprint verification

## Getting Started

1. **Start the backend server**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Access API documentation**:
   - Swagger UI: `http://localhost:8000/api/docs/`
   - ReDoc: `http://localhost:8000/api/redoc/`
   - OpenAPI Schema: `http://localhost:8000/api/schema/`

3. **Authentication**:
   - Register/Login via `/api/v1/accounts/register/` and `/api/v1/accounts/login/`
   - Use JWT token in Authorization header

4. **Test endpoints**:
   - Use Swagger UI for interactive testing
   - Check `/health/` for server status

## Support

For API support and questions, refer to:
- Interactive API documentation at `/api/docs/`
- Health check endpoint at `/health/`
- Error responses include detailed error messages

## Version

**API Version**: 1.0.0
**Last Updated**: November 2025
