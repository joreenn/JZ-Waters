/**
 * Cart Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import EmptyState from '../components/ui/EmptyState';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../../shared/helpers';

export default function Cart() {
  const { items, addItem, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <>
      <Head><title>Cart - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Your cart is empty"
              message="Browse our products and add items to your cart"
              action={<Link href="/products" className="btn-primary mt-4 inline-flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Browse Products
              </Link>}
            />
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map(item => (
                  <div key={item.id} className="card flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-8 h-8 text-primary-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} / {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        if (item.quantity <= 1) removeItem(item.id);
                        else updateQuantity(item.id, item.quantity - 1);
                      }} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-primary-600">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-1 text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear Cart
                </button>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="card sticky top-24">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Items ({items.reduce((a, i) => a + i.quantity, 0)})</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery fee</span>
                      <span className="text-xs">Calculated at checkout</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Subtotal</span>
                        <span className="text-primary-600">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                  </div>
                  {user ? (
                    <Link href="/checkout" className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                      Proceed to Checkout <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link href="/login" className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                      Login to Checkout <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  <Link href="/products" className="btn-secondary w-full mt-2 text-center block">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
