import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"
      />
    </div>
  );
}
