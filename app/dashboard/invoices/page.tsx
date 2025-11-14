// Force this page to render dynamically at runtime
export const dynamic = 'force-dynamic';

import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import type { CustomerField } from '@/app/lib/definitions'; // make sure it's type-only import
import { fetchCustomers } from '@/app/lib/data';

export default async function Page() {
  // Explicit type annotation on the empty array
  let customers: CustomerField[] = [];

  try {
    // Fetch customers from the database
    customers = await fetchCustomers();
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    // fallback to empty array
    customers = [];
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
        <p className="text-red-500 mt-4">
          Unable to load customers. Please try again later.
        </p>
      )}
    </main>
  );
}
