import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    metrics: {
      todayRevenue: 45600,
      totalProducts: 142,
      lowStockCount: 8,
      pendingUdhaar: 12500,
    },
    revenueData: [
      { day: 'Mon', revenue: 32000 },
      { day: 'Tue', revenue: 45000 },
      { day: 'Wed', revenue: 38000 },
      { day: 'Thu', revenue: 51000 },
      { day: 'Fri', revenue: 42000 },
      { day: 'Sat', revenue: 60000 },
      { day: 'Sun', revenue: 45600 },
    ],
    topSellers: [
      { id: '1', name: 'Cooking Oil 5L', sold: 45, revenue: 40500 },
      { id: '2', name: 'Flour 10kg', sold: 30, revenue: 36000 },
      { id: '3', name: 'Sugar 1kg', sold: 120, revenue: 16800 },
      { id: '4', name: 'Tea 800g', sold: 25, revenue: 23750 },
      { id: '5', name: 'Milk 1L', sold: 80, revenue: 20000 },
    ],
    lowStock: [
      { id: '101', name: 'Salt 800g', stock: 2, threshold: 10 },
      { id: '102', name: 'Dates 1kg', stock: 1, threshold: 5 },
      { id: '103', name: 'Basmati Rice 5kg', stock: 3, threshold: 8 },
      { id: '104', name: 'Spices Mix', stock: 4, threshold: 12 },
    ]
  };

  return NextResponse.json(data);
}
