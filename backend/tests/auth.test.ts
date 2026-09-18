import { AuthService } from '../src/modules/auth/auth.service';
import { prisma } from '../src/config/database';
import { UserRole, VendorStatus } from '@prisma/client';
import { UnauthorizedError, ForbiddenError, ConflictError } from '../src/common/utils/app-error';

async function runAuthTests() {
  console.log('===================================================');
  console.log('🚀 Running Shubh Ausar Phase 3 Auth & RBAC Tests');
  console.log('===================================================');

  const authService = new AuthService();
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  const testEmailCustomer = `test.cust.${Date.now()}@test.local`;
  const testPhoneCustomer = `+9198${Date.now().toString().slice(-8)}`;
  const testPassword = 'Password@123';

  try {
    // -------------------------------------------------------------
    // Test 1: Customer Registration
    // -------------------------------------------------------------
    console.log('\n[Group 1: Customer Authentication]');
    const regResult = await authService.registerCustomer({
      name: 'Test Customer',
      email: testEmailCustomer,
      phone: testPhoneCustomer,
      password: testPassword,
    });

    assert(
      regResult.user.email === testEmailCustomer &&
      regResult.user.role === UserRole.CUSTOMER &&
      regResult.tokens !== undefined,
      'Customer registers with CUSTOMER role and receives tokens'
    );

    // -------------------------------------------------------------
    // Test 2: Duplicate Registration Protection
    // -------------------------------------------------------------
    let duplicateCaught = false;
    try {
      await authService.registerCustomer({
        name: 'Duplicate',
        email: testEmailCustomer,
        phone: '+919999999999',
        password: testPassword,
      });
    } catch (err) {
      if (err instanceof ConflictError) duplicateCaught = true;
    }
    assert(duplicateCaught, 'Duplicate email registration throws ConflictError (409)');

    // -------------------------------------------------------------
    // Test 3: Customer Login (Success & Invalid Credentials)
    // -------------------------------------------------------------
    const loginResult = await authService.loginCustomer({
      email: testEmailCustomer,
      password: testPassword,
    });
    assert(
      loginResult.user.id === regResult.user.id && !!loginResult.tokens?.accessToken,
      'Customer logs in successfully with valid credentials'
    );

    let wrongPasswordCaught = false;
    try {
      await authService.loginCustomer({
        email: testEmailCustomer,
        password: 'WrongPassword!1',
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) wrongPasswordCaught = true;
    }
    assert(wrongPasswordCaught, 'Wrong password throws UnauthorizedError (401)');

    // -------------------------------------------------------------
    // Test 4: Provider Registration & Approval Lifecycle
    // -------------------------------------------------------------
    console.log('\n[Group 2: Provider Registration & Approval Lifecycle]');
    const testEmailProvider = `test.prov.${Date.now()}@test.local`;
    const testPhoneProvider = `+9197${Date.now().toString().slice(-8)}`;

    const provReg = await authService.registerProvider({
      name: 'Sharma Tent House Owner',
      email: testEmailProvider,
      phone: testPhoneProvider,
      password: testPassword,
      businessName: 'Sharma Tent & Sound Services',
      city: 'Panipat',
    });

    assert(
      provReg.user.role === UserRole.VENDOR &&
      provReg.vendor?.status === VendorStatus.PENDING,
      'Provider registers as VENDOR and vendor status starts as PENDING'
    );

    // -------------------------------------------------------------
    // Test 5: Provider Approval Gate
    // -------------------------------------------------------------
    const pendingVendor = await prisma.vendor.findUnique({
      where: { userId: provReg.user.id },
    });
    assert(
      pendingVendor?.status === VendorStatus.PENDING && !pendingVendor.isVerified,
      'Newly registered vendor is NOT verified and status is PENDING'
    );

    // Simulate Admin approving the vendor
    await prisma.vendor.update({
      where: { id: pendingVendor!.id },
      data: { status: VendorStatus.APPROVED, isVerified: true, isActive: true },
    });

    const approvedVendor = await prisma.vendor.findUnique({
      where: { id: pendingVendor!.id },
    });
    assert(
      approvedVendor?.status === VendorStatus.APPROVED && approvedVendor.isVerified,
      'Admin approves vendor -> status transitions to APPROVED'
    );

    // -------------------------------------------------------------
    // Test 6: Admin Login & Demo Account
    // -------------------------------------------------------------
    console.log('\n[Group 3: Admin & Cross-Role Authorization]');
    const adminLogin = await authService.loginAdmin({
      email: 'admin@gmail.com',
      password: 'Password@123',
    });
    assert(
      adminLogin.user.role === UserRole.ADMIN && !!adminLogin.tokens?.accessToken,
      'Demo Admin logs in successfully with ADMIN role'
    );

    let customerDeniedAdmin = false;
    try {
      await authService.loginAdmin({
        email: testEmailCustomer,
        password: testPassword,
      });
    } catch (err) {
      if (err instanceof ForbiddenError) customerDeniedAdmin = true;
    }
    assert(customerDeniedAdmin, 'Customer cannot log in via Admin portal (Role Separation)');

    // -------------------------------------------------------------
    // Test 7: Refresh Token Rotation & Session Revocation
    // -------------------------------------------------------------
    console.log('\n[Group 4: Sessions, Refresh Token Rotation & Logout]');
    const initialRefresh = loginResult.tokens!.refreshToken;
    const rotatedTokens = await authService.refreshToken({
      refreshToken: initialRefresh,
    });

    assert(
      !!rotatedTokens.accessToken &&
      rotatedTokens.refreshToken !== initialRefresh,
      'Refresh token successfully rotates and issues new access token'
    );

    // Verify reuse of the old rotated token is blocked
    let reuseBlocked = false;
    try {
      await authService.refreshToken({
        refreshToken: initialRefresh,
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) reuseBlocked = true;
    }
    assert(reuseBlocked, 'Replaying previously rotated refresh token is denied');

    // Test Logout
    await authService.logout(rotatedTokens.refreshToken);
    let postLogoutRefreshDenied = false;
    try {
      await authService.refreshToken({
        refreshToken: rotatedTokens.refreshToken,
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) postLogoutRefreshDenied = true;
    }
    assert(postLogoutRefreshDenied, 'Logged out session cannot be refreshed');

    // -------------------------------------------------------------
    // Test 8: Password Change
    // -------------------------------------------------------------
    console.log('\n[Group 5: Password Management]');
    const newPassword = 'NewSecretPassword@123';
    const changeResult = await authService.changePassword(regResult.user.id, {
      currentPassword: testPassword,
      newPassword,
    });
    assert(
      changeResult.message.includes('successfully'),
      'Password successfully changed with valid current password'
    );

    const loginWithNewPass = await authService.loginCustomer({
      email: testEmailCustomer,
      password: newPassword,
    });
    assert(
      loginWithNewPass.user.id === regResult.user.id,
      'Login succeeds with new password after change'
    );

  } catch (error) {
    console.error('Unhandled test exception:', error);
    failed++;
  } finally {
    console.log('\n===================================================');
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('===================================================');
    await prisma.$disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  }
}

runAuthTests();
