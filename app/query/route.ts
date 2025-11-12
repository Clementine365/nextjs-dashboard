 import postgres from 'postgres';
import { NextRequest, NextResponse } from 'next/server';

 const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

 async function listInvoices() {
 	const data = await sql`
     SELECT invoices.amount, customers.name
     FROM invoices
     JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

	return data;
 }

// Export a GET handler for the route
export async function GET(req: NextRequest) {
  try {
    const invoices = await listInvoices();
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
