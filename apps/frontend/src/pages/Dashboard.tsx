import { Navbar } from '@/components/Navbar';
import { Chatbot } from '@/components/Chatbot';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TopCustomersChart } from '@/components/dashboard/TopCustomersChart';
import { AbandonedCartsChart } from '@/components/dashboard/AbandonedCartsChart';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OrdersStatusChart } from '@/components/dashboard/OrdersStatusChart';
import { PaymentMethodsChart } from '@/components/dashboard/PaymentMethodsChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { ProductStockChart } from '@/components/dashboard/ProductStockChart';
import { PaymentStatusChart } from '@/components/dashboard/PaymentStatusChart';

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-[hsl(200_20%_12%)] dark:via-[hsl(200_18%_14%)] dark:to-[hsl(200_15%_16%)] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#10B981] to-[#14B8A6] bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
              Resumen de LUMINA y análisis de datos
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

          {/* Product Stock Chart */}
          <div>
            <ProductStockChart />
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

