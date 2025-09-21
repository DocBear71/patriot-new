'use client';
// file: /src/app/profile/page.jsx v2 - Updated to use NextAuth session instead of localStorage

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '../../components/layout/Navigation';

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState({
        _id: '',
        fname: '',
        lname: '',
        email: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        status: '',
        level: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        capital: false,
        number: false,
        special: false,
        match: false
    });

    // Fetch user profile when session is available
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            fetchUserProfile(session.user.id);
        }
    }, [status, session]);

    const fetchUserProfile = async (userId) => {
        try {
            const response = await fetch(`/api/user?operation=profile&userId=${userId}`);

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    setProfile(data.user);
                }
            } else {
                throw new Error('Failed to fetch profile');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));

        // Validate password if it's the new password field
        if (name === 'newPassword') {
            validatePassword(value);
        }

        // Check password match if it's confirm password
        if (name === 'confirmPassword' || name === 'newPassword') {
            const newPassword = name === 'newPassword' ? value : passwordForm.newPassword;
            const confirmPassword = name === 'confirmPassword' ? value : passwordForm.confirmPassword;

            setPasswordValidation(prev => ({
                ...prev,
                match: newPassword === confirmPassword && newPassword.length > 0
            }));
        }
    };

    const validatePassword = (password) => {
        setPasswordValidation({
            length: password.length >= 8,
            capital: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            match: password === passwordForm.confirmPassword && password.length > 0
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            console.log("Submitting profile:", profile);
            const response = await fetch('/api/user?operation=update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // Validate password
        const { length, capital, number, special, match } = passwordValidation;
        if (!length || !capital || !number || !special || !match) {
            setMessage({ type: 'error', text: 'Please ensure your password meets all requirements and passwords match' });
            return;
        }

        setIsUpdating(true);

        try {
            const response = await fetch('/api/user?operation=password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: profile._id,
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setShowPasswordForm(false);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setPasswordValidation({
                    length: false,
                    capital: false,
                    number: false,
                    special: false,
                    match: false
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    // States for US
    const states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    // Status options
    const statusOptions = [
        'Active Military',
        'Veteran',
        'Military Family',
        'Supporter'
    ];

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
                <div style={{ paddingTop: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Loading profile...</div>
                </div>
        );
    }

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        return (
                <div style={{ paddingTop: '70px' }} id="page_layout">
                    <Navigation />
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeeba',
                            borderRadius: '4px',
                            padding: '15px',
                            margin: '20px auto',
                            maxWidth: '600px'
                        }}>
                            <h3>You must be logged in to view this page.</h3>
                            <button
                                    onClick={() => router.push('/auth/signin')}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginTop: '10px'
                                    }}
                            >
                                Login Here
                            </button>
                        </div>
                    </div>
                </div>
        );
    }

    return (
            <div style={{ paddingTop: '70px' }} id="page_layout">
                <Navigation />

                <header style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ marginRight: '20px' }}>
                            <img
                                    src="/images/patriotthankslogo6-13-2025.png"
                                    alt="Patriot Thanks logo"
                                    style={{ height: '60px' }}
                            />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: '#003366' }}>Patriot Thanks</h1>
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>My Profile</h4>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ color: '#003366', marginBottom: '10px' }}>My Profile Information</h2>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        View and update your profile information below. Fields marked with a red outline are required to be filled out.
                    </p>

                    {message.text && (
                            <div style={{
                                padding: '15px',
                                marginBottom: '20px',
                                borderRadius: '4px',
                                backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                                border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                                color: message.type === 'success' ? '#155724' : '#721c24'
                            }}>
                                {message.text}
                            </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
                        {/* Profile Form */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <form onSubmit={handleProfileSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            First Name *
                                        </label>
                                        <input
                                                type="text"
                                                name="fname"
                                                value={profile.fname}
                                                onChange={handleInputChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '16px'
                                                }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Last Name *
                                        </label>
                                        <input
                                                type="text"
                                                name="lname"
                                                value={profile.lname}
                                                onChange={handleInputChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '16px'
                                                }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Email Address
                                    </label>
                                    <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '16px',
                                                backgroundColor: '#f8f9fa',
                                                color: '#6c757d'
                                            }}
                                    />
                                    <small style={{ color: '#666' }}>Email address cannot be changed</small>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Address Line 1 *
                                    </label>
                                    <input
                                            type="text"
                                            name="address1"
                                            value={profile.address1}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '16px'
                                            }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Address Line 2
                                    </label>
                                    <input
                                            type="text"
                                            name="address2"
                                            value={profile.address2}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '16px'
                                            }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            City *
                                        </label>
                                        <input
                                                type="text"
                                                name="city"
                                                value={profile.city}
                                                onChange={handleInputChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '16px'
                                                }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            State *
                                        </label>
                                        <select
                                                name="state"
                                                value={profile.state}
                                                onChange={handleInputChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '16px'
                                                }}
                                        >
                                            <option value="">Select State</option>
                                            {states.map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            ZIP Code *
                                        </label>
                                        <input
                                                type="text"
                                                name="zip"
                                                value={profile.zip}
                                                onChange={handleInputChange}
                                                required
                                                pattern="[0-9]{5}(-[0-9]{4})?"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '16px'
                                                }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Military Status *
                                    </label>
                                    <select
                                            name="status"
                                            value={profile.status}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '16px'
                                            }}
                                    >
                                        <option value="">Select Status</option>
                                        {statusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Membership Level
                                    </label>
                                    <input
                                            type="text"
                                            value={profile.level || 'Free'}
                                            disabled
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '16px',
                                                backgroundColor: '#f8f9fa',
                                                color: '#6c757d'
                                            }}
                                    />
                                    <small style={{ color: '#666' }}>Contact support to upgrade your membership</small>
                                </div>

                                <button
                                        type="submit"
                                        disabled={isUpdating}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: isUpdating ? '#6c757d' : '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            marginRight: '10px'
                                        }}
                                >
                                    {isUpdating ? 'Updating...' : 'Update Profile'}
                                </button>

                                <button
                                        type="button"
                                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            fontWeight: 'bold'
                                        }}
                                >
                                    Change Password
                                </button>
                            </form>
                        </div>

                        {/* Sidebar */}
                        <div>
                            {/* Password Change Form */}
                            {showPasswordForm && (
                                    <div style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        marginBottom: '20px'
                                    }}>
                                        <h4 style={{ marginBottom: '15px' }}>Change Password</h4>
                                        <form onSubmit={handlePasswordSubmit}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Current Password
                                                </label>
                                                <input
                                                        type="password"
                                                        name="currentPassword"
                                                        value={passwordForm.currentPassword}
                                                        onChange={handlePasswordInputChange}
                                                        required
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            fontSize: '14px'
                                                        }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    New Password
                                                </label>
                                                <input
                                                        type="password"
                                                        name="newPassword"
                                                        value={passwordForm.newPassword}
                                                        onChange={handlePasswordInputChange}
                                                        required
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            fontSize: '14px'
                                                        }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Confirm New Password
                                                </label>
                                                <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={handlePasswordInputChange}
                                                        required
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            fontSize: '14px'
                                                        }}
                                                />
                                            </div>

                                            {/* Password Requirements */}
                                            <div style={{ marginBottom: '15px', fontSize: '12px' }}>
                                                <div style={{ color: passwordValidation.length ? '#28a745' : '#dc3545' }}>
                                                    {passwordValidation.length ? '✓' : '✗'} At least 8 characters
                                                </div>
                                                <div style={{ color: passwordValidation.capital ? '#28a745' : '#dc3545' }}>
                                                    {passwordValidation.capital ? '✓' : '✗'} One uppercase letter
                                                </div>
                                                <div style={{ color: passwordValidation.number ? '#28a745' : '#dc3545' }}>
                                                    {passwordValidation.number ? '✓' : '✗'} One number
                                                </div>
                                                <div style={{ color: passwordValidation.special ? '#28a745' : '#dc3545' }}>
                                                    {passwordValidation.special ? '✓' : '✗'} One special character
                                                </div>
                                                <div style={{ color: passwordValidation.match ? '#28a745' : '#dc3545' }}>
                                                    {passwordValidation.match ? '✓' : '✗'} Passwords match
                                                </div>
                                            </div>

                                            <button
                                                    type="submit"
                                                    disabled={isUpdating}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        backgroundColor: isUpdating ? '#6c757d' : '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                        fontWeight: 'bold',
                                                        marginBottom: '10px'
                                                    }}
                                            >
                                                {isUpdating ? 'Updating...' : 'Update Password'}
                                            </button>

                                            <button
                                                    type="button"
                                                    onClick={() => setShowPasswordForm(false)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    </div>
                            )}

                            {/* Profile Info Card */}
                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <h4 style={{ marginBottom: '15px' }}>Profile Summary</h4>
                                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Name:</strong> {profile.fname} {profile.lname}
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Email:</strong> {profile.email}
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Status:</strong> {profile.status}
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Level:</strong> {profile.level || 'Free'}
                                    </div>
                                    <div>
                                        <strong>Location:</strong> {profile.city}, {profile.state}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
    );
}