import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

/* ---------------------- POSTGRES CONNECTION ---------------------- */
const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: { rejectUnauthorized: false }, // Required for Vercel Postgres
});

/* ---------------------- REVENUE ---------------------- */
export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    console.log('Fetching revenue data...');
    // Remove delay in production
    const data = await sql<Revenue[]>`
      SELECT * FROM revenue
    `;
    return data;
  } catch (error) {
    console.error('Database Error (fetchRevenue):', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

/* ---------------------- LATEST INVOICES ---------------------- */
export async function fetchLatestInvoices(): Promise<InvoicesTable[]> {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5
    `;

    return data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error (fetchLatestInvoices):', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

/* ---------------------- DASHBOARD CARDS ---------------------- */
export async function fetchCardData() {
  try {
    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM invoices`,
      sql`SELECT COUNT(*) AS count FROM customers`,
      sql`
        SELECT
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending
        FROM invoices
      `,
    ]);

    return {
      numberOfInvoices: Number(invoiceCount[0]?.count ?? 0),
      numberOfCustomers: Number(customerCount[0]?.count ?? 0),
      totalPaidInvoices: formatCurrency(invoiceStatus[0]?.paid ?? 0),
      totalPendingInvoices: formatCurrency(invoiceStatus[0]?.pending ?? 0),
    };
  } catch (error) {
    console.error('Database Error (fetchCardData):', error);
    throw new Error('Failed to fetch card data.');
  }
}

/* ---------------------- FILTERED INVOICES ---------------------- */
const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(query: string, currentPage: number): Promise<InvoicesTable[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    return await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
  } catch (error) {
    console.error('Database Error (fetchFilteredInvoices):', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string): Promise<number> {
  try {
    const data = await sql<{ count: string }[]>`
      SELECT COUNT(*) AS count
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
    `;
    return Math.ceil(Number(data[0]?.count ?? 0) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error (fetchInvoicesPages):', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm | null> {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        id,
        customer_id,
        amount,
        status
      FROM invoices
      WHERE id = ${id}
    `;

    if (!data[0]) return null;

    return {
      ...data[0],
      amount: data[0].amount / 100, // Convert cents to dollars
    };
  } catch (error) {
    console.error('Database Error (fetchInvoiceById):', error);
    throw new Error(`Failed to fetch invoice with id ${id}`);
  }
}

/* ---------------------- CUSTOMERS ---------------------- */
export async function fetchCustomers(): Promise<CustomerField[]> {
  try {
    return await sql<CustomerField[]>`
      SELECT id, name, email, image_url
      FROM customers
      ORDER BY name ASC
    `;
  } catch (error) {
    console.error('Database Error (fetchCustomers):', error);
    throw new Error('Failed to fetch customers.');
  }
}

export async function fetchFilteredCustomers(query: string): Promise<CustomersTableType[]> {
  try {
    const data = await sql<CustomersTableType[]>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
    `;

    return data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending ?? 0),
      total_paid: formatCurrency(customer.total_paid ?? 0),
    }));
  } catch (error) {
    console.error('Database Error (fetchFilteredCustomers):', error);
    throw new Error('Failed to fetch customer table.');
  }
}
