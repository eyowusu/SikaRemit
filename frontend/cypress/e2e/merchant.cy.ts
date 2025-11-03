/// <reference types="cypress" />

describe('Merchant Authentication', () => {
  it('merchant can login successfully', () => {
    cy.loginAsMerchant()
    cy.visit('/merchant/dashboard')
    cy.url().should('include', '/merchant/dashboard')
    cy.get('body').should('exist')
  })

  it('merchant login sets authentication tokens', () => {
    cy.loginAsMerchant()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('next-auth.session-token')).to.exist
      expect(win.localStorage.getItem('authToken')).to.exist
    })
  })
})
