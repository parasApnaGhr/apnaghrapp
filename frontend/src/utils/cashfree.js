// Cashfree Payment Integration
// Uses Cashfree.js SDK v3 for secure payment processing

const CASHFREE_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'production';

export const initiateCashfreePayment = async (paymentSessionId, returnUrl) => {
  return new Promise((resolve, reject) => {
    try {
      // Check if Cashfree SDK is loaded
      if (typeof window.Cashfree === 'undefined') {
        reject(new Error('Cashfree SDK not loaded. Please refresh the page.'));
        return;
      }

      // Initialize Cashfree with proper mode
      const cashfree = window.Cashfree({
        mode: CASHFREE_ENVIRONMENT // 'sandbox' or 'production'
      });

      // Configure checkout options
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_self', // '_self' for same window, '_blank' for new tab
        returnUrl: returnUrl
      };

      console.log('Initiating Cashfree payment with session:', paymentSessionId.substring(0, 30) + '...');
      
      // Initiate the checkout
      cashfree.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          console.error('Cashfree checkout error:', result.error);
          reject(new Error(result.error.message || 'Payment failed'));
        } else if (result.redirect) {
          // Payment page will redirect, nothing to do here
          console.log('Redirecting to payment page...');
          resolve({ redirected: true });
        } else if (result.paymentDetails) {
          // Payment completed (for non-redirect methods)
          console.log('Payment completed:', result.paymentDetails);
          resolve(result.paymentDetails);
        }
      }).catch((error) => {
        console.error('Cashfree checkout exception:', error);
        reject(error);
      });

    } catch (error) {
      console.error('Failed to initiate Cashfree payment:', error);
      reject(error);
    }
  });
};

// Alternative: Redirect directly to Cashfree hosted checkout
export const redirectToCashfreeCheckout = (paymentSessionId) => {
  const baseUrl = CASHFREE_ENVIRONMENT === 'production' 
    ? 'https://payments.cashfree.com/order/#'
    : 'https://payments-test.cashfree.com/order/#';
  
  window.location.href = `${baseUrl}/${paymentSessionId}`;
};

export default { initiateCashfreePayment, redirectToCashfreeCheckout };
