'use client';

import { useState } from 'react';

export default function TestAPI() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const testAPI = async (endpoint, method = 'GET', body = null) => {
        setLoading(true);
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(endpoint, options);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            setResults({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">API Testing Page</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => testAPI('/api/businesses')}
                    className="bg-blue-500 text-white p-4 rounded hover:bg-blue-600"
                >
                    Get All Businesses
                </button>

                <button
                    onClick={() => testAPI('/api/incentives')}
                    className="bg-green-500 text-white p-4 rounded hover:bg-green-600"
                >
                    Get All Incentives
                </button>

                <button
                    onClick={() => testAPI('/api/search?q=restaurant&city=Cedar Rapids')}
                    className="bg-purple-500 text-white p-4 rounded hover:bg-purple-600"
                >
                    Search: Restaurants in Cedar Rapids
                </button>

                <button
                    onClick={() => testAPI('/api/search?serviceType=VT')}
                    className="bg-red-500 text-white p-4 rounded hover:bg-red-600"
                >
                    Search: Veteran Incentives
                </button>
            </div>

            {loading && <p>Loading...</p>}

            {results && (
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="text-xl font-bold mb-4">Results:</h2>
                    <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
                </div>
            )}
        </div>
    );
}