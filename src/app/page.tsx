import { redirect } from 'next/navigation';

// Force dynamic rendering - this is the key fix
export const dynamic = 'force-dynamic';

export default function Home() {
  // Server-side redirect to login
  redirect('/login');
}
