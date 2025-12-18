// Loading Skeleton Components for Professional Loading States

// Generic Skeleton Pulse
export const SkeletonPulse = ({ className = '' }) => (
    <div className={`bg-gray-200 animate-pulse rounded ${className}`}></div>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
            <SkeletonPulse className="w-10 h-10 rounded-lg" />
            <SkeletonPulse className="h-5 w-32" />
        </div>
        <div className="space-y-3">
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-4 w-5/6" />
        </div>
    </div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({ cols = 4 }) => (
    <tr className="border-b border-gray-100">
        {Array(cols).fill(0).map((_, i) => (
            <td key={i} className="py-4 px-4">
                <SkeletonPulse className="h-4 w-full" />
            </td>
        ))}
    </tr>
);

// Full Page Loading Spinner
export const PageLoadingSpinner = ({ message = 'Loading...' }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">{message}</p>
        </div>
    </div>
);

// Content Loading with Shimmer Effect
export const ContentLoadingSkeleton = () => (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <SkeletonPulse className="h-8 w-48" />
                <SkeletonPulse className="h-4 w-32" />
            </div>
            <SkeletonPulse className="h-10 w-28 rounded-lg" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <SkeletonPulse className="h-6 w-32" />
            </div>
            <table className="w-full">
                <tbody>
                    <TableRowSkeleton cols={5} />
                    <TableRowSkeleton cols={5} />
                    <TableRowSkeleton cols={5} />
                </tbody>
            </table>
        </div>
    </div>
);

// Button Loading State
export const ButtonLoading = ({ children, loading, className = '', ...props }) => (
    <button
        disabled={loading}
        className={`relative ${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        {...props}
    >
        {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            </span>
        )}
        <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
);

// Inline Loading Dots
export const LoadingDots = () => (
    <span className="inline-flex gap-1">
        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </span>
);

export default {
    SkeletonPulse,
    DashboardCardSkeleton,
    TableRowSkeleton,
    PageLoadingSpinner,
    ContentLoadingSkeleton,
    ButtonLoading,
    LoadingDots
};
