// app/lib/data.ts
import postgres from 'postgres';

/* ---------------------- TYPES ---------------------- */

export type CustomerField = {
  id: string;
  name: string;
  email: string;
  image_url?: string | null;
};

export type CustomersTableType = CustomerField & {
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url?: string | null;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type LatestInvoiceRaw = Omit<InvoicesTable, 'amount'> & {
  amount: number;
};

export type Revenue = {
  month: string;
  revenue: number;
};

/* ---------------------- POSTGRES CONNECTION ---------------------- */
const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: { rejectUnauthorized: false },
});

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
        COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) AS total_pending,
        COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END), 0) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
    `;
    return data.map(c => ({
      ...c,
      total_pending: Number(c.total_pending),
      total_paid: Number(c.total_paid),
      total_invoices: Number(c.total_invoices),
    }));
  } catch (error) {
    console.error('Database Error (fetchFilteredCustomers):', error);
    throw new Error('Failed to fetch filtered customers.');
  }
}

/* ---------------------- INVOICES ---------------------- */
const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(query: string, currentPage: number): Promise<InvoicesTable[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const data = await sql<any[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
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
    return data.map(invoice => ({
      id: invoice.id,
      customer_id: invoice.customer_id,
      name: invoice.name,
      email: invoice.email,
      image_url: invoice.image_url ?? null,
      amount: Number(invoice.amount),
      date: invoice.date.toString(),
      status: invoice.status as 'pending' | 'paid',
    }));
  } catch (error) {
    console.error('Database Error (fetchFilteredInvoices):', error);
    throw new Error('Failed to fetch filtered invoices.');
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
    throw new Error('Failed to fetch invoice pages count.');
  }
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm | null> {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT id, customer_id, amount, status
      FROM invoices
      WHERE id = ${id}
    `;
    if (!data[0]) return null;
    return {
      ...data[0],
      amount: Number(data[0].amount),
    };
  } catch (error) {
    console.error('Database Error (fetchInvoiceById):', error);
    throw new Error(`Failed to fetch invoice with id ${id}`);
  }
}

export async function fetchLatestInvoices(): Promise<InvoicesTable[]> {
  try {
    const data = await sql<any[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5
    `;
    return data.map(invoice => ({
      id: invoice.id,
      customer_id: invoice.customer_id,
      name: invoice.name,
      email: invoice.email,
      image_url: invoice.image_url ?? null,
      amount: Number(invoice.amount),
      date: invoice.date.toString(),
      status: invoice.status as 'pending' | 'paid',
    }));
  } catch (error) {
    console.error('Database Error (fetchLatestInvoices):', error);
    throw new Error('Failed to fetch latest invoices.');
  }
}

/* ---------------------- DASHBOARD REVENUE ---------------------- */
export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    const data = await sql<Revenue[]>`
      SELECT month, revenue
      FROM revenue
      ORDER BY month ASC
    `;
    return data;
  } catch (error) {
    console.error('Database Error (fetchRevenue):', error);
    throw new Error('Failed to fetch revenue.');
  }
}

/* ---------------------- DASHBOARD CARD DATA ---------------------- */
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
      totalPaidInvoices: Number(invoiceStatus[0]?.paid ?? 0),
      totalPendingInvoices: Number(invoiceStatus[0]?.pending ?? 0),
    };
  } catch (error) {
    console.error('Database Error (fetchCardData):', error);
    throw new Error('Failed to fetch card data.');
  }
}
