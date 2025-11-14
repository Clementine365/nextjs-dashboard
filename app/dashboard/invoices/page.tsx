import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import type { CustomerField } from '@/app/lib/definitions';

export default async function Page() {
  // <-- fix is here
  let customers: CustomerField[] = []; // or use: let customers = [] as CustomerField[];

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
        <p className="text-red-500 mt-4">
          Unable to load customers. Please try again later.
        </p>
      )}
    </main>
  );
}
