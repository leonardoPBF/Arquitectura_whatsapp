import { Navbar } from '@/components/Navbar';
import { Chatbot } from '@/components/Chatbot';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TopCustomersChart } from '@/components/dashboard/TopCustomersChart';
import { AbandonedCartsChart } from '@/components/dashboard/AbandonedCartsChart';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OrdersStatusChart } from '@/components/dashboard/OrdersStatusChart';
import { PaymentMethodsChart } from '@/components/dashboard/PaymentMethodsChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { PaymentStatusChart } from '@/components/dashboard/PaymentStatusChart';

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Resumen de tu negocio y análisis de datos
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Revenue Chart - Full width on large screens */}
          <div className="md:col-span-2">
            <RevenueChart />
          </div>

          {/* Orders Status Chart */}
          <div>
            <OrdersStatusChart />
          </div>

          {/* Top Customers Chart - Full width */}
          <div className="md:col-span-2">
            <TopCustomersChart />
          </div>

          {/* Abandoned Carts */}
          <div>
            <AbandonedCartsChart />
          </div>

          {/* Top Products Chart - Full width */}
          <div className="md:col-span-2">
            <TopProductsChart />
          </div>

          {/* Payment Status */}
          <div>
            <PaymentStatusChart />
          </div>

          {/* Payment Methods Chart */}
          <div className="md:col-span-2 lg:col-span-1">
            <PaymentMethodsChart />
          </div>
        </div>

        {/* Chatbot Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="h-[600px]">
              <Chatbot />
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

