# Bank of Ghana Regulatory Compliance Guide

SikaRemit operates as a Payment Service Provider (PSP) and must comply with Bank of Ghana (BoG) regulations.

---

## 1. Licensing Requirements

### Payment Service Provider License
**Regulator**: Bank of Ghana - Payment Systems Department
**Website**: https://www.bog.gov.gh

#### License Categories
| Category | Description | Applies to SikaRemit |
|----------|-------------|---------------------|
| **Dedicated E-Money Issuer** | Issue e-money, operate wallets | ✅ Yes |
| **Payment Service Provider** | Process payments, remittances | ✅ Yes |
| **Mobile Money Operator** | Requires telco partnership | ❌ No (uses existing) |

#### Application Requirements
- [ ] Company registration (Registrar General's Department)
- [ ] Minimum capital: GHS 2,000,000 (PSP) / GHS 5,000,000 (E-Money)
- [ ] Business plan (3-year projections)
- [ ] AML/CFT policy document
- [ ] IT security policy
- [ ] Disaster recovery plan
- [ ] Audited financial statements
- [ ] Directors' fit and proper declarations
- [ ] Shareholding structure
- [ ] Organizational chart

---

## 2. Anti-Money Laundering (AML) Compliance

### AML/CFT Requirements
Based on **Anti-Money Laundering Act, 2020 (Act 1044)**

#### Customer Due Diligence (CDD)
| Tier | Transaction Limit | KYC Required |
|------|-------------------|--------------|
| Tier 1 | Up to GHS 1,000/day | Phone + Name |
| Tier 2 | Up to GHS 5,000/day | + Ghana Card/ID |
| Tier 3 | Unlimited | + Address + Source of Funds |

#### SikaRemit Implementation
```
✅ KYC Document Upload - kyc/views.py
✅ Identity Verification - kycService.ts
✅ Tiered Limits - payments/models.py
✅ Transaction Monitoring - compliance/models.py
```

#### Suspicious Activity Reporting
- [ ] Implement SAR (Suspicious Activity Report) generation
- [ ] Report to Financial Intelligence Centre (FIC)
- [ ] Maintain records for 5 years minimum
- [ ] Train staff on red flags

---

## 3. Transaction Limits (BoG Guidelines)

### Mobile Money Limits
| Transaction Type | Daily Limit | Monthly Limit |
|------------------|-------------|---------------|
| Wallet Balance | GHS 20,000 | - |
| Single Transaction | GHS 10,000 | - |
| Daily Transactions | GHS 20,000 | GHS 100,000 |
| International Remittance | $10,000 | $50,000 |

### SikaRemit Configuration
```python
# backend/shared/constants.py
TRANSACTION_LIMITS = {
    'TIER_1': {'daily': 1000, 'monthly': 5000},
    'TIER_2': {'daily': 5000, 'monthly': 25000},
    'TIER_3': {'daily': 20000, 'monthly': 100000},
}
```

---

## 4. Data Protection (Data Protection Act, 2012)

### Requirements
- [ ] Register with Data Protection Commission
- [ ] Appoint Data Protection Officer
- [ ] Obtain consent for data collection
- [ ] Provide data access/deletion rights
- [ ] Implement data breach notification (72 hours)

### SikaRemit Implementation
```
✅ Privacy Policy - Required on app/website
✅ Consent Collection - Registration flow
✅ Data Encryption - TLS + database encryption
⚠️ Data Deletion - Implement user data export/delete
⚠️ DPO Appointment - Designate responsible person
```

---

## 5. Consumer Protection

### BoG Consumer Protection Directive
- [ ] Clear fee disclosure before transactions
- [ ] Transaction receipts/confirmations
- [ ] Dispute resolution mechanism
- [ ] Customer complaint handling (48-hour response)
- [ ] Refund policy

### SikaRemit Implementation
```
✅ Fee Display - Shown before confirmation
✅ Transaction Receipts - receiptService.ts
✅ Support Tickets - accounts/models.py
⚠️ Dispute Resolution - Needs formal process
⚠️ Ombudsman Contact - Display BoG contact
```

---

## 6. Reporting Requirements

### Regular Reports to BoG
| Report | Frequency | Deadline |
|--------|-----------|----------|
| Transaction Volume | Monthly | 15th of next month |
| AML/CFT Report | Quarterly | 30 days after quarter |
| Audited Financials | Annually | 90 days after year-end |
| Incident Reports | As needed | Within 24 hours |

### Automated Reporting
```python
# Implement in backend/compliance/reports.py
class BOGReportGenerator:
    def generate_monthly_report(self, month, year):
        # Transaction volumes
        # Active users
        # Fraud incidents
        # Complaint statistics
        pass
```

---

## 7. Technical Requirements

### BoG IT Security Guidelines
| Requirement | Status | Notes |
|-------------|--------|-------|
| SSL/TLS Encryption | ✅ | TLS 1.2+ |
| Data at Rest Encryption | ⚠️ | Database encryption needed |
| Access Controls | ✅ | Role-based permissions |
| Audit Trails | ✅ | Transaction logging |
| Penetration Testing | ⚠️ | Annual requirement |
| Business Continuity | ⚠️ | DR plan needed |
| Incident Response | ⚠️ | Formal plan needed |

### Required Documentation
- [ ] IT Security Policy
- [ ] Business Continuity Plan
- [ ] Disaster Recovery Plan
- [ ] Incident Response Plan
- [ ] Change Management Policy

---

## 8. Cross-Border Remittance

### Foreign Exchange Act Requirements
- [ ] Authorized Dealer license (or partner with bank)
- [ ] Report to BoG for amounts > $10,000
- [ ] Maintain forex records
- [ ] Comply with exchange rate guidelines

### Corridor Compliance
| Corridor | Requirement |
|----------|-------------|
| Ghana → Nigeria | ECOWAS agreement applies |
| Ghana → USA/UK | Full AML/CFT compliance |
| Ghana → EU | GDPR considerations |

---

## 9. Application Timeline

### Typical Process
| Step | Duration | Notes |
|------|----------|-------|
| Document Preparation | 2-4 weeks | Gather all requirements |
| Application Submission | 1 day | Submit to BoG |
| Initial Review | 2-4 weeks | BoG reviews completeness |
| Due Diligence | 4-8 weeks | Background checks |
| Technical Assessment | 2-4 weeks | IT security review |
| Approval/Conditions | 2-4 weeks | License issued |
| **Total** | **3-6 months** | |

---

## 10. Compliance Checklist

### Pre-Launch (Must Have)
- [ ] Company registered in Ghana
- [ ] Minimum capital deposited
- [ ] AML/CFT policy approved
- [ ] KYC system operational
- [ ] Transaction limits enforced
- [ ] Privacy policy published
- [ ] Terms of service published

### Post-Launch (Within 90 Days)
- [ ] PSP license application submitted
- [ ] Data Protection registration
- [ ] Staff AML training completed
- [ ] Penetration test conducted
- [ ] Business continuity plan tested

### Ongoing
- [ ] Monthly BoG reports
- [ ] Quarterly AML reviews
- [ ] Annual security audit
- [ ] Annual license renewal

---

## 11. Key Contacts

### Bank of Ghana
- **Payment Systems Department**
- Address: 1 Thorpe Road, Accra
- Phone: +233 302 666 174
- Email: secretary@bog.gov.gh

### Financial Intelligence Centre
- Phone: +233 302 662 028
- Email: info@fic.gov.gh

### Data Protection Commission
- Phone: +233 302 773 061
- Email: info@dataprotection.org.gh

---

## 12. Penalties for Non-Compliance

| Violation | Penalty |
|-----------|---------|
| Operating without license | Up to GHS 500,000 + imprisonment |
| AML/CFT violations | Up to GHS 1,000,000 |
| Data breach (unreported) | Up to GHS 60,000 |
| Consumer protection breach | License suspension |

---

## Recommended Legal Counsel

Engage a law firm specializing in fintech/banking:
- **Bentsi-Enchill, Letsa & Ankomah**
- **Kimathi & Partners**
- **ENSafrica Ghana**
- **AB & David**

Budget: GHS 50,000 - 150,000 for full licensing support
