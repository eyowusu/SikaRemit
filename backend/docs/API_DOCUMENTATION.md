# SikaRemit API Documentation

## Overview

SikaRemit is a comprehensive fintech platform providing payment processing, money transfers, compliance management, and merchant services. This document outlines the API endpoints for the core functionality.

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Core API Endpoints

### User Management

#### Get User Balance
- **Endpoint**: `GET /api/accounts/balance/`
- **Description**: Retrieve the authenticated user's account balance
- **Response**:
```json
{
  "available": 1250.75,
  "pending": 150.00,
  "currency": "USD",
  "lastUpdated": "2025-01-15T10:30:00Z"
}
```

#### Update User Profile
- **Endpoint**: `PATCH /api/v1/accounts/profile/`
- **Description**: Update user profile information
- **Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "country": "US"
}
```

### Payment Processing

#### Process Payment
- **Endpoint**: `POST /api/payments/process/`
- **Description**: Process a payment transaction using the specified payment method
- **Request Body**:
```json
{
  "user": "user_id",
  "amount": 100.00,
  "payment_method": "payment_method_id",
  "currency": "USD"
}
```
- **Response**:
```json
{
  "success": true,
  "transaction_id": "txn_1234567890",
  "status": "completed",
  "gateway_response": {
    "transaction_id": "txn_1234567890",
    "status": "succeeded"
  }
}
```

#### Verify Mobile Payment
- **Endpoint**: `POST /api/payments/verify/mobile/`
- **Description**: Verify a mobile money payment transaction
- **Request Body**:
```json
{
  "transaction_id": "txn_1234567890",
  "provider": "mtn"
}
```

### Payment Methods

#### List Payment Methods
- **Endpoint**: `GET /api/payments/payment-methods/`
- **Description**: Get all payment methods for the authenticated user
- **Response**:
```json
[
  {
    "id": "pm_123",
    "method_type": "card",
    "details": {
      "brand": "visa",
      "last4": "4242",
      "verified": true
    },
    "is_default": true
  }
]
```

#### Verify Payment Method
- **Endpoint**: `POST /api/payments/payment-methods/{id}/verify/`
- **Description**: Initiate verification for a payment method
- **Request Body**:
```json
{
  "verification_type": "micro_deposit"
}
```
- **Response**:
```json
{
  "status": "success",
  "message": "Card verification completed successfully"
}
```

#### Confirm Payment Method Verification
- **Endpoint**: `POST /api/payments/payment-methods/{id}/confirm_verification/`
- **Description**: Confirm payment method verification with code
- **Request Body**:
```json
{
  "code": "123456",
  "verification_id": "VER-123-456"
}
```

### Transactions

#### List Transactions
- **Endpoint**: `GET /api/payments/transactions/`
- **Description**: Get transaction history for the authenticated user
- **Query Parameters**:
  - `status`: Filter by transaction status
  - `limit`: Number of results (default: 10)
- **Response**:
```json
[
  {
    "id": "txn_123",
    "amount": 100.00,
    "currency": "USD",
    "status": "completed",
    "created_at": "2025-01-15T10:30:00Z",
    "payment_method": "pm_123"
  }
]
```

#### Process Refund
- **Endpoint**: `POST /api/payments/transactions/{id}/refund/`
- **Description**: Process a refund for a completed transaction
- **Request Body**:
```json
{
  "amount": 50.00
}
```

### Cross-Border Remittances

#### Initiate Remittance
- **Endpoint**: `POST /api/payments/remittance/initiate_transfer/`
- **Description**: Initiate an international money transfer
- **Request Body**:
```json
{
  "recipientName": "John Doe",
  "recipientPhone": "+233501234567",
  "recipientCountry": "GH",
  "amount": 500.00,
  "currency": "USD",
  "purpose": "family_support",
  "paymentMethod": "pm_card_123"
}
```
- **Response**:
```json
{
  "id": "rem_123",
  "status": "initiated",
  "reference_number": "CB-ABC123DEF",
  "exchange_rate": 12.5,
  "fee": 10.00,
  "amount_received": 612.50
}
```

#### Calculate Transfer Fees
- **Endpoint**: `POST /api/payments/remittance/calculate_transfer_fees/`
- **Description**: Calculate fees and exchange rates for a potential transfer
- **Request Body**:
```json
{
  "amount": 500.00,
  "destination": "GH",
  "from_currency": "USD"
}
```
- **Response**:
```json
{
  "baseFee": 5.00,
  "percentageFee": 6.25,
  "totalFee": 11.25,
  "exchangeRate": 12.5,
  "recipientReceives": 611.25,
  "amount": 500.00,
  "destination": "GH",
  "fromCurrency": "USD"
}
```

### Dashboard Analytics

#### Admin Dashboard Stats
- **Endpoint**: `GET /api/admin/dashboard/stats/`
- **Description**: Get comprehensive platform statistics (Admin only)
- **Response**:
```json
{
  "overview": {
    "total_users": 1250,
    "active_users": 890,
    "total_revenue": 45678.90,
    "revenue_growth": 12.5,
    "total_transactions": 5678,
    "transaction_growth": 8.3,
    "pending_verifications": 45,
    "failed_payments": 12
  },
  "revenue_by_period": [...],
  "transactions_by_status": {...},
  "users_by_type": {...},
  "top_merchants": [...],
  "recent_activities": [...],
  "payment_methods": {...},
  "geographic_distribution": {...}
}
```

### Fee Management (Admin)

#### List Fee Configurations
- **Endpoint**: `GET /api/admin/fee-configurations/`
- **Description**: Get all fee configurations (Admin only)
- **Response**:
```json
[
  {
    "id": 1,
    "name": "Standard Remittance Fee",
    "fee_type": "remittance",
    "calculation_method": "percentage",
    "fixed_fee": 5.00,
    "percentage_fee": 0.025,
    "currency": "USD",
    "status": "active"
  }
]
```

### Merchant Management (Admin)

#### List Merchants
- **Endpoint**: `GET /api/admin/merchants/`
- **Description**: Get all merchants and invitations (Admin only)
- **Response**:
```json
{
  "invitations": [...],
  "applications": [...],
  "stats": {
    "total_invitations": 50,
    "pending_invitations": 10,
    "accepted_invitations": 35,
    "conversion_rate": 70.0
  }
}
```

#### Send Merchant Invitation
- **Endpoint**: `POST /api/admin/merchants/invite/`
- **Description**: Send invitation to join as merchant (Admin only)
- **Request Body**:
```json
{
  "email": "merchant@example.com",
  "businessName": "ABC Company Ltd",
  "businessType": "retail",
  "phoneNumber": "+1234567890",
  "notes": "Interested in payment processing"
}
```

### User Management (Admin)

#### List Users
- **Endpoint**: `GET /api/v1/accounts/admin/users/`
- **Description**: Get all platform users (Admin only)
- **Query Parameters**:
  - `search`: Search by email or name
- **Response**:
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": 3,
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE"  // Optional
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Payment Gateway Integration

### Supported Gateways

1. **Stripe**: For card payments (Visa, Mastercard, etc.)
2. **Paystack**: For African markets and mobile money

### Gateway-Specific Features

#### Stripe
- Supports 3D Secure verification
- Webhook-based transaction updates
- Refund processing
- Tokenized card storage

#### Paystack
- Mobile money integration (MTN, Vodafone, AirtelTigo)
- Bank transfers
- QR payments
- Ghanaian market focus

## Compliance and Security

### KYC Requirements
- User identity verification
- Document upload and validation
- Risk assessment scoring

### Transaction Monitoring
- Amount limits and thresholds
- Geographic restrictions
- Suspicious activity detection

### Compliance Checks
- Bank of Ghana regulations
- Anti-money laundering (AML)
- Counter-terrorism financing (CTF)

## Rate Limiting

API endpoints are protected by rate limiting:
- Payment endpoints: 10 requests per minute
- General endpoints: 100 requests per minute
- Admin endpoints: 500 requests per minute

## Webhooks

The system supports webhook notifications for:
- Payment completions
- Refund processing
- Remittance status updates
- Compliance alerts

Webhook signature verification is required for security.

## Testing

Use the following test credentials for development:

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Paystack Test Keys
Available in development environment variables.

## Support

For API integration support, contact the development team or refer to the codebase documentation.
