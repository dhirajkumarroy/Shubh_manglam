declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    description: string;
    image?: string;
    currency: string;
    key: string;
    amount: string | number;
    name: string;
    order_id: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
  }

  export interface RazorpayCheckoutSuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayCheckoutErrorResponse {
    code: number;
    description: string;
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayCheckoutOptions): Promise<RazorpayCheckoutSuccessResponse>;
  }
}
