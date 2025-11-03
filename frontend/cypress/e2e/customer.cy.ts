/// <reference types="cypress" />

describe('Customer Authentication', () => {
  it('customer can login successfully', () => {
    cy.loginAsCustomer()
    cy.visit('/account')
    cy.url().should('include', '/account')
    cy.get('body').should('exist')
  })

  it('customer login sets authentication tokens', () => {
    cy.loginAsCustomer()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('next-auth.session-token')).to.exist
      expect(win.localStorage.getItem('authToken')).to.exist
    })
  })
})
