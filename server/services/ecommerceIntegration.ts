/**
 * InTheWild — E-Commerce Integration with Stripe
 * Auto-add Stripe payment integration to generated sites.
 * Product catalog, shopping cart, checkout, order management.
 */

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  images: string[];
  category: string;
  inventory: number;
  isActive: boolean;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  currency: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  stripePaymentIntentId?: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export function generateEcommerceComponents(): {
  productCard: string;
  cart: string;
  checkout: string;
  orderConfirmation: string;
} {
  const productCard = `
import React from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  onAddToCart: (id: string) => void;
}

export function ProductCard({ id, name, description, price, image, onAddToCart }: ProductCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">$\{(price / 100).toFixed(2)}</span>
          <button
            onClick={() => onAddToCart(id)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
`;

  const cart = `
import React from 'react';

interface CartProps {
  items: Array<{ id: string; name: string; price: number; quantity: number; image: string }>;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemove, onCheckout }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Shopping Cart</h2>
      {items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">$\{(item.price / 100).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="px-2 py-1 border rounded"
                  >
                    -
                  </button>
                  <span className="px-4">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-1 border rounded"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-2xl font-bold">$\{(total / 100).toFixed(2)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}
`;

  const checkout = `
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function CheckoutForm({ total }: { total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // Create payment intent on backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else {
        // Payment successful
        window.location.href = '/order-confirmation';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
      <div className="mb-6 p-4 border rounded-lg">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : \`Pay $\${(total / 100).toFixed(2)}\`}
      </button>
    </form>
  );
}

export function Checkout({ total }: { total: number }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm total={total} />
    </Elements>
  );
}
`;

  const orderConfirmation = `
import React from 'react';

interface OrderConfirmationProps {
  orderId: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export function OrderConfirmation({ orderId, total, items }: OrderConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="mb-6">
        <svg className="w-16 h-16 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-gray-600 mb-6">Thank you for your purchase</p>
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <p className="text-sm text-gray-600 mb-2">Order Number</p>
        <p className="text-xl font-mono font-bold">{orderId}</p>
      </div>
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between mb-2">
            <span>{item.name} x {item.quantity}</span>
            <span>$\{(item.price * item.quantity / 100).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>$\{(total / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
`;

  return { productCard, cart, checkout, orderConfirmation };
}

export function generateStripeBackend(): string {
  return `
import Stripe from 'stripe';
import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const stripeRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({ amount: z.number(), currency: z.string().default('usd') }))
    .mutation(async ({ input }) => {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: input.amount,
        currency: input.currency,
        automatic_payment_methods: { enabled: true },
      });

      return { clientSecret: paymentIntent.client_secret };
    }),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        images: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const product = await stripe.products.create({
        name: input.name,
        description: input.description,
        images: input.images,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: input.price,
        currency: 'usd',
      });

      return { productId: product.id, priceId: price.id };
    }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            priceId: z.string(),
            quantity: z.number(),
          })
        ),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await stripe.checkout.sessions.create({
        line_items: input.items.map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });

      return { sessionId: session.id, url: session.url };
    }),

  getOrders: protectedProcedure.query(async ({ ctx }) => {
    // Fetch orders from database
    // In production: query from Drizzle ORM
    return [];
  }),
});
`;
}

export function generateEcommerceEnvVars(): string {
  return `
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Store Configuration
STORE_NAME=My Store
STORE_URL=https://mystore.com
STORE_EMAIL=support@mystore.com
STORE_CURRENCY=usd

# Shipping
ENABLE_SHIPPING=true
FREE_SHIPPING_THRESHOLD=5000
`;
}
