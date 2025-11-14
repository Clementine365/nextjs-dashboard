// Force this page to render dynamically at runtime
export const dynamic = 'force-dynamic';

import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers, type CustomerField } from '@/app/lib/data';

export default async function Page() {
  let customers: CustomerField[] = [];

  try {
    // Fetch customers from Vercel Postgres
    customers = await fetchCustomers();
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          { label: 'Create Invoice', href: '/dashboard/invoices/create', active: true },
        ]}
      />

      {customers.length > 0 ? (
        <Form customers={customers} />
      ) : (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-red-700">
          Unable to load customers. Please try again later.
        </div>
      )}
    </main>
  );
}
