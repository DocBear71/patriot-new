// file: src/hooks/useAdminAuth.js
// Custom hook for admin authentication - use this in all admin pages

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAdminAuth() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAdminAccess();
    }, [session, status]);

    const checkAdminAccess = () => {
        // Wait for session to load
        if (status === 'loading') {
            return;
        }

        // Check if user is authenticated
        if (!session || !session.user) {
            console.log('No session found, redirecting to signin');
            router.push('/auth/signin');
            setIsLoading(false);
            return;
        }

        // Check if user is admin
        if (!session.user.isAdmin && session.user.level !== 'Admin') {
            console.log('User is not admin, access denied');
            alert('Admin access required');
            router.push('/');
            setIsLoading(false);
            return;
        }

        console.log('✅ Admin access verified for:', session.user.email);
        setIsAdmin(true);
        setIsLoading(false);
    };

    return {
        session,
        isAdmin,
        isLoading: status === 'loading' || isLoading,
        user: session?.user
    };
}

// Example usage in any admin component:
/*
import { useAdminAuth } from '../hooks/useAdminAuth';

function AdminBusinessPage() {
    const { session, isAdmin, isLoading, user } = useAdminAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return null; // Will redirect automatically
    }

    return (
        <div>
            <h1>Admin Business Management</h1>
            <p>Welcome, {user.fname} {user.lname}!</p>
        </div>
    );
}
*/