'use client';
// file: /src/components/common/FavoriteButton.jsx v1 - Reusable favorite button component

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function FavoriteButton({ itemId, type, className = '', style = {} }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isFavorited, setIsFavorited] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            checkIfFavorited();
        }
    }, [status, itemId]);

    const checkIfFavorited = async () => {
        try {
            const response = await fetch(`/api/favorites?type=${type}s`);

            if (response.ok) {
                const data = await response.json();
                const favorites = data.favorites[`${type}s`] || [];
                const isFav = favorites.some(item => item._id === itemId);
                setIsFavorited(isFav);
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Require authentication
        if (status !== 'authenticated') {
            router.push('/auth/signin');
            return;
        }

        setLoading(true);

        try {
            if (isFavorited) {
                // Remove from favorites
                const response = await fetch(`/api/favorites?itemId=${itemId}&type=${type}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setIsFavorited(false);
                    setShowTooltip(true);
                    setTimeout(() => setShowTooltip(false), 2000);
                }
            } else {
                // Add to favorites
                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ itemId, type })
                });

                if (response.ok) {
                    setIsFavorited(true);
                    setShowTooltip(true);
                    setTimeout(() => setShowTooltip(false), 2000);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                        onClick={toggleFavorite}
                        disabled={loading}
                        className={className}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: isFavorited ? '#ffc107' : 'white',
                            color: isFavorited ? '#000' : '#666',
                            border: `2px solid ${isFavorited ? '#ffc107' : '#ddd'}`,
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1,
                            ...style
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                >
                <span style={{ fontSize: '16px' }}>
                    {isFavorited ? '⭐' : '☆'}
                </span>
                    {loading ? 'Saving...' : (isFavorited ? 'Favorited' : 'Add to Favorites')}
                </button>

                {/* Tooltip */}
                {showTooltip && (
                        <div style={{
                            position: 'absolute',
                            top: '-40px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#333',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            animation: 'fadeIn 0.2s'
                        }}>
                            {isFavorited ? 'Added to favorites!' : 'Removed from favorites'}
                            <div style={{
                                position: 'absolute',
                                bottom: '-5px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderTop: '5px solid #333'
                            }}></div>
                        </div>
                )}

                <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
            </div>
    );
}