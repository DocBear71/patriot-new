'use client';

// file: src/components/badges/VeteranOwnedBadge.jsx v1 - Veteran-owned business badge component

export default function VeteranOwnedBadge({
                                              verificationStatus = 'self_attested',
                                              size = 'md',
                                              showLabel = true,
                                              className = ''
                                          }) {
    const sizes = {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base'
    };

    const badges = {
        self_attested: {
            icon: '🇺🇸',
            label: 'Veteran-Owned',
            color: 'bg-blue-600',
            textColor: 'text-blue-600',
            tooltip: 'Self-attested veteran-owned business'
        },
        verified: {
            icon: '✓',
            label: 'Verified Veteran-Owned',
            color: 'bg-green-600',
            textColor: 'text-green-600',
            tooltip: 'Verified veteran-owned business'
        },
        certified: {
            icon: '⭐',
            label: 'Certified Veteran-Owned',
            color: 'bg-red-600',
            textColor: 'text-red-600',
            tooltip: 'SBA Certified Veteran-Owned Small Business'
        }
    };

    const badge = badges[verificationStatus] || badges.self_attested;

    return (
            <div
                    className={`inline-flex items-center gap-2 ${className}`}
                    title={badge.tooltip}
            >
                <div
                        className={`${sizes[size]} ${badge.color} text-white rounded-full flex items-center justify-center font-bold shadow-md`}
                >
                    <span>{badge.icon}</span>
                </div>
                {showLabel && (
                        <span className={`font-semibold ${badge.textColor}`}>
                    {badge.label}
                </span>
                )}
            </div>
    );
}