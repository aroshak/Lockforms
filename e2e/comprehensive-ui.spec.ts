import { test, expect } from '@playwright/test';

test.describe('LockForms UI Comprehensive Test', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

        // Admin Login for protected routes
        // We can simulate login by hitting the login endpoint or UI
        // UI is safer for E2E
        await page.goto('/admin/login');
        await page.getByPlaceholder('Password').fill('admin123'); // Default Dev Password
        await page.getByRole('button', { name: 'Unlock Dashboard' }).click();
        await page.waitForURL('/admin');
    });

    test('Admin Dashboard should render correctly', async ({ page }) => {
        await page.goto('/admin');

        // Check Header - locator matching parent text
        await expect(page.locator('header').getByText('LockForms')).toBeVisible();
        await expect(page.getByText('Local Mode (Air-Gapped)')).toBeVisible();

        // Check Content
        // "Your Forms" or "Create New Form" - use loose matching
        await expect(page.getByText('Your Forms', { exact: false })).toBeVisible();
        await expect(page.getByText('Create New Form').first()).toBeVisible();

        // Check Text Visibility (Regression Test)
        const title = page.getByText('Your Forms', { exact: false });
        // text-text-primary is used in specific h1
        await expect(title).toHaveClass(/text-text-primary/);
    });

    test('Form Builder should function correctly', async ({ page }) => {
        await page.goto('/admin/builder');

        // 1. Sidebar Loading
        // Use loose match
        await expect(page.getByText('LockForms', { exact: false }).first()).toBeVisible();
        await expect(page.getByText('Basic Fields')).toBeVisible();

        // 2. Initial Canvas State
        // Default question: "What is your name?"
        await expect(page.locator('input[value="What is your name?"]')).toBeVisible();

        // 3. Add a new Question
        // Click "Email" in sidebar
        await page.getByText('Email', { exact: true }).first().click();

        // 4. Test Settings Tab & Transitions
        await page.getByText('Settings').click();

        // Check Transitions section
        await expect(page.getByText('Transitions')).toBeVisible();
        await expect(page.getByText('Tunnel').first()).toBeVisible();

        // Use exact match or role to target the button
        const flowBtn = page.getByRole('button', { name: /Flow/i }).first();
        await flowBtn.click();

        // Check if it has active border class (loose match for border-blue-500)
        await expect(flowBtn).toHaveClass(/border-blue-500/);

        // 5. Test Theme Selection
        await expect(page.getByText('Midnight')).toBeVisible();
        await expect(page.getByText('Crisp White')).toBeVisible();

        await page.getByText('Midnight').click();

        // 6. Test Settings Inputs
        await expect(page.getByText('Welcome Screen')).toBeVisible();
    });

});
