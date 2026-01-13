# SikaRemit API Keys Setup Guide

Complete this checklist to get all production API keys configured.

---

## 1. Payment Providers

### Stripe (Primary - International Cards)
**Dashboard**: https://dashboard.stripe.com

1. Create account at https://stripe.com
2. Complete business verification
3. Go to Developers → API Keys
4. Copy **Secret Key** and **Publishable Key**
5. Set webhook: Developers → Webhooks → Add endpoint
6. URL: `https://api.yourdomain.com/api/v1/payments/webhooks/stripe/`

```ini
# Backend .env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Frontend .env.local
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

---

## 2. Mobile Money Providers

### MTN Mobile Money (MoMo)
**Portal**: https://momodeveloper.mtn.com

1. Register at MTN MoMo Developer Portal
2. Create a new application
3. Request production access (requires business verification)
4. Get API User and API Key
5. Set callback URL

```ini
# Backend .env
MTN_MOMO_API_KEY=xxxxx
MTN_MOMO_API_SECRET=xxxxx
MTN_MOMO_API_URL=https://proxy.momoapi.mtn.com
MTN_MOMO_CALLBACK_URL=https://api.yourdomain.com/api/v1/payments/webhooks/mtn/
MTN_MOMO_ENVIRONMENT=production
```

**Required**:
- [ ] Business registration in Ghana
- [ ] MTN merchant agreement
- [ ] Technical integration review

---

### Telecel Cash (formerly Vodafone Cash)
**Contact**: Telecel Ghana Business Team

1. Contact Telecel Ghana for API access
2. Complete merchant onboarding
3. Receive API credentials

```ini
# Backend .env
TELECEL_API_KEY=xxxxx
TELECEL_API_SECRET=xxxxx
TELECEL_API_URL=https://api.telecel.com.gh
TELECEL_MERCHANT_ID=xxxxx
```

---

### AirtelTigo Money
**Contact**: AirtelTigo Ghana Business Team

1. Contact AirtelTigo for merchant API access
2. Complete KYB verification
3. Receive credentials

```ini
# Backend .env
AIRTELTIGO_API_KEY=xxxxx
AIRTELTIGO_API_SECRET=xxxxx
AIRTELTIGO_API_URL=https://api.airteltigo.com.gh
```

---

## 3. Communication Services

### SendGrid (Email)
**Dashboard**: https://app.sendgrid.com

1. Create account at https://sendgrid.com
2. Go to Settings → API Keys → Create API Key
3. Select "Full Access"
4. Verify sender domain (DNS records)

```ini
# Backend .env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxx
DEFAULT_FROM_EMAIL=noreply@sikaremit.com
```

---

### Africa's Talking (SMS - Primary)
**Dashboard**: https://account.africastalking.com

1. Create account at https://africastalking.com
2. Go to Settings → API Key
3. Create sender ID for Ghana

```ini
# Backend .env
SMS_PROVIDER=africastalking
AFRICASTALKING_USERNAME=sikaremit
AFRICASTALKING_API_KEY=xxxxx
AFRICASTALKING_SENDER_ID=SikaRemit
```

---

### Twilio (SMS - Backup)
**Dashboard**: https://console.twilio.com

1. Create account at https://twilio.com
2. Get Account SID and Auth Token
3. Purchase Ghana phone number

```ini
# Backend .env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+233xxxxxxxxx
```

---

## 4. Monitoring & Analytics

### Sentry (Error Tracking)
**Dashboard**: https://sentry.io

1. Create project for Django backend
2. Create project for Next.js frontend
3. Get DSN for each

```ini
# Backend .env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Frontend .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

### Firebase (Push Notifications)
**Console**: https://console.firebase.google.com

1. Create Firebase project
2. Add Android and iOS apps
3. Download service account JSON
4. Get Server Key for FCM

```ini
# Backend .env
FCM_SERVER_KEY=xxxxx
FIREBASE_CREDENTIALS_PATH=/path/to/service-account.json
```

---

## 5. OAuth Providers

### Google OAuth
**Console**: https://console.cloud.google.com

1. Create OAuth 2.0 credentials
2. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
   - `https://api.yourdomain.com/api/v1/accounts/google/callback/`

```ini
# Backend .env
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxx

# Frontend .env.local
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

---

## 6. Exchange Rates

### ExchangeRate-API
**Dashboard**: https://www.exchangerate-api.com

1. Create account
2. Get API key

```ini
# Backend .env
EXCHANGE_RATE_API_KEY=xxxxx
EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6/
```

---

## Verification Checklist

After setting up all keys, verify:

- [ ] Paystack test payment works
- [ ] Stripe test payment works
- [ ] MTN MoMo sandbox works
- [ ] Email sending works
- [ ] SMS sending works
- [ ] Push notifications work
- [ ] Google OAuth login works
- [ ] Exchange rates fetch correctly
- [ ] Sentry captures test error

---

## Security Reminders

⚠️ **NEVER commit API keys to git**
⚠️ **Use environment variables only**
⚠️ **Rotate keys if exposed**
⚠️ **Use separate keys for staging/production**
⚠️ **Enable IP whitelisting where available**
