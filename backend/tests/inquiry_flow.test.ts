import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1';

async function runTest() {
  console.log('=== TESTING COMPLETE INQUIRY WORKFLOW ===');

  // 1. Customer Login
  console.log('\n1. Logging in as Customer (customer@gmail.com)...');
  const custRes = await axios.post(`${BASE_URL}/auth/customer/login`, {
    email: 'customer@gmail.com',
    password: 'Password@123',
  });
  const custToken = custRes.data.data.tokens.accessToken;
  console.log('✓ Customer logged in successfully.');

  // 2. Halwai Login
  console.log('\n2. Logging in as Halwai Provider (halwai@gmail.com)...');
  const halwaiRes = await axios.post(`${BASE_URL}/auth/provider/login`, {
    email: 'halwai@gmail.com',
    password: 'Password@123',
  });
  const halwaiToken = halwaiRes.data.data.tokens.accessToken;
  console.log('✓ Halwai logged in successfully.');

  // 3. Halwai views inquiries
  console.log('\n3. Halwai fetching incoming inquiries...');
  const halwaiInqRes = await axios.get(`${BASE_URL}/bookings/vendor`, {
    headers: { Authorization: `Bearer ${halwaiToken}` },
  });
  const halwaiInquiries = halwaiInqRes.data.data;
  console.log(`✓ Halwai received ${halwaiInquiries.length} inquiries.`);
  const pendingInq = halwaiInquiries.find((inq: any) => inq.status === 'PENDING');
  console.log(`  Target inquiry ID: ${pendingInq?.id}, Occasion: ${pendingInq?.inquiryDetails?.occasion}, Date: ${pendingInq?.inquiryDetails?.eventDate}`);

  // 4. Halwai accepts the inquiry
  if (pendingInq) {
    console.log('\n4. Halwai accepting the inquiry...');
    const acceptRes = await axios.patch(
      `${BASE_URL}/bookings/${pendingInq.id}/respond`,
      {
        action: 'ACCEPT',
        vendorNote: 'We will bring the live jalebi counter on 20 Sep at 6 PM!',
      },
      { headers: { Authorization: `Bearer ${halwaiToken}` } }
    );
    console.log(`✓ Status after response: ${acceptRes.data.data.status}`);
  }

  // 5. Customer checks their inquiries
  console.log('\n5. Customer viewing their updated inquiries...');
  const custInqRes = await axios.get(`${BASE_URL}/bookings/customer`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  console.log(`✓ Customer sees ${custInqRes.data.data.length} total inquiries.`);
  for (const inq of custInqRes.data.data) {
    console.log(`  - [${inq.status}] ${inq.vendor?.businessName} (${inq.inquiryDetails?.occasion} on ${inq.inquiryDetails?.eventDate})`);
  }

  // 6. Admin Analytics
  console.log('\n6. Admin fetching inquiry analytics...');
  const adminRes = await axios.post(`${BASE_URL}/auth/admin/login`, {
    email: 'admin@gmail.com',
    password: 'Password@123',
  });
  const adminToken = adminRes.data.data.tokens.accessToken;

  const analyticsRes = await axios.get(`${BASE_URL}/bookings/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('✓ Admin Analytics Summary:', analyticsRes.data.data.summary);
  console.log('✓ Providers Breakdown:');
  for (const p of analyticsRes.data.data.providers) {
    console.log(`  • ${p.businessName} (${p.categories.join(', ')}): Total=${p.totalRequests}, Accepted=${p.acceptedCount}, Rejected=${p.rejectedCount}, Rate=${p.acceptanceRate}%`);
  }

  console.log('\n==========================================');
  console.log('🎉 ALL BACKEND INQUIRY WORKFLOW TESTS PASSED!');
  console.log('==========================================');
}

runTest().catch((err) => {
  console.error('Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
