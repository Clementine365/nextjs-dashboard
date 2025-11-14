import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/invoices/create-form';
import type { CustomerField } from '@/app/lib/definitions';
import { fetchCustomers } from '@/app/lib/data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // ✅ Explicit type at declaration
  let customers: CustomerField[] = [];

  try {
    customers = await fetchCustomers();
  } catch (error) {
    console.error('Failed to fetch customers:', error);
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
        <div className="mt-6 rounded-md bg-red-50 p-4 text-red-700">
          Unable to load customers. Please try again later.
        </div>
      )}
    </main>
  );
}
