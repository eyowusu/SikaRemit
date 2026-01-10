# SikaRemit Pre-Launch Testing Checklist

Complete all tests before going live with real money.

---

## 1. Payment Flow Testing

### Mobile Money (Ghana)

#### MTN MoMo
- [ ] Deposit to wallet (sandbox)
- [ ] Deposit to wallet (live - small amount)
- [ ] Withdrawal from wallet
- [ ] P2P transfer
- [ ] Failed transaction handling
- [ ] Timeout handling
- [ ] Webhook receipt verification

#### Telecel Cash
- [ ] Deposit to wallet
- [ ] Withdrawal from wallet
- [ ] P2P transfer
- [ ] Error handling

#### AirtelTigo Money
- [ ] Deposit to wallet
- [ ] Withdrawal from wallet
- [ ] P2P transfer
- [ ] Error handling

### Card Payments

#### Paystack
- [ ] Test card payment (4084084084084081)
- [ ] Live card payment (small amount)
- [ ] 3D Secure flow
- [ ] Failed payment handling
- [ ] Refund processing
- [ ] Webhook verification

#### Stripe
- [ ] Test card payment
- [ ] Live card payment
- [ ] Payment intent flow
- [ ] Refund processing

### Bank Transfer
- [ ] Generate bank details
- [ ] Verify incoming transfer
- [ ] Reconciliation

---

## 2. User Journey Testing

### Registration Flow
- [ ] Email registration
- [ ] Phone number validation (Ghana format)
- [ ] Password strength enforcement
- [ ] Email verification
- [ ] Welcome email received
- [ ] Google OAuth login

### KYC Verification
- [ ] Tier 1: Phone verification
- [ ] Tier 2: Ghana Card upload
- [ ] Tier 2: Passport upload
- [ ] Tier 2: Voter ID upload
- [ ] Tier 3: Address verification
- [ ] Tier 3: Selfie/liveness check
- [ ] KYC rejection flow
- [ ] KYC resubmission

### Login & Security
- [ ] Standard login
- [ ] Biometric login (mobile)
- [ ] MFA setup (TOTP)
- [ ] MFA login
- [ ] Password reset
- [ ] Account lockout (5 failed attempts)
- [ ] Session timeout

---

## 3. Transaction Testing

### Send Money (Domestic)
| Test Case | Amount | Expected |
|-----------|--------|----------|
| Within balance | GHS 50 | Success |
| Exact balance | Full balance | Success |
| Over balance | Balance + 1 | Fail - insufficient funds |
| Below minimum | GHS 0.50 | Fail - below minimum |
| Above daily limit | GHS 25,000 | Fail - limit exceeded |
| Invalid recipient | Wrong number | Fail - invalid recipient |
| Self-transfer | Own number | Fail - cannot send to self |

### International Remittance
| Corridor | Test |
|----------|------|
| Ghana → Nigeria | Send NGN equivalent |
| Ghana → UK | Send GBP equivalent |
| Ghana → USA | Send USD equivalent |
| Exchange rate | Verify rate accuracy |
| Fees | Verify fee calculation |

### Bill Payments
- [ ] ECG (Electricity)
- [ ] Ghana Water
- [ ] DSTV/GOtv
- [ ] Internet providers
- [ ] Airtime top-up
- [ ] Data bundle purchase

---

## 4. Edge Cases

### Network Issues
- [ ] Slow network (3G simulation)
- [ ] Network timeout
- [ ] Offline mode (mobile)
- [ ] Retry after failure

### Concurrent Transactions
- [ ] Two transactions same time
- [ ] Race condition prevention
- [ ] Balance consistency

### Boundary Testing
- [ ] Maximum amount (GHS 20,000)
- [ ] Minimum amount (GHS 1)
- [ ] Maximum decimal places
- [ ] Special characters in names
- [ ] Long recipient names

---

## 5. Admin Panel Testing

### User Management
- [ ] View all users
- [ ] Search users
- [ ] View user details
- [ ] Suspend user
- [ ] Unsuspend user
- [ ] Reset user password

### Transaction Management
- [ ] View all transactions
- [ ] Filter by status
- [ ] Filter by date
- [ ] View transaction details
- [ ] Manual refund
- [ ] Dispute resolution

### KYC Management
- [ ] View pending KYC
- [ ] Approve KYC
- [ ] Reject KYC with reason
- [ ] Request additional documents

### Reports
- [ ] Daily transaction report
- [ ] Monthly summary
- [ ] User growth report
- [ ] Revenue report
- [ ] Export to CSV/Excel

---

## 6. Mobile App Testing

### iOS
- [ ] iPhone 12 (iOS 15)
- [ ] iPhone 14 (iOS 17)
- [ ] iPad compatibility
- [ ] Face ID login
- [ ] Push notifications
- [ ] Deep links

### Android
- [ ] Samsung Galaxy S21 (Android 12)
- [ ] Pixel 6 (Android 13)
- [ ] Budget phone (Android 10)
- [ ] Fingerprint login
- [ ] Push notifications
- [ ] Deep links

### Cross-Platform
- [ ] Data sync between devices
- [ ] Logout from all devices
- [ ] App update flow

---

## 7. Performance Testing

### Load Tests
```bash
# Run with locust
cd backend
locust -f scripts/load_test.py --host=https://api.yourdomain.com \
    --headless -u 100 -r 10 -t 5m
```

| Metric | Target | Actual |
|--------|--------|--------|
| P50 Response Time | < 200ms | |
| P95 Response Time | < 1000ms | |
| P99 Response Time | < 2000ms | |
| Error Rate | < 1% | |
| Throughput | > 100 req/s | |

### Stress Tests
- [ ] 500 concurrent users
- [ ] 1000 concurrent users
- [ ] Database connection limits
- [ ] Memory usage under load
- [ ] CPU usage under load

---

## 8. Security Testing

### Authentication
- [ ] SQL injection on login
- [ ] Brute force protection
- [ ] Session hijacking prevention
- [ ] Token expiration

### Authorization
- [ ] Access other user's data
- [ ] Admin endpoint without admin role
- [ ] Merchant endpoint as customer

### Input Validation
- [ ] XSS in all text fields
- [ ] SQL injection in search
- [ ] File upload malicious files
- [ ] Amount manipulation

### API Security
- [ ] Rate limiting works
- [ ] CORS properly configured
- [ ] No sensitive data in errors
- [ ] Webhook signature verification

---

## 9. Integration Testing

### Third-Party Services
- [ ] Paystack webhooks
- [ ] MTN MoMo callbacks
- [ ] SendGrid email delivery
- [ ] SMS delivery (Africa's Talking)
- [ ] Push notifications (Firebase)
- [ ] Exchange rate API

### Database
- [ ] Backup/restore works
- [ ] Migration rollback works
- [ ] Connection pooling
- [ ] Query performance

---

## 10. UAT Sign-Off

### Stakeholder Approval
| Role | Name | Sign-Off | Date |
|------|------|----------|------|
| Product Owner | | ☐ | |
| Tech Lead | | ☐ | |
| QA Lead | | ☐ | |
| Compliance | | ☐ | |
| Security | | ☐ | |

### Go-Live Criteria
- [ ] All critical tests passed
- [ ] No high-severity bugs open
- [ ] Performance targets met
- [ ] Security audit completed
- [ ] Compliance requirements met
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Support team trained

---

## 11. Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor error rates
- [ ] Monitor transaction success rate
- [ ] Monitor response times
- [ ] Check all payment providers
- [ ] Review customer complaints

### First Week
- [ ] Daily transaction reports
- [ ] User feedback review
- [ ] Performance trending
- [ ] Bug triage and fixes

### First Month
- [ ] Weekly business reviews
- [ ] Feature usage analytics
- [ ] Churn analysis
- [ ] Compliance reporting
