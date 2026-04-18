// Cashfree Payment Integration
// Uses Cashfree.js SDK v3 for secure payment processing

const CASHFREE_ENVIRONMENT = import.meta.env.PROD ? 'production' : 'production';

interface CashfreeCheckoutResult {
  error?: { message: string };
  redirect?: boolean;
  paymentDetails?: Record<string, unknown>;
}

export const initiateCashfreePayment = async (
  paymentSessionId: string,
  _returnUrl?: string
): Promise<CashfreeCheckoutResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if Cashfree SDK is loaded
      if (typeof window.Cashfree === 'undefined') {
        reject(new Error('Cashfree SDK not loaded. Please refresh the page.'));
        return;
      }

      // Initialize Cashfree with proper mode
      const cashfree = window.Cashfree({
        mode: CASHFREE_ENVIRONMENT
      });

      // Configure checkout options
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_self' as const,
      };

      console.log('Initiating Cashfree payment with session:', paymentSessionId.substring(0, 30) + '...');

      // Initiate the checkout
      cashfree.checkout(checkoutOptions).then((res: any) => {
        const result = res as CashfreeCheckoutResult;
        if (result.error) {
          console.error('Cashfree checkout error:', result.error);
          reject(new Error(result.error.message || 'Payment failed'));
        } else if (result.redirect) {
          console.log('Redirecting to payment page...');
          resolve({ redirected: true } as CashfreeCheckoutResult);
        } else if (result.paymentDetails) {
          console.log('Payment completed:', result.paymentDetails);
          resolve(result.paymentDetails as CashfreeCheckoutResult);
        }
      }).catch((error: Error) => {
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
export const redirectToCashfreeCheckout = (paymentSessionId: string): void => {
  const baseUrl = CASHFREE_ENVIRONMENT === 'production'
    ? 'https://payments.cashfree.com/order/#'
    : 'https://payments-test.cashfree.com/order/#';

  window.location.href = `${baseUrl}/${paymentSessionId}`;
};

export default { initiateCashfreePayment, redirectToCashfreeCheckout };
