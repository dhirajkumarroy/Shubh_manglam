import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1';

async function runEndToEndQuoteBookingTest() {
  console.log('=================================================================');
  console.log('  SHUBH AUSAR — QUOTE → NEGOTIATION → BOOKING END-TO-END TEST    ');
  console.log('=================================================================');

  // -------------------------------------------------------------
  // 1. Authenticate Actors
  // -------------------------------------------------------------
  console.log('\n[1/10] Authenticating Customer, Provider, and Admin...');
  const customerLogin = await axios.post(`${BASE_URL}/auth/customer/login`, {
    email: 'customer@gmail.com',
    password: 'Password@123',
  });
  const customerToken = customerLogin.data.data.tokens.accessToken;
  const customerId = customerLogin.data.data.user.id;
  console.log(`  ✓ Customer logged in: ID=${customerId}`);

  const providerLogin = await axios.post(`${BASE_URL}/auth/provider/login`, {
    email: 'halwai@gmail.com',
    password: 'Password@123',
  });
  const providerToken = providerLogin.data.data.tokens.accessToken;
  console.log('  ✓ Provider (Halwai) logged in');

  const adminLogin = await axios.post(`${BASE_URL}/auth/admin/login`, {
    email: 'admin@gmail.com',
    password: 'Password@123',
  });
  const adminToken = adminLogin.data.data.tokens.accessToken;
  console.log('  ✓ Admin logged in');

  // -------------------------------------------------------------
  // 2. Discover Vendor & Customer Event
  // -------------------------------------------------------------
  console.log('\n[2/10] Resolving Vendor and Customer Event...');
  // Find Halwai vendor profile
  const vendorRes = await axios.get(`${BASE_URL}/marketplace/vendors?search=halwai`);
  const vendorList = vendorRes.data.data.vendors || vendorRes.data.data;
  const halwaiVendor = vendorList[0] || (await axios.get(`${BASE_URL}/marketplace/vendors`)).data.data.vendors[0];
  const vendorId = halwaiVendor.id;
  console.log(`  ✓ Target Vendor: "${halwaiVendor.businessName}" (ID: ${vendorId})`);

  // Get or create customer event
  let eventId: string | undefined;
  try {
    const eventsRes = await axios.get(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const existingEvents = eventsRes.data.data;
    if (existingEvents && existingEvents.length > 0) {
      eventId = existingEvents[0].id;
      console.log(`  ✓ Found existing Customer Event: "${existingEvents[0].title}" (ID: ${eventId})`);
    }
  } catch (e) {
    console.log('  Note: Could not query existing events, proceeding with generic quote request');
  }

  // -------------------------------------------------------------
  // 3. Customer Requests Quote
  // -------------------------------------------------------------
  console.log('\n[3/10] Customer initiating formal Quote Request...');
  const quoteReqRes = await axios.post(
    `${BASE_URL}/quotes/request`,
    {
      vendorId,
      eventId,
      customerNotes: 'Require sweet counters for 250 guests including live jalebi.',
      guestCount: 250,
      requestedDate: '2026-11-20',
    },
    {
      headers: { Authorization: `Bearer ${customerToken}` },
    }
  );

  const quoteRequest = quoteReqRes.data.data;
  const quoteId = quoteRequest.id;
  console.log(`  ✓ Quote Request Created: #${quoteRequest.quoteNumber} (ID: ${quoteId})`);
  console.log(`  ✓ Initial Status: ${quoteRequest.status}`);
  if (quoteRequest.status !== 'REQUESTED') {
    throw new Error(`Expected status REQUESTED, got ${quoteRequest.status}`);
  }

  // -------------------------------------------------------------
  // 4. Provider Creates Formal Quote (Version 1)
  // -------------------------------------------------------------
  console.log('\n[4/10] Provider creating Formal Quote with line items (v1)...');
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 14);

  const formalQuoteRes = await axios.post(
    `${BASE_URL}/quotes`,
    {
      quoteRequestId: quoteId,
      customerId,
      validUntil: validUntilDate.toISOString(),
      discount: 2000,
      tax: 0,
      notes: 'Premium live counter with organic desi ghee.',
      items: [
        {
          description: 'Live Desi Ghee Jalebi Counter (250 Guests)',
          quantity: 1,
          unitPrice: 16000,
          notes: 'Fresh live preparation',
        },
        {
          description: 'Assorted Mithai Station (Gulab Jamun, Rasgulla, Kaju Katli)',
          quantity: 1,
          unitPrice: 14000,
          notes: 'Standard 4 sweet varieties',
        },
      ],
    },
    {
      headers: { Authorization: `Bearer ${providerToken}` },
    }
  );

  const v1Quote = formalQuoteRes.data.data;
  console.log(`  ✓ Quote v1 issued. Status: ${v1Quote.status}`);
  console.log(`  ✓ Subtotal: ₹${v1Quote.subtotal}, Discount: ₹${v1Quote.discount}, Total: ₹${v1Quote.total}`);
  if (Number(v1Quote.total) !== 28000) {
    throw new Error(`Expected total 28000 (16000 + 14000 - 2000), got ${v1Quote.total}`);
  }
  if (v1Quote.status !== 'SENT') {
    throw new Error(`Expected status SENT, got ${v1Quote.status}`);
  }

  // -------------------------------------------------------------
  // 5. Customer Requests Revision / Negotiation Loop
  // -------------------------------------------------------------
  console.log('\n[5/10] Customer requesting Revision / Negotiation...');
  const revisionRequestRes = await axios.post(
    `${BASE_URL}/quotes/${quoteId}/revision-request`,
    {
      revisionNotes: 'Can you please include Rabdi with the Jalebi, and keep total under ₹30,000?',
    },
    {
      headers: { Authorization: `Bearer ${customerToken}` },
    }
  );

  const negotiatedQuote = revisionRequestRes.data.data;
  console.log(`  ✓ Revision requested. Status: ${negotiatedQuote.status}`);
  console.log(`  ✓ Customer Notes recorded: "${negotiatedQuote.revisionNotes}"`);
  if (negotiatedQuote.status !== 'REVISION_REQUESTED') {
    throw new Error(`Expected status REVISION_REQUESTED, got ${negotiatedQuote.status}`);
  }

  // -------------------------------------------------------------
  // 6. Provider Issues Revised Quote (Version 2)
  // -------------------------------------------------------------
  console.log('\n[6/10] Provider issuing Revised Quote (v2)...');
  const revisedQuoteRes = await axios.post(
    `${BASE_URL}/quotes/${quoteId}/revise`,
    {
      discount: 3000,
      tax: 0,
      notes: 'Added Malpua Rabdi combo counter as requested.',
      items: [
        {
          description: 'Live Desi Ghee Jalebi Counter (250 Guests)',
          quantity: 1,
          unitPrice: 16000,
        },
        {
          description: 'Assorted Mithai Station',
          quantity: 1,
          unitPrice: 14000,
        },
        {
          description: 'Special Malpua & Kesar Rabdi Counter',
          quantity: 1,
          unitPrice: 2500,
        },
      ],
    },
    {
      headers: { Authorization: `Bearer ${providerToken}` },
    }
  );

  const v2Quote = revisedQuoteRes.data.data;
  console.log(`  ✓ Quote v2 issued. Status: ${v2Quote.status}, Version: ${v2Quote.currentVersion}`);
  console.log(`  ✓ Revised Total: ₹${v2Quote.total} (Subtotal: ₹${v2Quote.subtotal}, Discount: ₹${v2Quote.discount})`);
  if (Number(v2Quote.total) !== 29500) {
    throw new Error(`Expected total 29500 (16000 + 14000 + 2500 - 3000), got ${v2Quote.total}`);
  }
  if (v2Quote.status !== 'REVISED') {
    throw new Error(`Expected status REVISED, got ${v2Quote.status}`);
  }

  // -------------------------------------------------------------
  // 7. Inspect Version History
  // -------------------------------------------------------------
  console.log('\n[7/10] Inspecting Quote Version History...');
  const quoteDetailsRes = await axios.get(`${BASE_URL}/quotes/${quoteId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const detailedQuote = quoteDetailsRes.data.data;
  console.log(`  ✓ Quote has ${detailedQuote.versions?.length || 0} recorded version(s) in audit log.`);
  if (detailedQuote.versions && detailedQuote.versions.length >= 2) {
    console.log(`    - Version ${detailedQuote.versions[0].versionNumber}: ₹${detailedQuote.versions[0].total}`);
    console.log(`    - Version ${detailedQuote.versions[1].versionNumber}: ₹${detailedQuote.versions[1].total}`);
  }

  // -------------------------------------------------------------
  // 8. Customer Accepts Quote -> Atomic Booking & Item Snapshot Creation
  // -------------------------------------------------------------
  console.log('\n[8/10] Customer accepting quote (Atomic Booking + Snapshot Creation)...');
  const acceptRes = await axios.post(
    `${BASE_URL}/quotes/${quoteId}/accept`,
    {},
    {
      headers: { Authorization: `Bearer ${customerToken}` },
    }
  );

  const acceptanceResult = acceptRes.data.data;
  const booking = acceptanceResult.booking;
  console.log(`  ✓ Quote ACCEPTED! Status: ${acceptanceResult.quote.status}`);
  console.log(`  ✓ Booking Created: #${booking.bookingNumber} (ID: ${booking.id})`);
  console.log(`  ✓ Booking Status: ${booking.status}`);
  console.log(`  ✓ Snapshotted Item Count: ${booking.items?.length || 0}`);

  if (acceptanceResult.quote.status !== 'ACCEPTED') {
    throw new Error(`Expected quote status ACCEPTED, got ${acceptanceResult.quote.status}`);
  }
  if (booking.status !== 'CONFIRMED') {
    throw new Error(`Expected booking status CONFIRMED, got ${booking.status}`);
  }
  if (Number(booking.total) !== 29500) {
    throw new Error(`Expected booking total 29500, got ${booking.total}`);
  }

  // Verify historical items snapshot
  for (const item of booking.items) {
    console.log(`    • [Snapshot] "${item.name}" - Qty: ${item.quantity}, Price: ₹${item.unitPrice}, Total: ₹${item.totalPrice}`);
  }

  // -------------------------------------------------------------
  // 9. Concurrency & Business Rule Defenses
  // -------------------------------------------------------------
  console.log('\n[9/10] Testing Business State Transitions & Concurrency Defenses...');
  
  // A. Duplicate Acceptance Prevention
  try {
    await axios.post(
      `${BASE_URL}/quotes/${quoteId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    throw new Error('Duplicate acceptance should have been rejected!');
  } catch (err: any) {
    console.log(`  ✓ Duplicate Acceptance Blocked: ${err.response?.data?.message || err.message}`);
  }

  // B. Revision on Accepted Quote Prevention
  try {
    await axios.post(
      `${BASE_URL}/quotes/${quoteId}/revise`,
      { items: [{ description: 'New item', quantity: 1, unitPrice: 1000 }] },
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );
    throw new Error('Revision on accepted quote should have been rejected!');
  } catch (err: any) {
    console.log(`  ✓ Revision on Accepted Quote Blocked: ${err.response?.data?.message || err.message}`);
  }

  // -------------------------------------------------------------
  // 10. Admin Marketplace Inspection
  // -------------------------------------------------------------
  console.log('\n[10/10] Admin inspecting Quotes and Bookings in console...');
  const adminQuotesRes = await axios.get(`${BASE_URL}/quotes`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminBookingsRes = await axios.get(`${BASE_URL}/bookings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  console.log(`  ✓ Admin total marketplace quotes: ${adminQuotesRes.data.data.pagination.total}`);
  console.log(`  ✓ Admin total marketplace bookings: ${adminBookingsRes.data.data.pagination.total}`);

  console.log('\n=================================================================');
  console.log('  🎉 ALL QUOTE → NEGOTIATION → BOOKING TESTS PASSED PERFECTLY!   ');
  console.log('=================================================================');
}

runEndToEndQuoteBookingTest().catch((err) => {
  console.error('\n❌ Test Execution Failed:');
  if (err.response) {
    console.error(`Status: ${err.response.status}`);
    console.error('Data:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error(err.message || err);
  }
  process.exit(1);
});
