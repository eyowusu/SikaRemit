import { test, expect, Page } from '@playwright/test';
import { login } from '@/tests/helpers/auth';

test.describe('Role Specific Flows', () => {
  test('Admin Dashboard Access', async ({ page }: { page: Page }) => {
    await login(page, 'admin@payglobe.com', 'admin123');
    await page.waitForURL('/admin/dashboard');
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    
    // Verify admin features
    await expect(page.getByRole('link', { name: 'User Management' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'System Settings' })).toBeVisible();
  });

  test('Merchant Dashboard Access', async ({ page }: { page: Page }) => {
    await login(page, 'merchant@business.com', 'merchant123');
    await page.waitForURL('/merchant/dashboard');
    await expect(page.getByText('Business Analytics')).toBeVisible();
    
    // Verify merchant features
    await expect(page.getByRole('link', { name: 'Payouts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
  });

  test('Customer Dashboard Access', async ({ page }: { page: Page }) => {
    await login(page, 'customer@user.com', 'customer123');
    await page.waitForURL('/account');
    await expect(page.getByText('My Account')).toBeVisible();
    
    // Verify customer features
    await expect(page.getByRole('link', { name: 'Payment Methods' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Transaction History' })).toBeVisible();
  });

  test('Role Access Control', async ({ page }: { page: Page }) => {
    // Merchant cannot access admin dashboard
    await login(page, 'merchant@business.com', 'merchant123');
    await page.goto('/admin/dashboard');
    await page.waitForURL('/merchant/dashboard');
    await expect(page.getByText('Access Denied')).toBeVisible();
  });
});
