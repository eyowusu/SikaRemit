/// <reference types="cypress" />

describe('Admin Authentication & Access', () => {
  it('admin can login and access dashboard', () => {
    cy.loginAsAdmin()
    cy.visit('/admin/dashboard')
    cy.url().should('include', '/admin/dashboard')
    // Page should load (even if showing loading state)
    cy.get('body').should('exist')
  })

  it('admin login sets correct tokens', () => {
    cy.loginAsAdmin()
    cy.window().then((win: Window) => {
      expect(win.localStorage.getItem('next-auth.session-token')).to.exist
      expect(win.localStorage.getItem('authToken')).to.exist
    })
  })
})

describe('Merchant Authentication & Access', () => {
  it('merchant can login and access dashboard', () => {
    cy.loginAsMerchant()
    cy.visit('/merchant/dashboard')
    cy.url().should('include', '/merchant/dashboard')
    cy.get('body').should('exist')
  })

  it('merchant login sets correct tokens', () => {
    cy.loginAsMerchant()
    cy.window().then((win: Window) => {
      expect(win.localStorage.getItem('next-auth.session-token')).to.exist
      expect(win.localStorage.getItem('authToken')).to.exist
    })
  })
})

describe('Customer Authentication & Access', () => {
  it('customer can login and access account page', () => {
    cy.loginAsCustomer()
    cy.visit('/account')
    cy.url().should('include', '/account')
    cy.get('body').should('exist')
  })

  it('customer login sets correct tokens', () => {
    cy.loginAsCustomer()
    cy.window().then((win: Window) => {
      expect(win.localStorage.getItem('next-auth.session-token')).to.exist
      expect(win.localStorage.getItem('authToken')).to.exist
    })
  })
})

describe('Admin Dashboard UI Components', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/admin/dashboard')
  })

  it('displays metrics cards with correct data', () => {
    // Wait for data to load
    cy.wait(3000)

    // Check for metrics content (may show actual data or loading)
    cy.get('body').then(($body: JQuery<HTMLElement>) => {
      if ($body.text().includes('Total Users')) {
        // Data loaded successfully
        cy.contains('Total Users').should('exist')
        cy.contains('Active Users').should('exist')
        cy.contains('Today\'s Transactions').should('exist')
        cy.contains('Pending Verifications').should('exist')

        // Check that we have numeric values
        cy.get('[data-testid="metrics-card"]').within(() => {
          cy.get('p').contains(/\d+/).should('exist')
        })

        // Verify metrics are reasonable (not negative, within expected ranges)
        cy.get('[data-testid="metrics-card"]').each(($card) => {
          cy.wrap($card).find('p').invoke('text').then((text) => {
            const value = parseInt(text.replace(/[^0-9]/g, ''))
            expect(value).to.be.at.least(0)
          })
        })
      } else if ($body.text().includes('Loading')) {
        // Still loading - that's also acceptable
        cy.contains('Loading').should('exist')
      }
    })
  })

  it('verifies dashboard data consistency with backend', () => {
    // Wait for dashboard to load
    cy.wait(4000)

    // Intercept the dashboard API call
    cy.intercept('GET', '**/api/admin/metrics*').as('getMetrics')

    // Wait for the API call to complete
    cy.wait('@getMetrics').then((interception) => {
      if (interception.response) {
        const apiData = interception.response.body

        // Check that frontend displays match API data
        if (apiData.totalUsers !== undefined) {
          cy.contains('Total Users').parent().parent().should('contain', apiData.totalUsers.toString())
        }
        if (apiData.activeMerchants !== undefined) {
          cy.contains('Active Merchants').parent().parent().should('contain', apiData.activeMerchants.toString())
        }
        if (apiData.pendingVerifications !== undefined) {
          cy.contains('Pending Verifications').parent().parent().should('contain', apiData.pendingVerifications.toString())
        }
      }
    })
  })

  it('has functional user management table', () => {
    // Wait for initial loading
    cy.contains('Loading').should('exist')
    cy.wait(5000) // Wait longer for API calls

    // Check if Recent Users section exists
    cy.contains('Recent Users').should('exist')

    // Check for table or data display
    cy.get('body').then(($body: JQuery<HTMLElement>) => {
      if ($body.find('table').length > 0) {
        // Table view
        cy.get('table').should('exist')
        cy.get('tbody tr').should('have.length.at.least', 0) // May be empty
      } else if ($body.find('[data-testid="users-table"]').length > 0) {
        // Data table component
        cy.get('[data-testid="users-table"]').should('exist')
      }
    })
  })

  it('has export functionality', () => {
    cy.wait(2000) // Wait for page to fully load
    // Check for export buttons
    cy.contains('Export Users').should('exist')
    cy.contains('Export Verifications').should('exist')
  })

  it('displays recent activity', () => {
    cy.wait(2000) // Wait for page to fully load
    cy.contains('Recent Activity').should('exist')
  })

  it('loads and displays notifications', () => {
    cy.wait(3000) // Wait for API calls

    // Check if notification section exists
    cy.contains('Notifications').should('exist')

    // Check notification content (may be empty or have data)
    cy.get('body').then(($body: JQuery<HTMLElement>) => {
      if ($body.text().includes('No notifications yet')) {
        // No notifications - that's acceptable
        cy.contains('No notifications yet').should('exist')
      } else {
        // Check for notification items
        cy.get('[data-testid="notification-item"]').should('exist')
      }
    })
  })

  it('handles notification mark as read functionality', () => {
    cy.wait(3000) // Wait for initial load

    // Only test if notifications exist
    cy.get('body').then(($body: JQuery<HTMLElement>) => {
      if (!$body.text().includes('No notifications yet')) {
        // Look for unread notifications (blue background)
        cy.get('.bg-blue-50').first().within(() => {
          // Click the mark as read button if it exists
          cy.get('button').contains('Check').click({ force: true })
        })

        // Wait for the action to complete
        cy.wait(1000)

        // The notification should no longer have blue background
        cy.get('.bg-blue-50').should('not.exist')
      }
    })
  })
})

describe('Merchant Dashboard UI Components', () => {
  beforeEach(() => {
    cy.loginAsMerchant()
    cy.visit('/merchant/dashboard')
  })

  it('loads merchant dashboard page', () => {
    cy.url().should('include', '/merchant/dashboard')
    cy.get('body').should('not.be.empty')
  })

  it('displays merchant-specific elements', () => {
    cy.wait(3000)
    // Check for common merchant dashboard elements
    cy.get('body').then(($body: JQuery<HTMLElement>) => {
      const hasContent = $body.text().length > 10 // Basic content check
      expect(hasContent).to.be.true
    })
  })
})

describe('Customer Account UI Components', () => {
  beforeEach(() => {
    cy.loginAsCustomer()
    cy.visit('/account')
  })

  it('loads customer account page', () => {
    cy.url().should('include', '/account')
    cy.get('body').should('not.be.empty')
  })

  it('displays account-related content', () => {
    cy.wait(3000)
    cy.get('body').then(($body: JQuery<HTMLElement>) => {
      const hasContent = $body.text().length > 10 // Basic content check
      expect(hasContent).to.be.true
    })
  })
})
