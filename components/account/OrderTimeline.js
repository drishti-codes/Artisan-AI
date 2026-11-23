import { Check } from 'lucide-react';
import { formatDate } from './format';

const STEPS = [
  ['paid', 'Paid'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
];

// Shows how far the order has come, with the date of each step
export default function OrderTimeline({ history = [] }) {
  const reached = {};
  history.forEach((h) => {
    reached[h.status] = h.at;
  });

  return (
    <div className="flex items-start">
      {STEPS.map(([key, label], i) => {
        const done = Boolean(reached[key]);
        const lineDone = i > 0 && done;
        return (
          <div key={key} className="flex-1 flex flex-col items-center relative">
            {i > 0 && <div className={`absolute top-4 right-1/2 w-full h-px ${lineDone ? 'bg-forest' : 'bg-brown/15'}`} />}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border ${done ? 'bg-forest text-cream border-forest' : 'hairline bg-cream text-brown/30'}`}>
              {done ? <Check size={15} /> : <span className="text-xs">{i + 1}</span>}
            </div>
            <p className={`text-xs mt-2 ${done ? 'text-brown' : 'text-brown/40'}`}>{label}</p>
            <p className="text-xs text-brown/45 mt-0.5 h-4">{done ? formatDate(reached[key]) : ''}</p>
          </div>
        );
      })}
    </div>
  );
}
