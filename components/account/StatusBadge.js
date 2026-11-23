// Small colored label for an order status (same chip style as the rest of the site)
const STYLES = {
  pending_payment: ['Awaiting payment', 'bg-gold/20 text-brown'],
  paid: ['Paid', 'bg-forest/10 text-forest'],
  processing: ['Processing', 'bg-forest/10 text-forest'],
  shipped: ['Shipped', 'bg-forest/15 text-forest'],
  delivered: ['Delivered', 'bg-forest text-cream'],
  cancelled: ['Cancelled', 'bg-terracotta/10 text-terracotta'],
};

export default function StatusBadge({ status }) {
  const [label, style] = STYLES[status] || [status, 'bg-beige text-brown/70'];
  return <span className={`text-xs rounded-full px-3 py-1.5 whitespace-nowrap ${style}`}>{label}</span>;
}
