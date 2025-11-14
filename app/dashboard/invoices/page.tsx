import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
//import { fetchCustomers, } from '@/app/lib/data';
import { fetchCustomers, type CustomerField } from '@/app/lib/data'; 
//export default async function Page() {
   // Explicitly typed to avoid 'any[]' errors
  let customers: CustomerField[] = [];
  

  try {
    // Attempt to fetch customers from the database
    customers = await fetchCustomers();
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    // fallback: empty array to prevent build errors
    customers = [];
  }

  return (
    <main className="px-4 md:px-8">
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
