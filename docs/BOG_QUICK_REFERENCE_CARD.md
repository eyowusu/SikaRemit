# SikaRemit - BOG Presentation Quick Reference Card
## Pocket Guide for Board Questions

---

## 🔴 CRITICAL QUESTIONS & ANSWERS

### Q1: "What happens if your cloud fails?"

**SHORT ANSWER:**
> "We have a 3-2-1 backup strategy: 3 copies of data, in 2 different locations, with 1 local server in Ghana. We can restore operations within 4 hours."

**TECHNICAL DETAILS (if asked):**
- Daily automated backups at 2 AM
- Primary: AWS Cloud
- Secondary: Different AWS Region
- Tertiary: Local Ghana Data Center
- Recovery Time: 4 hours maximum
- Data Loss: Maximum 24 hours of transactions

---

### Q2: "How do you protect customer data?"

**SHORT ANSWER:**
> "Bank-grade security: All data encrypted with AES-256, passwords hashed with 600,000 iterations, two-factor authentication, and biometric verification. We can't even read customer passwords."

**KEY POINTS:**
- ✅ TLS 1.3 encryption in transit
- ✅ AES-256 encryption at rest
- ✅ MFA (Multi-Factor Authentication)
- ✅ Biometric face verification
- ✅ Automatic session expiry
- ✅ Failed login protection (account lockout)

---

### Q3: "What if a transaction fails?"

**SHORT ANSWER:**
> "Our system automatically retries 3 times, then reverses the transaction within 24 hours. Customer is notified immediately, and they can raise a dispute which we resolve within 72 hours."

**PROCESS:**
1. Transaction fails → Auto-retry (3x)
2. Still fails → Auto-reversal (24 hours)
3. Customer notified via SMS + Email
4. Dispute option available
5. Resolution: 24-72 hours

---

### Q4: "Are you BOG compliant?"

**SHORT ANSWER:**
> "Yes, fully. We comply with the Payment Systems Act 2019, Anti-Money Laundering Act 2020, and Data Protection Act 2012. We submit monthly reports to BOG and file SARs to FIC."

**COMPLIANCE CHECKLIST:**
| Regulation | Status |
|------------|--------|
| Payment Systems Act 2019 | ✅ |
| AML Act 2020 | ✅ |
| Data Protection Act 2012 | ✅ |
| KYC Requirements | ✅ |
| SAR Filing to FIC | ✅ |
| Monthly BOG Reports | ✅ |

---

### Q5: "How do you prevent money laundering?"

**SHORT ANSWER:**
> "Every customer must verify their Ghana Card before transacting. We screen against OFAC and EU sanctions lists, monitor for suspicious patterns, and automatically flag transactions over GHS 50,000. Any suspicious activity is reported to FIC within 24 hours."

**AML CONTROLS:**
- ✅ KYC verification (Ghana Card)
- ✅ PEP/Sanctions screening
- ✅ Transaction monitoring
- ✅ GHS 50,000+ auto-flagging
- ✅ SAR filing to FIC
- ✅ Daily transaction limits

---

### Q6: "Do you need a local server?"

**SHORT ANSWER:**
> "Yes, and we have one planned. BOG requires that Ghanaian financial data be accessible from within Ghana. We're setting up a server at [MainOne/Busy Internet] data center in Accra."

**LOCAL SERVER PLAN:**
- Location: Accra Data Center
- Replication: Real-time sync with cloud
- Purpose: Disaster recovery + Data sovereignty
- Cost: ~GHS 5,500/month operational

---

## 📊 KEY STATISTICS TO MENTION

| Metric | Value |
|--------|-------|
| **Backup Frequency** | Every 24 hours |
| **Recovery Time** | < 4 hours |
| **Data Retention** | 5+ years |
| **Uptime Target** | 99.9% |
| **Dispute Resolution** | 72 hours max |
| **KYC Verification** | Ghana Card + Face Match |

---

## 🎯 THREE KEY MESSAGES

### 1. SECURITY
> "Your customers' money is protected by the same technology used by international banks."

### 2. COMPLIANCE
> "We don't just follow BOG rules - we built them into our system's DNA."

### 3. RELIABILITY
> "Even if our entire cloud fails, we can restore service within 4 hours from our Ghana-based backup."

---

## ⚠️ WHAT NOT TO SAY

| Don't Say | Say Instead |
|-----------|-------------|
| "We use SQLite" | "We use PostgreSQL (enterprise-grade database)" |
| "We're still developing" | "Our system is production-ready with continuous improvements" |
| "We can't guarantee" | "We have 99.9% uptime SLA with automatic failover" |
| "I don't know" | "I'll get back to you with specific details within 24 hours" |

---

## 📞 EMERGENCY CONTACTS

| Role | Contact |
|------|---------|
| Technical Support | CTO: [Phone] |
| Compliance Questions | Compliance Officer: [Phone] |
| Regulatory Affairs | CEO: [Phone] |

---

## 💡 CLOSING STATEMENT

> "SikaRemit is built by Ghanaians, for Ghanaians, with Ghanaian regulations at its core. We're not just another fintech - we're a partner in Ghana's digital financial inclusion journey. With BOG's approval, we're ready to serve millions of Ghanaians who deserve safe, fast, and affordable financial services."

---

*Keep this card handy during your presentation. Confidence comes from preparation!*
