import { motion } from 'framer-motion';

export default function LoyaltyCard({ points = 320, nextTier = 2000, tier = 'Silver', perks = [] }) {
  const pct = Math.min((points / nextTier) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl max-w-md w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-primary-200 font-semibold uppercase tracking-wide">{tier} Member</p>
          <p className="font-heading text-3xl font-bold mt-1">{points} pts</p>
        </div>
        <span className="text-5xl">⭐</span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-primary-200 mb-1">
          <span>Progress to Gold</span>
          <span>{points} / {nextTier}</span>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gold rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Perks */}
      {perks.length > 0 && (
        <ul className="mt-5 space-y-2">
          {perks.map((perk, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-primary-100">
              <span className="text-gold mt-0.5">✓</span>
              {perk}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
