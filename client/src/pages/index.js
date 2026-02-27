/**
 * Homepage - Public landing page
 */
import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import { Droplets, Truck, ShieldCheck, Star, ArrowRight, Phone, MapPin } from 'lucide-react';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>JZ Waters - Pure Water Delivery</title>
        <meta name="description" content="Fresh, clean, purified water delivered to your doorstep" />
      </Head>

      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Pure Water,
              <br />
              <span className="text-primary-200">Delivered Fresh</span>
            </h1>
            <p className="mt-6 text-lg text-primary-100 leading-relaxed">
              JZ Waters provides clean, purified water for your home and business.
              Order online and get it delivered straight to your door.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/products" className="inline-flex items-center justify-center bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors">
                Order Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-12">Why Choose JZ Waters?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Droplets, title: 'Pure & Safe', desc: 'Multi-stage purification process ensuring the cleanest water for your family.' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery available. Track your order in real-time.' },
              { icon: ShieldCheck, title: 'Quality Guaranteed', desc: 'FDA-approved facility with strict quality control at every step.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card text-center">
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Browse', desc: 'Choose from our water products' },
              { step: '2', title: 'Order', desc: 'Add to cart and checkout' },
              { step: '3', title: 'Deliver', desc: 'We deliver to your door' },
              { step: '4', title: 'Enjoy', desc: 'Fresh water, always!' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">{step}</div>
                <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loyalty Section */}
      <section className="py-16 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Star className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Earn Loyalty Points</h2>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Every gallon you order earns you points. Redeem them for discounts on your next delivery!
          </p>
          <Link href="/register" className="btn-primary inline-block mt-6">
            Join Now & Start Earning
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 text-white mb-3">
                <Droplets className="w-6 h-6" />
                <span className="font-bold text-lg">JZ Waters</span>
              </div>
              <p className="text-sm">Clean, purified water for your home and business.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/products" className="block hover:text-white">Products</Link>
                <Link href="/register" className="block hover:text-white">Register</Link>
                <Link href="/login" className="block hover:text-white">Sign In</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2"><Phone className="w-4 h-4" /><span>09123456789</span></div>
                <div className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>123 Main St, Barangay Sample</span></div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} JZ Waters. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
