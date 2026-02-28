import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// Layout wrapper (some pages like Login/Register don't need navbar/footer)
function AppLayout({ children, withNav = true }) {
  return (
    <>
      {withNav && <Navbar />}
      <main className="min-h-screen">
        <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
      </main>
      {withNav && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public pages */}
            <Route
              path="/"
              element={
                <AppLayout>
                  <HomePage />
                </AppLayout>
              }
            />
            <Route
              path="/products"
              element={
                <AppLayout>
                  <ProductsPage />
                </AppLayout>
              }
            />
            <Route
              path="/login"
              element={
                <AppLayout withNav={false}>
                  <LoginPage />
                </AppLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AppLayout withNav={false}>
                  <RegisterPage />
                </AppLayout>
              }
            />

            {/* Protected pages */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CartPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OrderTrackingPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OrderTrackingPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
