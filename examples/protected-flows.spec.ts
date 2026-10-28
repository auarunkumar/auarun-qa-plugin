import { test, expect } from '../fixtures';
import { users, coupons, products } from '../test-data';

// Three protected QA Mart flows: sign-in (US-104), coupons (US-101), stock limits (US-103).
// Copy to tests/protected/ in the qa-mart-lab repo.

test.describe('US-104 sign-in', () => {
  test('US-104 AC1: valid credentials reach the product list', async ({ signedInPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });

  test('US-104 AC2: wrong password is rejected with 401', async ({ api }) => {
    const res = await api.login({ email: users.standard.email, password: 'not-the-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('US-104 AC4: locked account returns 423', async ({ api }) => {
    const res = await api.login(users.locked);
    expect(res.status).toBe(423);
    expect(res.body.error).toBe('This account is locked. Contact support.');
  });
});

test.describe('US-101 coupons', () => {
  test('US-101 AC3: FLAT100 gives ₹100 off at exactly ₹500', async ({ api }) => {
    const res = await api.validateCoupon(coupons.flat, 500, users.standard.email);
    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(100);
  });

  test('US-101 AC3: FLAT100 is not applied below ₹500', async ({ api }) => {
    const res = await api.validateCoupon(coupons.flat, 499, users.standard.email);
    expect(res.status).toBe(422);
  });

  test('US-101 AC2: SAVE10 is capped at ₹200', async ({ api }) => {
    const res = await api.validateCoupon(coupons.percent, 3498, users.standard.email);
    expect(res.body.discount).toBe(200);
  });

  test('US-101 AC5: SUMMER25 is expired', async ({ api }) => {
    const res = await api.validateCoupon(coupons.expired, 1000, users.standard.email);
    expect(res.body.message).toBe('This coupon has expired');
  });
});

test.describe('US-103 stock limits', () => {
  test('US-103 AC5: inventory returns the stock limit per product', async ({ request }) => {
    const res = await request.get('/api/inventory');
    expect((await res.json()).stock).toMatchObject({
      [products.mouse.id]: products.mouse.stock,
      [products.lamp.id]: products.lamp.stock,
      [products.stand.id]: 0,
    });
  });

  test('US-103 AC2: out-of-stock product is rejected with 422', async ({ api }) => {
    const res = await api.placeOrder({ email: users.standard.email, items: [{ id: products.stand.id, qty: 1 }] });
    expect(res.status).toBe(422);
    expect(res.body.error ?? res.body.message).toContain(products.stand.name);
  });
});
