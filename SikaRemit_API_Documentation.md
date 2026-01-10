# SikaRemit API Documentation

## Overview

SikaRemit is a comprehensive fintech platform providing payment processing, cross-border remittances, bill payments, and merchant services. This document provides detailed API documentation for all SikaRemit endpoints.

## Base URL
```
https://api.sikaremit.com/
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Versioning
Authentication and accounts APIs use version prefix `v1` in the URL path (e.g., `/api/v1/accounts/`). Other API endpoints do not use versioning prefixes.

---

## 1. Authentication and User Management APIs

### Accounts API (`/api/v1/accounts/`)

#### User Registration
- **Endpoint**: `POST /api/v1/accounts/register/`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+233xxxxxxxxx"
  }
  ```

#### User Login
- **Endpoint**: `POST /api/v1/accounts/login/`
- **Description**: Authenticate user and return JWT tokens
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

#### Token Refresh
- **Endpoint**: `POST /api/v1/accounts/refresh/`
- **Description**: Refresh JWT access token
- **Request Body**:
  ```json
  {
    "refresh": "refresh_token_here"
  }
  ```

#### User Logout
- **Endpoint**: `POST /api/v1/accounts/logout/`
- **Description**: Blacklist refresh token

#### Password Reset
- **Endpoint**: `POST /api/v1/accounts/password/reset/`
- **Description**: Request password reset email

#### Password Reset Confirm
- **Endpoint**: `POST /api/v1/accounts/password/reset/confirm/`
- **Description**: Confirm password reset with token

#### Password Change
- **Endpoint**: `POST /api/v1/accounts/password/change/`
- **Description**: Change password for authenticated user

#### Email Verification
- **Endpoint**: `POST /api/v1/accounts/resend-verification/`
- **Description**: Resend email verification

#### Email Verification Confirm
- **Endpoint**: `POST /api/v1/accounts/verify-email/`
- **Description**: Confirm email with verification token

#### User Profile
- **Endpoint**: `GET/PATCH /api/v1/accounts/profile/`
- **Description**: Get or update user profile information

#### MFA Setup
- **Endpoint**: `POST /api/v1/accounts/2fa/setup/`
- **Description**: Setup two-factor authentication

#### MFA Verify
- **Endpoint**: `POST /api/v1/accounts/mfa/verify/`
- **Description**: Verify MFA code during login

#### MFA Backup Codes
- **Endpoint**: `GET/POST /api/v1/accounts/mfa/backup-codes/`
- **Description**: Manage MFA backup codes

#### Google OAuth Callback
- **Endpoint**: `POST /api/v1/accounts/google/callback/`
- **Description**: Handle Google OAuth callback

#### Customer Balance
- **Endpoint**: `GET /api/v1/accounts/customers/balance/`
- **Description**: Get customer account balance

#### Customer Payments
- **Endpoint**: `GET /api/v1/accounts/customers/payments/`
- **Description**: Get customer payment history

#### Customer Receipts
- **Endpoint**: `GET /api/v1/accounts/customers/receipts/`
- **Description**: Get customer receipts

#### Support Tickets
- **Endpoint**: `GET/POST /api/v1/accounts/customers/support-tickets/`
- **Endpoint**: `GET/PATCH/DELETE /api/v1/accounts/customers/support-tickets/{id}/`
- **Description**: Manage customer support tickets

#### Merchant Payouts
- **Endpoint**: `GET/POST /api/v1/accounts/merchant/payouts/`
- **Endpoint**: `GET/PATCH/DELETE /api/v1/accounts/merchant/payouts/{id}/`
- **Description**: Manage merchant payout requests

#### Admin User Management
- **Endpoint**: `GET/POST /api/v1/accounts/admin/users/`
- **Endpoint**: `GET/PATCH/DELETE /api/v1/accounts/admin/users/{id}/`
- **Description**: Admin endpoints for user management

---

## 2. Users API (`/api/users/`)

#### User List/Create
- **Endpoint**: `GET/POST /api/users/`
- **Description**: List all users or create new user (admin)

#### User Detail
- **Endpoint**: `GET/PATCH/DELETE /api/users/{id}/`
- **Description**: Get, update, or delete specific user

#### Current User Info
- **Endpoint**: `GET /api/users/me/`
- **Description**: Get current authenticated user information

#### Email Verification
- **Endpoint**: `POST /api/users/verify-email/{token}/`
- **Description**: Verify user email with token

#### Biometric Verification
- **Endpoint**: `POST /api/users/customers/{id}/verify-biometrics/`
- **Description**: Verify user biometrics

#### Liveness Check
- **Endpoint**: `POST /api/users/customers/{id}/check-liveness/`
- **Description**: Perform liveness detection check

#### Customer Profile
- **Endpoint**: `GET /api/users/customers/me/`
- **Description**: Get current customer profile

#### Merchants
- **Endpoint**: `GET/POST /api/users/merchants/`
- **Endpoint**: `GET/PATCH/DELETE /api/users/merchants/{id}/`
- **Description**: Manage merchant accounts

#### Customers
- **Endpoint**: `GET/POST /api/users/customers/`
- **Endpoint**: `GET/PATCH/DELETE /api/users/customers/{id}/`
- **Description**: Manage customer accounts

#### KYC Documents
- **Endpoint**: `GET/POST /api/users/kyc-documents/`
- **Endpoint**: `GET/PATCH/DELETE /api/users/kyc-documents/{id}/`
- **Description**: Manage KYC document submissions

#### KYC Applications
- **Endpoint**: `GET/POST /api/users/kyc/`
- **Endpoint**: `GET/PATCH/DELETE /api/users/kyc/{id}/`
- **Description**: Manage KYC applications

#### Merchant Customers
- **Endpoint**: `GET/POST /api/users/merchant-customers/`
- **Endpoint**: `GET/PATCH/DELETE /api/users/merchant-customers/{id}/`
- **Description**: Manage merchant customer relationships

#### Merchant KYC Submissions
- **Endpoint**: `GET/POST /api/users/merchant-kyc-submissions/`
- **Endpoint**: `GET/PATCH/DELETE /api/users/merchant-kyc-submissions/{id}/`
- **Description**: Manage merchant KYC submissions

#### Admin KYC Inbox
- **Endpoint**: `GET /api/users/admin-kyc-inbox/`
- **Description**: Admin view of all KYC submissions

#### Admin KYC Inbox Stats
- **Endpoint**: `GET /api/users/admin-kyc-inbox/stats/`
- **Description**: Statistics for KYC inbox

#### KYC Verification
- **Endpoint**: `POST /api/users/kyc/verification/`
- **Description**: Perform KYC verification

#### KYC Eligibility Check
- **Endpoint**: `GET /api/users/kyc/eligibility/`
- **Description**: Check transaction eligibility based on KYC status

#### KYC Documents
- **Endpoint**: `GET /api/users/kyc/documents/`
- **Description**: Get required KYC documents

#### 3. Payment Processing APIs (`/api/payments/`)

### Payment Methods
- **Endpoint**: `GET/POST /api/payments/payment-methods/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/payment-methods/{id}/`
- **Description**: Manage payment methods (cards, mobile money, etc.)

### Transactions
- **Endpoint**: `GET/POST /api/payments/transactions/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/transactions/{id}/`
- **Description**: Manage payment transactions

### Admin Transactions
- **Endpoint**: `GET/POST /api/payments/admin/transactions/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/admin/transactions/{id}/`
- **Description**: Admin view of all transactions

### USSD Transactions
- **Endpoint**: `GET/POST /api/payments/ussd-transactions/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/ussd-transactions/{id}/`
- **Description**: Manage USSD-based transactions

### Payments
- **Endpoint**: `GET/POST /api/payments/payments/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/payments/{id}/`
- **Description**: Process payments

### Scheduled Payouts
- **Endpoint**: `GET/POST /api/payments/scheduled-payouts/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/scheduled-payouts/{id}/`
- **Description**: Manage scheduled payout operations

### Currencies
- **Endpoint**: `GET/POST /api/payments/currencies/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/currencies/{id}/`
- **Description**: Manage supported currencies

### Countries
- **Endpoint**: `GET/POST /api/payments/countries/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/countries/{id}/`
- **Description**: Manage supported countries

### Wallet
- **Endpoint**: `GET/POST /api/payments/wallet/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/wallet/{id}/`
- **Description**: Manage user wallets

### Rate Limiting
- **Endpoint**: `GET/POST /api/payments/rate-limiting/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/rate-limiting/{id}/`
- **Description**: Manage rate limiting rules

### Rate Monitoring
- **Endpoint**: `GET/POST /api/payments/rate-monitoring/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/rate-monitoring/{id}/`
- **Description**: Monitor rate limiting

### Fees
- **Endpoint**: `GET/POST /api/payments/fees/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/fees/{id}/`
- **Description**: Manage fee configurations

### Bills
- **Endpoint**: `GET/POST /api/payments/bills/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/bills/{id}/`
- **Description**: Manage bill payments

### Subscriptions
- **Endpoint**: `GET/POST /api/payments/subscriptions/`
- **Endpoint**: `GET/PATCH/DELETE /api/payments/subscriptions/{id}/`
- **Description**: Manage payment subscriptions

### Currency APIs
- **Endpoint**: `GET /api/payments/api/currencies/`
- **Description**: Get list of supported currencies
- **Endpoint**: `GET /api/payments/api/currencies/historical/`
- **Description**: Get historical exchange rates
- **Endpoint**: `POST /api/payments/api/currencies/set-rates/`
- **Description**: Set exchange rates (admin)
- **Endpoint**: `GET/PATCH /api/payments/api/currency-preferences/`
- **Description**: Manage currency display preferences
- **Endpoint**: `GET /api/payments/api/countries/`
- **Description**: Get list of supported countries
- **Endpoint**: `GET /api/payments/api/countries/{code}/`
- **Description**: Get country details
- **Endpoint**: `GET /api/payments/api/exchange-rates/`
- **Description**: Get current exchange rates
- **Endpoint**: `POST /api/payments/api/convert-currency/`
- **Description**: Convert between currencies

### P2P Payments
- **Endpoint**: `POST /api/payments/api/send/`
- **Description**: Send money to another user
- **Endpoint**: `POST /api/payments/api/request/`
- **Description**: Request money from another user

### Verification APIs
- **Endpoint**: `POST /api/payments/api/verify/phone/`
- **Description**: Verify phone number
- **Endpoint**: `POST /api/payments/api/verify/funds/`
- **Description**: Verify available funds
- **Endpoint**: `POST /api/payments/api/verify/recipient/`
- **Description**: Verify recipient details
- **Endpoint**: `GET /api/payments/api/verify/providers/`
- **Description**: Get available verification providers
- **Endpoint**: `POST /api/payments/api/verify/test/`
- **Description**: Test verification provider
- **Endpoint**: `GET /api/payments/api/verify/analytics/`
- **Description**: Get verification analytics
- **Endpoint**: `GET /api/payments/api/verify/provider-stats/`
- **Description**: Get provider statistics

### Telecom Services
- **Endpoint**: `GET /api/payments/telecom/providers/country/{country_code}/`
- **Description**: Get telecom providers by country
- **Endpoint**: `GET /api/payments/telecom/packages/country/{country_code}/`
- **Description**: Get telecom packages by country

### Payment Processing
- **Endpoint**: `POST /api/payments/api/process/`
- **Description**: Process a payment
- **Endpoint**: `POST /api/payments/api/webhooks/bank-transfer/`
- **Description**: Handle bank transfer webhooks
- **Endpoint**: `POST /api/payments/api/webhooks/mobile-money/`
- **Description**: Handle mobile money webhooks
- **Endpoint**: `POST /api/payments/api/verify-mobile/`
- **Description**: Verify mobile money payment
- **Endpoint**: `GET /api/payments/api/reports/`
- **Description**: Get payment reports
- **Endpoint**: `POST /api/payments/api/ussd/callback/`
- **Description**: Handle USSD callbacks

### Cross-border Remittances
- **Endpoint**: `POST /api/payments/api/cross-border/initiate/`
- **Description**: Initiate cross-border transfer

### Payment Methods API
- **Endpoint**: `GET /api/payments/api/available-methods/`
- **Description**: Get available payment methods

### Bills Management
- **Endpoint**: `GET /api/payments/bills/pending/`
- **Description**: Get pending bills
- **Endpoint**: `POST /api/payments/bills/{id}/late-fee/`
- **Description**: Apply late fee to bill
- **Endpoint**: `POST /api/payments/bills/{id}/pay/`
- **Description**: Pay a bill

### QR Payments
- **Endpoint**: `POST /api/payments/api/qr/validate/`
- **Description**: Validate QR payment
- **Endpoint**: `POST /api/payments/api/qr/process/`
- **Description**: Process QR payment

### Special Payment Endpoints
- **Endpoint**: `POST /api/payments/api/payments/remittance/`
- **Description**: Send remittance
- **Endpoint**: `POST /api/payments/api/payments/initiate/`
- **Description**: Initiate payment
- **Endpoint**: `POST /api/payments/api/payments/checkout/`
- **Description**: Process checkout
- **Endpoint**: `POST /api/payments/api/payments/outbound-remittance/`
- **Description**: Send outbound remittance
- **Endpoint**: `POST /api/payments/api/payments/global-remittance/`
- **Description**: Send global remittance
- **Endpoint**: `GET /api/payments/api/payments/analytics/methods/`
- **Description**: Get payment method analytics
- **Endpoint**: `POST /api/payments/api/payments/verify/`
- **Description**: Verify payment
- **Endpoint**: `POST /api/payments/api/payments/refund/`
- **Description**: Request refund
- **Endpoint**: `GET /api/payments/api/payments/data-plans/`
- **Description**: Get data plans
- **Endpoint**: `POST /api/payments/api/payments/subscriptions/upgrade/`
- **Description**: Upgrade subscription
- **Endpoint**: `GET /api/payments/api/payments/api/transactions/recent/`
- **Description**: Get recent transactions

### Merchant Transactions
- **Endpoint**: `GET /api/payments/api/merchant/transactions/`
- **Description**: Get merchant transactions

---

## 4. Merchant Services APIs (`/api/merchants/`)

### Stores
- **Endpoint**: `GET/POST /api/merchants/stores/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/stores/{id}/`
- **Description**: Manage merchant stores

### Products
- **Endpoint**: `GET/POST /api/merchants/products/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/products/{id}/`
- **Description**: Manage store products

### Merchant Dashboard
- **Endpoint**: `GET/POST /api/merchants/dashboard/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/dashboard/{id}/`
- **Description**: Merchant dashboard data

### Applications
- **Endpoint**: `GET/POST /api/merchants/applications/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/applications/{id}/`
- **Description**: Manage merchant applications

### Invitations
- **Endpoint**: `GET/POST /api/merchants/invitations/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/invitations/{id}/`
- **Description**: Manage merchant invitations

### Report Templates
- **Endpoint**: `GET/POST /api/merchants/report-templates/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/report-templates/{id}/`
- **Description**: Manage report templates

### Reports
- **Endpoint**: `GET/POST /api/merchants/reports/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/reports/{id}/`
- **Description**: Generate and manage reports

### Scheduled Reports
- **Endpoint**: `GET/POST /api/merchants/scheduled-reports/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/scheduled-reports/{id}/`
- **Description**: Manage scheduled report generation

### Merchant Customers
- **Endpoint**: `GET/POST /api/merchants/customers/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/customers/{id}/`
- **Description**: Manage merchant customers

### Merchant Transactions
- **Endpoint**: `GET/POST /api/merchants/transactions/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/transactions/{id}/`
- **Description**: View merchant transactions

### Notifications
- **Endpoint**: `GET/POST /api/merchants/notifications/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/notifications/{id}/`
- **Description**: Manage merchant notifications

### Analytics
- **Endpoint**: `GET/POST /api/merchants/analytics/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/analytics/{id}/`
- **Description**: Merchant analytics data

### Invoices
- **Endpoint**: `GET/POST /api/merchants/invoices/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/invoices/{id}/`
- **Description**: Manage merchant invoices

### Settings
- **Endpoint**: `GET/POST /api/merchants/settings/`
- **Endpoint**: `GET/PATCH/DELETE /api/merchants/settings/{id}/`
- **Description**: Merchant account settings

### Onboarding
- **Endpoint**: `GET /api/merchants/onboarding/`
- **Description**: Get onboarding status
- **Endpoint**: `POST /api/merchants/onboarding/verify/`
- **Description**: Upload verification documents

### Invitation Management
- **Endpoint**: `POST /api/merchants/invitations/validate/{token}/`
- **Description**: Validate invitation token
- **Endpoint**: `POST /api/merchants/invitations/accept/{token}/`
- **Description**: Accept merchant invitation

---

## 5. Admin Merchant APIs (`/api/admin/`)

### Invitations
- **Endpoint**: `GET/POST /api/admin/merchants/invitations/`
- **Endpoint**: `GET /api/admin/merchants/invitations/{id}/`
- **Endpoint**: `POST /api/admin/merchants/invitations/{id}/resend/`
- **Endpoint**: `POST /api/admin/merchants/invitations/{id}/cancel/`
- **Description**: Admin management of merchant invitations

### Applications
- **Endpoint**: `GET /api/admin/merchants/applications/`
- **Endpoint**: `GET /api/admin/merchants/applications/{id}/`
- **Endpoint**: `POST /api/admin/merchants/applications/{id}/approve/`
- **Endpoint**: `POST /api/admin/merchants/applications/{id}/reject/`
- **Description**: Admin review of merchant applications

### Statistics
- **Endpoint**: `GET /api/admin/merchants/stats/`
- **Description**: Merchant statistics for admin

---

## 6. KYC APIs (`/api/kyc/`)

### KYC Documents
- **Endpoint**: `GET/POST /api/kyc/documents/`
- **Endpoint**: `GET/PATCH/DELETE /api/kyc/documents/{id}/`
- **Description**: Manage KYC document uploads

### KYC Status
- **Endpoint**: `GET/POST /api/kyc/status/`
- **Endpoint**: `GET/PATCH/DELETE /api/kyc/status/{id}/`
- **Description**: Check KYC verification status

### Biometrics
- **Endpoint**: `GET/POST /api/kyc/biometrics/`
- **Endpoint**: `GET/PATCH/DELETE /api/kyc/biometrics/{id}/`
- **Description**: Manage biometric verification

---

## 7. Notifications APIs (`/api/v1/notifications/`)

### Notifications
- **Endpoint**: `GET/POST /api/v1/notifications/`
- **Endpoint**: `GET/PATCH/DELETE /api/v1/notifications/{id}/`
- **Description**: Manage user notifications

### Mark as Read
- **Endpoint**: `POST /api/v1/notifications/{id}/mark_read/`
- **Description**: Mark notification as read

---

## 8. Invoices APIs (`/api/invoices/`)

### Invoices
- **Endpoint**: `GET/POST /api/invoices/`
- **Endpoint**: `GET/PATCH/DELETE /api/invoices/{id}/`
- **Description**: Manage invoices

---

## 9. Dashboard APIs (`/api/admin/dashboard/` and `/api/dashboard/`)

### Metrics
- **Endpoint**: `GET /api/dashboard/metrics/`
- **Description**: Get dashboard metrics

### Stats
- **Endpoint**: `GET /api/dashboard/stats/`
- **Description**: Get dashboard statistics

### Admin Stats
- **Endpoint**: `GET /api/dashboard/admin-stats/`
- **Description**: Get admin statistics

### Business Summary
- **Endpoint**: `GET /api/dashboard/business-summary/`
- **Description**: Get business summary data

### Sales Trends
- **Endpoint**: `GET /api/dashboard/sales-trends/`
- **Description**: Get sales trends data

### Recent Activity
- **Endpoint**: `GET /api/dashboard/recent-activity/`
- **Description**: Get recent activity

### System Health
- **Endpoint**: `GET /api/dashboard/system-health/`
- **Description**: Get system health status

### Fee Configurations
- **Endpoint**: `GET/POST /api/dashboard/fee-configurations/`
- **Endpoint**: `GET/PUT/PATCH/DELETE /api/dashboard/fee-configurations/{id}/`
- **Description**: Manage fee configurations

---

## 10. USSD APIs (`/api/`)

### USSD Sessions
- **Endpoint**: `GET /api/admin/ussd/sessions/`
- **Description**: Admin view of USSD sessions

### USSD Transactions
- **Endpoint**: `GET /api/admin/ussd/transactions/`
- **Description**: Admin view of USSD transactions

### USSD Stats
- **Endpoint**: `GET /api/admin/ussd/stats/`
- **Description**: USSD usage statistics

### USSD Simulation
- **Endpoint**: `POST /api/admin/ussd/simulate/`
- **Description**: Simulate USSD interactions

---

## 11. Compliance APIs

### Regulatory Submissions
- **Endpoint**: `GET/POST /api/compliance/regulatory-submissions/`
- **Endpoint**: `GET/PATCH/DELETE /api/compliance/regulatory-submissions/{id}/`
- **Description**: Manage regulatory submissions

---

## 12. Core Admin APIs

### Audit Logs
- **Endpoint**: `GET /api/audit-logs/`
- **Description**: View system audit logs

### Admin Metrics
- **Endpoint**: `GET /api/admin/metrics/`
- **Description**: Get admin metrics

### Admin Settings
- **Endpoint**: `GET/PATCH /api/admin/settings/`
- **Description**: Manage admin settings

---

## Error Responses

All APIs return standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error response format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

APIs are rate limited based on user type:
- Anonymous: 200/hour
- Regular users: 2000/hour
- Admin users: 20000/hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

*This documentation covers all API endpoints discovered in the SikaRemit backend. For detailed request/response schemas, refer to the OpenAPI/Swagger documentation at `/api/docs/`.*
