import { motion } from 'framer-motion';

const STEPS = [
  { key: 'pending', label: 'Placed', icon: '📝' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '📦' },
];

const statusOrder = { pending: 0, confirmed: 1, out_for_delivery: 2, delivered: 3 };

export default function StepTracker({ currentStatus }) {
  const currentIdx = statusOrder[currentStatus] ?? 0;

  return (
    <div className="flex flex-col gap-0">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-start gap-4">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border-2 transition-all ${
                  done
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                } ${active ? 'ring-4 ring-primary-200' : ''}`}
              >
                {step.icon}
              </motion.div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    i < currentIdx ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            {/* Text */}
            <div className="pt-2">
              <p
                className={`font-semibold text-sm ${
                  done ? 'text-primary-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {active && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-primary-500 mt-0.5"
                >
                  Current status
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
