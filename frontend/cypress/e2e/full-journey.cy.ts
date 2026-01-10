/**
 * SikaRemit Comprehensive E2E Test Suite
 * Full user journey automation covering all major flows
 */

describe('SikaRemit Full User Journey E2E Tests', () => {
    const testUser = {
        email: `test-${Date.now()}@sikaremit.com`,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+256700000000'
    };

    const testMerchant = {
        email: `merchant-${Date.now()}@sikaremit.com`,
        password: 'MerchantPass123!',
        businessName: 'Test Merchant Co',
        phoneNumber: '+256711111111'
    };

    before(() => {
        // Clean up any existing test data
        cy.request('POST', '/api/testing/cleanup', { pattern: testUser.email }).then(() => {
            cy.request('POST', '/api/testing/cleanup', { pattern: testMerchant.email });
        });
    });

    describe('Customer Registration and Onboarding', () => {
        it('should complete full customer registration flow', () => {
            // Visi/**
 * SikaRemit Comprehensive E2E Test Suite
 * Full user journey automation covering all major flows
 */

describe('SikaRemit Full User Journey E2E Tests', () => {
    const testUser = {
        email: `test-${Date.now()}@SikaRemit.com`,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+256700000000'
    };

    const testMerchant = {
        email: `merchant-${Date.now()}@SikaRemit.com`,
        password: 'MerchantPass123!',
        businessName: 'Test Merchant Co',
        phoneNumber: '+256711111111'
    };

    before(() => {
        // Clean up any existing test data
        cy.request('POST', '/api/testing/cleanup', { pattern: testUser.email }).then(() => {
            cy.request('POST', '/api/testing/cleanup', { pattern: testMerchant.email });
        });
    });

    describe('Customer Registration and Onboarding', () => {
        it('should complete full customer registration flow', () => {
            // Visit registration page
            cy.visit('/auth/register');

            // Fill registration form
            cy.get('[data-testid="register-form"]').within(() => {
                cy.get('[data-testid="email-input"]').type(testUser.email);
                cy.get('[data-testid="password-input"]').type(testUser.password);
                cy.get('[data-testid="confirm-password-input"]').type(testUser.password);
                cy.get('[data-testid="first-name-input"]').type(testUser.firstName);
                cy.get('[data-testid="last-name-input"]').type(testUser.lastName);
                cy.get('[data-testid="phone-input"]').type(testUser.phoneNumber);
                cy.get('[data-testid="user-type-customer"]').check();
                cy.get('[data-testid="terms-checkbox"]').check();
            });

            // Submit registration
            cy.get('[data-testid="register-submit"]').click();

            // Verify email verification step
            cy.get('[data-testid="email-verification"]').should('be.visible');

            // Simulate email verification (in real test, would check email)
            cy.request('POST', '/api/testing/verify-email', { email: testUser.email });

            // Complete profile setup
            cy.get('[data-testid="complete-profile"]').within(() => {
                cy.get('[data-testid="phone-verification-input"]').type('123456');
                cy.get('[data-testid="verify-phone-button"]').click();
            });

            // Should redirect to dashboard
            cy.url().should('include', '/account');
            cy.get('[data-testid="welcome-message"]').should('contain', testUser.firstName);
        });

        it('should complete KYC verification process', () => {
            // Login as test user
            cy.login(testUser.email, testUser.password);

            // Navigate to KYC section
            cy.get('[data-testid="kyc-section"]').click();

            // Upload documents
            cy.get('[data-testid="id-upload"]').selectFile('cypress/fixtures/test-id.jpg');
            cy.get('[data-testid="proof-address-upload"]').selectFile('cypress/fixtures/test-address.pdf');
            cy.get('[data-testid="submit-kyc"]').click();

            // Verify KYC status
            cy.get('[data-testid="kyc-status"]').should('contain', 'Under Review');

            // Admin approves KYC (simulate)
            cy.request('POST', '/api/admin/kyc/approve', { userId: testUser.email });

            // Refresh and verify approval
            cy.reload();
            cy.get('[data-testid="kyc-status"]').should('contain', 'Approved');
        });
    });

    describe('Merchant Registration and Setup', () => {
        it('should complete full merchant registration flow', () => {
            // Visit merchant registration
            cy.visit('/auth/register-merchant');

            // Fill merchant registration form
            cy.get('[data-testid="merchant-register-form"]').within(() => {
                cy.get('[data-testid="business-name-input"]').type(testMerchant.businessName);
                cy.get('[data-testid="email-input"]').type(testMerchant.email);
                cy.get('[data-testid="password-input"]').type(testMerchant.password);
                cy.get('[data-testid="phone-input"]').type(testMerchant.phoneNumber);
                cy.get('[data-testid="business-category-select"]').select('retail');
                cy.get('[data-testid="terms-checkbox"]').check();
            });

            // Submit registration
            cy.get('[data-testid="register-submit"]').click();

            // Complete business verification
            cy.get('[data-testid="business-verification"]').within(() => {
                cy.get('[data-testid="business-license-upload"]').selectFile('cypress/fixtures/test-license.pdf');
                cy.get('[data-testid="tax-cert-upload"]').selectFile('cypress/fixtures/test-tax.pdf');
                cy.get('[data-testid="submit-verification"]').click();
            });

            // Should redirect to merchant dashboard
            cy.url().should('include', '/merchant/dashboard');
            cy.get('[data-testid="merchant-welcome"]').should('contain', testMerchant.businessName);
        });
    });

    describe('Payment Processing Flows', () => {
        before(() => {
            // Setup test accounts with sufficient balance
            cy.request('POST', '/api/testing/setup-payment-accounts', {
                customer: testUser.email,
                merchant: testMerchant.email
            });
        });

        it('should complete card payment flow', () => {
            // Customer login
            cy.login(testUser.email, testUser.password);

            // Navigate to payment page
            cy.visit('/pay');
            cy.get('[data-testid="merchant-search"]').type(testMerchant.businessName);
            cy.get('[data-testid="select-merchant"]').first().click();

            // Enter payment details
            cy.get('[data-testid="payment-form"]').within(() => {
                cy.get('[data-testid="amount-input"]').type('50.00');
                cy.get('[data-testid="description-input"]').type('Test payment');
                cy.get('[data-testid="card-payment-method"]').check();
            });

            // Enter card details
            cy.get('[data-testid="card-form"]').within(() => {
                cy.get('[data-testid="card-number"]').type('4242424242424242');
                cy.get('[data-testid="expiry-date"]').type('1230');
                cy.get('[data-testid="cvv"]').type('123');
                cy.get('[data-testid="cardholder-name"]').type('Test User');
            });

            // Submit payment
            cy.get('[data-testid="submit-payment"]').click();

            // Verify payment success
            cy.get('[data-testid="payment-success"]').should('be.visible');
            cy.get('[data-testid="transaction-id"]').should('exist');

            // Check transaction history
            cy.get('[data-testid="view-transactions"]').click();
            cy.get('[data-testid="transaction-list"]').should('contain', '50.00');
        });

        it('should complete mobile money payment flow', () => {
            // Customer login
            cy.login(testUser.email, testUser.password);

            // Navigate to mobile money payment
            cy.visit('/pay');
            cy.get('[data-testid="merchant-search"]').type(testMerchant.businessName);
            cy.get('[data-testid="select-merchant"]').first().click();

            // Select mobile money
            cy.get('[data-testid="payment-form"]').within(() => {
                cy.get('[data-testid="amount-input"]').type('25.00');
                cy.get('[data-testid="mobile-money-method"]').check();
                cy.get('[data-testid="provider-select"]').select('mtn');
            });

            // Enter mobile details
            cy.get('[data-testid="mobile-form"]').within(() => {
                cy.get('[data-testid="mobile-number"]').type('+256700000000');
            });

            // Submit payment
            cy.get('[data-testid="submit-payment"]').click();

            // Verify mobile money prompt
            cy.get('[data-testid="mobile-money-prompt"]').should('be.visible');
            cy.get('[data-testid="confirm-payment-button"]').click();

            // Simulate mobile money callback
            cy.request('POST', '/api/testing/simulate-mobile-callback', {
                transactionId: 'MM' + Date.now(),
                status: 'success'
            });

            // Verify payment completion
            cy.get('[data-testid="payment-success"]').should('be.visible');
        });

        it('should handle payment failures gracefully', () => {
            // Customer login
            cy.login(testUser.email, testUser.password);

            // Attempt payment with insufficient funds
            cy.visit('/pay');
            cy.get('[data-testid="merchant-search"]').type(testMerchant.businessName);
            cy.get('[data-testid="select-merchant"]').first().click();

            cy.get('[data-testid="payment-form"]').within(() => {
                cy.get('[data-testid="amount-input"]').type('999999.00'); // Large amount
                cy.get('[data-testid="card-payment-method"]').check();
            });

            // Enter card details
            cy.get('[data-testid="card-form"]').within(() => {
                cy.get('[data-testid="card-number"]').type('4000000000000002'); // Declined card
                cy.get('[data-testid="expiry-date"]').type('1230');
                cy.get('[data-testid="cvv"]').type('123');
                cy.get('[data-testid="cardholder-name"]').type('Test User');
            });

            // Submit payment
            cy.get('[data-testid="submit-payment"]').click();

            // Verify error handling
            cy.get('[data-testid="payment-error"]').should('be.visible');
            cy.get('[data-testid="error-message"]').should('contain', 'declined');
        });
    });

    describe('Admin Dashboard and Management', () => {
        before(() => {
            // Login as admin
            cy.login('admin@SikaRemit.com', 'admin123');
        });

        it('should monitor system metrics', () => {
            cy.visit('/admin/dashboard');

            // Verify metrics display
            cy.get('[data-testid="total-users-metric"]').should('be.visible');
            cy.get('[data-testid="total-transactions-metric"]').should('be.visible');
            cy.get('[data-testid="total-volume-metric"]').should('be.visible');
            cy.get('[data-testid="active-users-metric"]').should('be.visible');

            // Test metrics refresh
            cy.get('[data-testid="refresh-metrics"]').click();
            cy.get('[data-testid="metrics-loading"]').should('be.visible');
            cy.get('[data-testid="metrics-loading"]', { timeout: 10000 }).should('not.exist');
        });

        it('should manage user accounts', () => {
            cy.visit('/admin/users');

            // Search for test user
            cy.get('[data-testid="user-search"]').type(testUser.email);
            cy.get('[data-testid="search-button"]').click();

            // Verify user appears in results
            cy.get('[data-testid="user-list"]').should('contain', testUser.email);

            // View user details
            cy.get('[data-testid="view-user-details"]').first().click();
            cy.get('[data-testid="user-profile"]').should('contain', testUser.firstName);

            // Test user status changes
            cy.get('[data-testid="user-status-select"]').select('suspended');
            cy.get('[data-testid="save-status"]').click();
            cy.get('[data-testid="status-updated-message"]').should('be.visible');
        });

        it('should review transactions', () => {
            cy.visit('/admin/transactions');

            // Verify transaction list
            cy.get('[data-testid="transaction-table"]').should('be.visible');
            cy.get('[data-testid="transaction-row"]').should('have.length.greaterThan', 0);

            // Test transaction filtering
            cy.get('[data-testid="status-filter"]').select('completed');
            cy.get('[data-testid="apply-filter"]').click();

            // Verify filtered results
            cy.get('[data-testid="transaction-row"]').each(($row) => {
                cy.wrap($row).should('contain', 'completed');
            });
        });

        it('should handle compliance and verification', () => {
            cy.visit('/admin/compliance');

            // Check KYC queue
            cy.get('[data-testid="kyc-queue"]').should('be.visible');

            // Review pending KYC
            cy.get('[data-testid="pending-kyc-count"]').then(($count) => {
                if (parseInt($count.text()) > 0) {
                    cy.get('[data-testid="review-kyc-button"]').first().click();
                    cy.get('[data-testid="kyc-documents"]').should('be.visible');
                    cy.get('[data-testid="approve-kyc"]').click();
                    cy.get('[data-testid="kyc-approved-message"]').should('be.visible');
                }
            });
        });
    });

    describe('Merchant Dashboard and Operations', () => {
        before(() => {
            // Login as merchant
            cy.login(testMerchant.email, testMerchant.password);
        });

        it('should display merchant dashboard metrics', () => {
            cy.visit('/merchant/dashboard');

            // Verify dashboard metrics
            cy.get('[data-testid="total-sales-metric"]').should('be.visible');
            cy.get('[data-testid="monthly-revenue-metric"]').should('be.visible');
            cy.get('[data-testid="pending-payouts-metric"]').should('be.visible');
            cy.get('[data-testid="available-balance-metric"]').should('be.visible');

            // Test period selection
            cy.get('[data-testid="period-select"]').select('30d');
            cy.get('[data-testid="update-metrics"]').click();
        });

        it('should manage payouts', () => {
            cy.visit('/merchant/payouts');

            // Check available balance
            cy.get('[data-testid="available-balance"]').should('be.visible');

            // Request payout
            cy.get('[data-testid="request-payout"]').click();
            cy.get('[data-testid="payout-form"]').within(() => {
                cy.get('[data-testid="payout-amount"]').type('100.00');
                cy.get('[data-testid="bank-account-select"]').select('default');
                cy.get('[data-testid="submit-payout"]').click();
            });

            // Verify payout request
            cy.get('[data-testid="payout-requested-message"]').should('be.visible');
            cy.get('[data-testid="payout-history"]').should('contain', '100.00');
        });

        it('should manage payment links and invoices', () => {
            cy.visit('/merchant/payment-links');

            // Create payment link
            cy.get('[data-testid="create-payment-link"]').click();
            cy.get('[data-testid="link-form"]').within(() => {
                cy.get('[data-testid="link-amount"]').type('75.00');
                cy.get('[data-testid="link-description"]').type('Invoice payment');
                cy.get('[data-testid="link-expiry"]').type('2024-12-31');
                cy.get('[data-testid="create-link"]').click();
            });

            // Verify link creation
            cy.get('[data-testid="link-created-message"]').should('be.visible');
            cy.get('[data-testid="payment-link-url"]').should('exist');

            // Copy link and test in new tab
            cy.get('[data-testid="copy-link"]').click();
            cy.window().then((win) => {
                win.open('', '_blank');
                cy.visit('/pay'); // Would use copied link in real test
            });
        });
    });

    describe('Cross-Platform Integration and Notifications', () => {
        it('should handle real-time notifications', () => {
            // Customer login
            cy.login(testUser.email, testUser.password);

            // Verify notification system
            cy.get('[data-testid="notification-bell"]').should('be.visible');

            // Simulate incoming notification
            cy.request('POST', '/api/testing/send-notification', {
                userId: testUser.email,
                type: 'payment_received',
                message: 'Payment of $50.00 received'
            });

            // Verify notification appears
            cy.get('[data-testid="notification-bell"]').should('have.class', 'has-notifications');
            cy.get('[data-testid="notification-bell"]').click();
            cy.get('[data-testid="notification-list"]').should('contain', 'Payment of $50.00 received');

            // Mark as read
            cy.get('[data-testid="mark-read"]').first().click();
            cy.get('[data-testid="notification-bell"]').should('not.have.class', 'has-notifications');
        });

        it('should support multi-device synchronization', () => {
            // Simulate multiple tabs/devices
            cy.login(testUser.email, testUser.password);

            // Open transaction in one "device"
            cy.visit('/account/transactions');
            cy.get('[data-testid="transaction-count"]').invoke('text').as('transactionCount');

            // Simulate payment in another "device"
            cy.request('POST', '/api/testing/simulate-payment', {
                customer: testUser.email,
                amount: 15.00
            });

            // Verify transaction appears in current device
            cy.reload();
            cy.get('[data-testid="transaction-count"]').should('not.eq', this.transactionCount);
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should handle network failures gracefully', () => {
            cy.login(testUser.email, testUser.password);

            // Intercept API calls to simulate network failure
            cy.intercept('GET', '/api/account/balance', { forceNetworkError: true });

            cy.visit('/account');

            // Verify error state
            cy.get('[data-testid="balance-error"]').should('be.visible');
            cy.get('[data-testid="retry-button"]').should('be.visible');

            // Test retry functionality
            cy.intercept('GET', '/api/account/balance', { balance: 1000.00 });
            cy.get('[data-testid="retry-button"]').click();
            cy.get('[data-testid="account-balance"]').should('contain', '1000.00');
        });

        it('should handle session expiration', () => {
            cy.login(testUser.email, testUser.password);

            // Simulate session expiration
            cy.window().then((win) => {
                win.localStorage.removeItem('auth-token');
            });

            // Attempt protected action
            cy.get('[data-testid="make-payment"]').click();

            // Should redirect to login
            cy.url().should('include', '/auth/login');
            cy.get('[data-testid="login-form"]').should('be.visible');

            // Login again
            cy.get('[data-testid="email-input"]').type(testUser.email);
            cy.get('[data-testid="password-input"]').type(testUser.password);
            cy.get('[data-testid="login-submit"]').click();

            // Should redirect back
            cy.url().should('include', '/account');
        });
    });

    after(() => {
        // Clean up test data
        cy.request('POST', '/api/testing/cleanup', {
            pattern: [testUser.email, testMerchant.email]
        });
    });
});
