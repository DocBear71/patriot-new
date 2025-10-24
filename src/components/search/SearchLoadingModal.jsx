'use client';

// file: /src/components/search/SearchLoadingModal.jsx v1 - Loading modal for business search

import { useEffect } from 'react';

export default function SearchLoadingModal({
                                               isVisible,
                                               currentStep = 1,
                                               progress = 0,
                                               message = 'Please wait while we find the best results...',
                                               onCancel
                                           }) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isVisible]);

    if (!isVisible) return null;

    const steps = [
        { icon: '📍', label: 'Processing Location', number: 1 },
        { icon: '🏢', label: 'Searching Database', number: 2 },
        { icon: '🌐', label: 'Finding Additional Locations', number: 3 },
        { icon: '📊', label: 'Organizing Results', number: 4 }
    ];

    return (
            <div className="patriot-loading-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isVisible ? 1 : 0,
                visibility: isVisible ? 'visible' : 'hidden',
                transition: 'opacity 0.3s ease, visibility 0.3s ease'
            }}>
                {/* Backdrop */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)'
                }} />

                {/* Loading Container */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '400px',
                    width: '90%',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                    transition: 'transform 0.3s ease'
                }}>
                    <div style={{
                        padding: '40px 30px 30px',
                        textAlign: 'center'
                    }}>
                        {/* Logo */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                margin: '0 auto',
                                borderRadius: '50%',
                                background: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '30px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}>
                                🦅
                            </div>
                        </div>

                        {/* Spinner Animation */}
                        <div style={{
                            position: 'relative',
                            width: '80px',
                            height: '80px',
                            margin: '20px auto'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid #e3f2fd',
                                borderTop: '4px solid #2196f3',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                position: 'absolute',
                                top: '10px',
                                left: '10px'
                            }} />
                            <div style={{
                                width: '80px',
                                height: '80px',
                                border: '2px solid transparent',
                                borderTop: '2px solid #4caf50',
                                borderRight: '2px solid #4caf50',
                                borderRadius: '50%',
                                animation: 'spin 2s linear infinite reverse',
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }} />
                        </div>

                        {/* Loading Text */}
                        <div style={{ margin: '20px 0' }}>
                            <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#1976d2'
                            }}>
                                Searching for Businesses
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#666',
                                lineHeight: '1.5'
                            }}>
                                {message}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div style={{
                            margin: '25px 0',
                            textAlign: 'left'
                        }}>
                            <div style={{
                                height: '8px',
                                background: '#e0e0e0',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)',
                                    width: `${progress}%`,
                                    transition: 'width 0.3s ease',
                                    borderRadius: '10px'
                                }} />
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                color: '#666'
                            }}>
                                <span>Step {currentStep} of 4</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                        </div>

                        {/* Loading Steps */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '10px',
                            margin: '20px 0'
                        }}>
                            {steps.map((step) => (
                                    <div
                                            key={step.number}
                                            style={{
                                                padding: '12px 8px',
                                                background: currentStep >= step.number ? '#e3f2fd' : '#f5f5f5',
                                                borderRadius: '8px',
                                                border: currentStep === step.number ? '2px solid #2196f3' : '2px solid transparent',
                                                transition: 'all 0.3s ease',
                                                opacity: currentStep >= step.number ? 1 : 0.5
                                            }}
                                    >
                                        <div style={{
                                            fontSize: '24px',
                                            marginBottom: '4px'
                                        }}>
                                            {step.icon}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: currentStep >= step.number ? '#1976d2' : '#666',
                                            fontWeight: currentStep === step.number ? 600 : 400,
                                            lineHeight: '1.2'
                                        }}>
                                            {step.label}
                                        </div>
                                    </div>
                            ))}
                        </div>

                        {/* Cancel Button */}
                        {onCancel && (
                                <div style={{ marginTop: '20px' }}>
                                    <button
                                            onClick={onCancel}
                                            style={{
                                                padding: '10px 24px',
                                                background: 'transparent',
                                                border: '1px solid #ccc',
                                                borderRadius: '6px',
                                                color: '#666',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.background = '#f5f5f5';
                                                e.target.style.borderColor = '#999';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.background = 'transparent';
                                                e.target.style.borderColor = '#ccc';
                                            }}
                                    >
                                        Cancel Search
                                    </button>
                                </div>
                        )}
                    </div>
                </div>

                {/* Inline Keyframes */}
                <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            </div>
    );
}