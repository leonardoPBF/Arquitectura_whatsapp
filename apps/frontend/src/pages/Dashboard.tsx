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
import { useIsFetching } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';

export default function Dashboard() {
  const loadingQueries = useIsFetching({
    predicate: query => query.state.data === undefined,
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
              Resumen de LUMINA y análisis de datos
            </p>
          </div>
        </div>

        {loadingQueries > 0 && (
          <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-card p-4 text-emerald-800 dark:border-emerald-800 dark:bg-card dark:text-emerald-200">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none" />
            <p>Cargando datos del dashboard...</p>
          </div>
        )}

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

