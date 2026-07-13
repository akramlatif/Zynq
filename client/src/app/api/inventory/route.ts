import { NextResponse } from 'next/server';

// In-memory mock data store for demo purposes
let products = [
  { id: '1', name: 'Cooking Oil 5L', category: 'Grocery', qty: 45, price: 4500, threshold: 10, expiry: '2026-12-31', barcode: '1234567890123' },
  { id: '2', name: 'Flour 10kg', category: 'Grocery', qty: 30, price: 1200, threshold: 15, expiry: '2025-06-30', barcode: '2345678901234' },
  { id: '3', name: 'Sugar 1kg', category: 'Grocery', qty: 15, price: 140, threshold: 20, expiry: '2027-01-01', barcode: '3456789012345' },
  { id: '4', name: 'Tea 800g', category: 'Beverages', qty: 25, price: 950, threshold: 10, expiry: '2025-08-15', barcode: '4567890123456' },
  { id: '5', name: 'Salt 800g', category: 'Grocery', qty: 2, price: 50, threshold: 10, expiry: '2028-01-01', barcode: '5678901234567' },
  { id: '6', name: 'Dates 1kg', category: 'Snacks', qty: 1, price: 800, threshold: 5, expiry: '2025-02-28', barcode: '6789012345678' },
];

export async function GET() {
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newProduct = {
      ...data,
      id: Date.now().toString(),
    };
    products.push(newProduct);
    return NextResponse.json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const index = products.findIndex((p) => p.id === data.id);
    if (index !== -1) {
      products[index] = { ...products[index], ...data };
      return NextResponse.json({ message: 'Product updated', product: products[index] });
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
