/**
 * Subscriptions has been removed from customer navigation.
 * Redirect users to the updated loyalty experience.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SubscriptionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/loyalty');
  }, [router]);

  return null;
}