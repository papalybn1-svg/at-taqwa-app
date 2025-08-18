// Test du service de paiement mobile
const { PaymentService } = require('./src/lib/paymentService');

async function testPaymentService() {
  console.log('🧪 Test du Service de Paiement Mobile...\n');

  const paymentService = new PaymentService({
    backendUrl: 'http://localhost:3000' // ou votre URL Vercel
  });

  try {
    // Test 1: Vérifier les entitlements
    console.log('1️⃣ Test checkEntitlements...');
    const entitlements = await paymentService.checkEntitlements();
    console.log('✅ Entitlements:', entitlements);

    // Test 2: Créer un paiement
    console.log('\n2️⃣ Test createPayment...');
    const payment = await paymentService.createPayment('BOOK_PART_2');
    console.log('✅ Payment:', payment);

    if (payment.success && payment.checkoutUrl) {
      console.log('\n3️⃣ Test openPayDunyaCheckout...');
      // Note: Cette fonction ouvre une URL, on ne peut pas la tester en Node.js
      console.log('✅ Checkout URL:', payment.checkoutUrl);
      console.log('💡 Pour tester l\'ouverture, utilisez cette URL dans un navigateur');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testPaymentService(); 