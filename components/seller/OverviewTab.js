import { formatINR } from '@/lib/data';

export default function OverviewTab({ products, orders, inventory, goTo }) {
  const activeProducts = products.filter((p) => p.isActive).length;
  const revenue = orders.filter((o) => !['cancelled', 'pending_payment'].includes(o.status)).reduce((sum, o) => sum + o.sellerTotal, 0);
  const lowStock = inventory.filter((i) => i.isActive && i.lowStock);
  const toProcess = orders.filter((o) => o.status === 'paid').length;
  const toShip = orders.filter((o) => o.status === 'processing').length;
  const bestSellers = [...inventory].sort((a, b) => b.soldCount - a.soldCount).filter((i) => i.soldCount > 0).slice(0, 3);

  const stats = [
    ['Active products', activeProducts],
    ['Orders', orders.length],
    ['Sales', formatINR(revenue)],
    ['Low stock items', lowStock.length],
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map(([label, value]) => (
          <div key={label} className="border hairline rounded-sm p-6">
            <p className="text-sm text-brown/55">{label}</p>
            <p className="font-display text-3xl text-brown mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="border hairline rounded-sm p-6">
          <h2 className="font-display text-xl text-brown mb-5">Needs your attention</h2>
          <div className="space-y-4 text-sm">
            {toProcess === 0 && toShip === 0 && lowStock.length === 0 && <p className="text-brown/55">All caught up. Nothing needs attention right now.</p>}
            {toProcess > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-brown/70">{toProcess} new {toProcess === 1 ? 'order' : 'orders'} to process</span>
                <button onClick={() => goTo('orders')} className="text-terracotta hover:underline underline-offset-4">View orders</button>
              </div>
            )}
            {toShip > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-brown/70">{toShip} {toShip === 1 ? 'order' : 'orders'} ready to ship</span>
                <button onClick={() => goTo('orders')} className="text-terracotta hover:underline underline-offset-4">View orders</button>
              </div>
            )}
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-brown/70">{item.name} — only {item.stock} left</span>
                <button onClick={() => goTo('inventory')} className="text-terracotta hover:underline underline-offset-4">Update stock</button>
              </div>
            ))}
          </div>
        </div>

        <div className="border hairline rounded-sm p-6">
          <h2 className="font-display text-xl text-brown mb-5">Best sellers</h2>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-brown/55">No sales yet. Your best-selling products will show up here.</p>
          ) : (
            <div className="space-y-4 text-sm">
              {bestSellers.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-brown/70">{i + 1}. {item.name}</span>
                  <span className="text-xs bg-forest/10 text-forest rounded-full px-3 py-1.5">{item.soldCount} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
