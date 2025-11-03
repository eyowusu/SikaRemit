/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    loginAsAdmin(): Chainable<void>
    loginAsMerchant(): Chainable<void>
    loginAsCustomer(): Chainable<void>
  }
}

Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/accounts/login/',
      body: {
        email: 'admin@payglobe.com',
        password: Cypress.env('ADMIN_PASSWORD') || 'admin123'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((response: Cypress.Response<any>) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('access')
      expect(response.body).to.have.property('user')

      // Store tokens in localStorage for frontend use
      window.localStorage.setItem('next-auth.session-token', response.body.access)
      window.localStorage.setItem('next-auth.refresh-token', response.body.refresh)

      // Also set a simple auth flag
      window.localStorage.setItem('authToken', response.body.access)
    })
  })
})

Cypress.Commands.add('loginAsMerchant', () => {
  cy.session('merchant', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/accounts/login/',
      body: {
        email: 'merchant@example.com',
        password: 'merchant123'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((response: Cypress.Response<any>) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('access')
      expect(response.body).to.have.property('user')

      // Store tokens in localStorage for NextAuth compatibility
      window.localStorage.setItem('next-auth.session-token', response.body.access)
      window.localStorage.setItem('next-auth.refresh-token', response.body.refresh)
      window.localStorage.setItem('authToken', response.body.access)
    })
  })
})

Cypress.Commands.add('loginAsCustomer', () => {
  cy.session('customer', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/accounts/login/',
      body: {
        email: 'customer@example.com',
        password: 'customer123'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((response: Cypress.Response<any>) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('access')
      expect(response.body).to.have.property('user')

      // Store tokens in localStorage for NextAuth compatibility
      window.localStorage.setItem('next-auth.session-token', response.body.access)
      window.localStorage.setItem('next-auth.refresh-token', response.body.refresh)
      window.localStorage.setItem('authToken', response.body.access)
    })
  })
})
