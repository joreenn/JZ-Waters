/**
 * Reusable Loading Spinner component
 */
export default function LoadingSpinner({ size = 'md', text }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full ${sizes[size]} border-b-2 border-primary-600`}></div>
      {text && <p className="mt-3 text-sm text-gray-500">{text}</p>}
    </div>
  );
}
