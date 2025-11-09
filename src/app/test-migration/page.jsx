'use client';
import { useState } from 'react';

export default function TestMigrationPage() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const runMigration = async () => {
        if (!confirm('Are you sure you want to run the migration? This will update your database.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/migrate-incentives', {
                method: 'POST'
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1>Incentive Migration Tool</h1>
                <p>This will migrate all incentives from the old <code>type</code> field to the new <code>eligible_categories</code> array.</p>

                <button
                        onClick={runMigration}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: loading ? '#6c757d' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            marginTop: '20px'
                        }}
                >
                    {loading ? 'Running Migration...' : 'Run Migration'}
                </button>

                {result && (
                        <div style={{ marginTop: '30px' }}>
                            <h2>Migration Results:</h2>
                            <div style={{
                                padding: '20px',
                                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                                borderRadius: '4px',
                                marginBottom: '20px'
                            }}>
                                {result.summary && (
                                        <>
                                            <p><strong>Total Incentives:</strong> {result.summary.total}</p>
                                            <p><strong>Migrated:</strong> {result.summary.migrated}</p>
                                            <p><strong>Skipped (already migrated):</strong> {result.summary.skipped}</p>
                                            <p><strong>Errors:</strong> {result.summary.errors}</p>
                                        </>
                                )}
                                {result.error && (
                                        <p style={{ color: '#721c24' }}><strong>Error:</strong> {result.error}</p>
                                )}
                            </div>

                            {result.logs && (
                                    <div style={{
                                        backgroundColor: '#f8f9fa',
                                        padding: '20px',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        maxHeight: '600px',
                                        overflowY: 'auto'
                                    }}>
                                        <h3>Detailed Log:</h3>
                                        {result.logs.map((log, index) => (
                                                <div key={index}>{log}</div>
                                        ))}
                                    </div>
                            )}
                        </div>
                )}
            </div>
    );
}