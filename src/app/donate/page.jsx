'use client';
// file: /src/app/donate/page.jsx v3 - Real PayPal and Stripe integration

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Navigation from '../../components/layout/Navigation';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// PayPal configuration
const paypalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
};

// Card Element styles to match your design
const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            fontFamily: 'Arial, sans-serif',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
    hidePostalCode: true,
};

// Main donation form component
function DonationForm() {
    const router = useRouter();
    const { data: session } = useSession();
    const stripe = useStripe();
    const elements = useElements();

    const [selectedAmount, setSelectedAmount] = useState(25);
    const [customAmount, setCustomAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('paypal');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Donor form state
    const [donorForm, setDonorForm] = useState({
        name: '',
        email: '',
        anonymous: false,
        recurring: false,
        message: '',
        showOnRecognitionPage: true,
        showAmount: false
    });

    // Predefined donation amounts
    const donationAmounts = [5, 10, 25, 50, 100, 250];

    useEffect(() => {
        if (session?.user) {
            setDonorForm(prev => ({
                ...prev,
                name: `${session.user.fname} ${session.user.lname}`,
                email: session.user.email
            }));
        }
    }, [session]);

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (e) => {
        const value = e.target.value;
        setCustomAmount(value);
        if (value && !isNaN(value) && parseFloat(value) > 0) {
            setSelectedAmount(parseFloat(value));
        }
    };

    const handleDonorFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDonorForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateDonationForm = () => {
        const errors = [];

        // Check amount
        if (!selectedAmount || selectedAmount <= 0) {
            errors.push('Please select or enter a valid donation amount');
        }

        if (selectedAmount < 1) {
            errors.push('Minimum donation amount is $1.00');
        }

        // Check required donor info
        if (!donorForm.name.trim()) errors.push('Name is required');
        if (!donorForm.email.trim()) errors.push('Email is required');

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (donorForm.email && !emailRegex.test(donorForm.email)) {
            errors.push('Please enter a valid email address');
        }

        return errors;
    };

    // Handle Stripe payment
    const handleStripePayment = async () => {
        if (!stripe || !elements) {
            setMessage({ type: 'error', text: 'Payment system not ready. Please try again.' });
            return false;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setMessage({ type: 'error', text: 'Card element not found. Please refresh the page.' });
            return false;
        }

        try {
            // Create payment intent
            const response = await fetch('/api/donations?operation=create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: selectedAmount,
                    currency: 'usd',
                    name: donorForm.name,
                    email: donorForm.email,
                    recurring: donorForm.recurring,
                    metadata: {
                        anonymous: donorForm.anonymous,
                        message: donorForm.message,
                        donorName: donorForm.name,
                        donorEmail: donorForm.email
                    }
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create payment intent');
            }

            // Confirm payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: donorForm.name,
                        email: donorForm.email,
                    },
                },
            });

            if (error) {
                console.error('Payment failed:', error);
                setMessage({ type: 'error', text: error.message });
                return false;
            }

            if (paymentIntent.status === 'succeeded') {
                // Save donation to database
                await saveDonationToDatabase({
                    ...donorForm,
                    amount: selectedAmount,
                    paymentMethod: 'stripe',
                    paymentIntentId: paymentIntent.id,
                    transactionId: paymentIntent.id,
                    status: 'completed'
                });
                return true;
            } else {
                setMessage({ type: 'error', text: 'Payment was not completed successfully.' });
                return false;
            }
        } catch (error) {
            console.error('Stripe payment error:', error);
            setMessage({ type: 'error', text: error.message || 'Payment processing failed' });
            return false;
        }
    };

    // Save donation to database
    const saveDonationToDatabase = async (donationData) => {
        try {
            const response = await fetch('/api/donations?operation=save-donation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(donationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to save donation:', errorData);
            }
        } catch (error) {
            console.error('Error saving donation to database:', error);
        }
    };

    const handleDonationSubmit = async (e) => {
        e.preventDefault();

        const errors = validateDonationForm();
        if (errors.length > 0) {
            setMessage({ type: 'error', text: errors.join('. ') });
            return;
        }

        if (paymentMethod === 'card') {
            setIsProcessing(true);
            setMessage({ type: '', text: '' });

            const success = await handleStripePayment();

            setIsProcessing(false);

            if (success) {
                setShowSuccess(true);
            }
        }
        // PayPal is handled by the PayPalButtons component
    };

    // PayPal payment handlers
    const createPayPalOrder = async () => {
        const errors = validateDonationForm();
        if (errors.length > 0) {
            setMessage({ type: 'error', text: errors.join('. ') });
            throw new Error('Form validation failed');
        }

        try {
            const response = await fetch('/api/donations?operation=create-paypal-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: selectedAmount,
                    name: donorForm.name,
                    email: donorForm.email,
                    anonymous: donorForm.anonymous,
                    recurring: donorForm.recurring,
                    message: donorForm.message
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create PayPal order');
            }

            return data.orderID;
        } catch (error) {
            console.error('PayPal order creation error:', error);
            setMessage({ type: 'error', text: error.message });
            throw error;
        }
    };

    const onPayPalApprove = async (data) => {
        setIsProcessing(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/donations?operation=capture-paypal-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderID: data.orderID,
                    amount: selectedAmount,
                    name: donorForm.name,
                    email: donorForm.email,
                    anonymous: donorForm.anonymous,
                    recurring: donorForm.recurring,
                    message: donorForm.message
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccess(true);
            } else {
                throw new Error(result.message || 'Payment capture failed');
            }
        } catch (error) {
            console.error('PayPal capture error:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const onPayPalError = (error) => {
        console.error('PayPal error:', error);
        setMessage({ type: 'error', text: 'PayPal payment failed. Please try again.' });
    };

    if (showSuccess) {
        return (
                <div style={{ paddingTop: '70px' }} id="page_layout">
                    <Navigation />

                    <main style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '40px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            border: '2px solid #28a745'
                        }}>
                            <div style={{ fontSize: '4rem', color: '#28a745', marginBottom: '20px' }}>
                                ✅
                            </div>
                            <h2 style={{ color: '#28a745', marginBottom: '20px' }}>
                                Thank You for Your Support!
                            </h2>
                            <h3 style={{ marginBottom: '20px' }}>
                                Your donation of ${selectedAmount.toFixed(2)} has been received
                            </h3>
                            <p style={{ fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6' }}>
                                Your support helps us continue connecting heroes with businesses that appreciate their service.
                            </p>

                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '20px',
                                borderRadius: '6px',
                                marginBottom: '30px'
                            }}>
                                <p style={{ margin: '0 0 10px 0' }}>
                                    A confirmation email has been sent to: <strong>{donorForm.email}</strong>
                                </p>
                                {donorForm.recurring && (
                                        <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff' }}>
                                            Your donation will recur monthly. You can cancel at any time by contacting us.
                                        </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                        onClick={() => router.push('/')}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            fontWeight: 'bold'
                                        }}
                                >
                                    Return to Home
                                </button>
                                <button
                                        onClick={() => router.push('/contact')}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: 'transparent',
                                            color: '#007bff',
                                            border: '2px solid #007bff',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            fontWeight: 'bold'
                                        }}
                                >
                                    Contact Us
                                </button>
                            </div>

                            <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#666' }}>
                                <p>Problem with your donation? Please <span
                                        style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => router.push('/contact')}
                                >contact us</span> for assistance.</p>
                            </div>
                        </div>
                    </main>
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
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>Support Our Mission</h4>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', marginBottom: '40px' }}>
                        {/* Mission Statement */}
                        <div>
                            <h2 style={{ color: '#003366', marginBottom: '20px' }}>Help Us Serve Those Who Serve</h2>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                                Patriot Thanks connects veterans, active-duty military, first responders, and their families
                                with businesses that offer special discounts and incentives. Your donation helps us maintain
                                and grow this valuable resource for our community.
                            </p>

                            <h4 style={{ color: '#003366', marginBottom: '15px' }}>Your Donation Helps Us:</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <ul style={{ lineHeight: '1.8' }}>
                                    <li>Cover hosting and operational costs</li>
                                    <li>Develop enhanced features and tools</li>
                                </ul>
                                <ul style={{ lineHeight: '1.8' }}>
                                    <li>Expand our database of participating businesses</li>
                                    <li>Improve the user experience for both heroes and businesses</li>
                                </ul>
                            </div>
                        </div>

                        {/* Quick PayPal Donation */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '30px',
                            borderRadius: '8px',
                            border: '2px solid #007bff'
                        }}>
                            <h5 style={{ color: '#007bff', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>⚡</span>
                                Quick PayPal Donation
                            </h5>
                            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
                                Make a quick ${selectedAmount} donation with PayPal.
                            </p>

                            {/* Quick PayPal Button */}
                            <div style={{ marginBottom: '15px' }}>
                                <PayPalButtons
                                        style={{
                                            layout: 'horizontal',
                                            color: 'gold',
                                            shape: 'rect',
                                            label: 'donate',
                                            height: 40
                                        }}
                                        createOrder={createPayPalOrder}
                                        onApprove={onPayPalApprove}
                                        onError={onPayPalError}
                                        disabled={isProcessing}
                                />
                            </div>

                            <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
                                For custom amounts and options, use the form below
                            </p>
                        </div>
                    </div>

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

                    {/* Donation Form */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '30px', color: '#003366' }}>Customize Your Donation</h3>

                        <form onSubmit={handleDonationSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                                {/* Amount Selection */}
                                <div>
                                    <h4 style={{ marginBottom: '20px' }}>Choose Amount:</h4>

                                    {/* Preset Amounts */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '10px',
                                        marginBottom: '20px'
                                    }}>
                                        {donationAmounts.map(amount => (
                                                <button
                                                        key={amount}
                                                        type="button"
                                                        onClick={() => handleAmountSelect(amount)}
                                                        style={{
                                                            padding: '12px',
                                                            border: '2px solid',
                                                            borderColor: selectedAmount === amount && !customAmount ? '#007bff' : '#ddd',
                                                            backgroundColor: selectedAmount === amount && !customAmount ? '#007bff' : 'white',
                                                            color: selectedAmount === amount && !customAmount ? 'white' : '#333',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            fontSize: '16px'
                                                        }}
                                                >
                                                    ${amount}
                                                </button>
                                        ))}
                                    </div>

                                    {/* Custom Amount */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                            Custom Amount ($):
                                        </label>
                                        <input
                                                type="number"
                                                value={customAmount}
                                                onChange={handleCustomAmountChange}
                                                min="1"
                                                step="0.01"
                                                placeholder="Enter amount"
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '2px solid #ddd',
                                                    borderRadius: '6px',
                                                    fontSize: '16px'
                                                }}
                                        />
                                    </div>
                                </div>

                                {/* Donor Information */}
                                <div>
                                    <h4 style={{ marginBottom: '20px' }}>Donor Information:</h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Name *
                                            </label>
                                            <input
                                                    type="text"
                                                    name="name"
                                                    value={donorForm.name}
                                                    onChange={handleDonorFormChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Email *
                                            </label>
                                            <input
                                                    type="email"
                                                    name="email"
                                                    value={donorForm.email}
                                                    onChange={handleDonorFormChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                    type="checkbox"
                                                    name="anonymous"
                                                    checked={donorForm.anonymous}
                                                    onChange={handleDonorFormChange}
                                                    style={{ marginRight: '8px' }}
                                            />
                                            Make my donation anonymous
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                    type="checkbox"
                                                    name="recurring"
                                                    checked={donorForm.recurring}
                                                    onChange={handleDonorFormChange}
                                                    style={{ marginRight: '8px' }}
                                            />
                                            Make this a monthly donation
                                        </label>
                                    </div>

                                    {/* NEW SECTION: Recognition page options */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '15px',
                                        marginBottom: '15px',
                                        padding: '15px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '6px'
                                    }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                    type="checkbox"
                                                    name="showOnRecognitionPage"
                                                    checked={donorForm.showOnRecognitionPage}
                                                    onChange={handleDonorFormChange}
                                                    style={{ marginRight: '8px' }}
                                            />
                                            Show my name on Recognition Page
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                    type="checkbox"
                                                    name="showAmount"
                                                    checked={donorForm.showAmount}
                                                    onChange={handleDonorFormChange}
                                                    disabled={!donorForm.showOnRecognitionPage || donorForm.anonymous}
                                                    style={{ marginRight: '8px' }}
                                            />
                                            Show donation amount publicly
                                        </label>
                                    </div>
                                    {donorForm.showOnRecognitionPage && (
                                            <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
                                                Your name will appear on our Donor Recognition page to honor your support.
                                                {donorForm.showAmount && ' Your donation amount will also be displayed.'}
                                            </p>
                                    )}

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Message (Optional):
                                        </label>
                                        <textarea
                                                name="message"
                                                value={donorForm.message}
                                                onChange={handleDonorFormChange}
                                                rows="3"
                                                placeholder="Leave a message of support..."
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    resize: 'vertical'
                                                }}
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <h5 style={{ marginBottom: '15px' }}>Payment Method:</h5>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                        type="radio"
                                                        value="paypal"
                                                        checked={paymentMethod === 'paypal'}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        style={{ marginRight: '8px' }}
                                                />
                                                🅿️ PayPal
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                        type="radio"
                                                        value="card"
                                                        checked={paymentMethod === 'card'}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        style={{ marginRight: '8px' }}
                                                />
                                                💳 Credit Card
                                            </label>
                                        </div>
                                    </div>

                                    {/* Payment Method Specific Content */}
                                    {paymentMethod === 'card' && (
                                            <div style={{
                                                padding: '20px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '6px',
                                                marginBottom: '20px'
                                            }}>
                                                <h6 style={{ marginBottom: '15px' }}>Credit Card Information:</h6>
                                                <div style={{
                                                    padding: '12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'white'
                                                }}>
                                                    <CardElement options={cardElementOptions} />
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                                                    Your card information is secure and encrypted by Stripe.
                                                </p>
                                            </div>
                                    )}

                                    {paymentMethod === 'paypal' && (
                                            <div style={{
                                                padding: '20px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '6px',
                                                marginBottom: '20px'
                                            }}>
                                                <h6 style={{ marginBottom: '15px' }}>PayPal Payment:</h6>
                                                <PayPalButtons
                                                        style={{
                                                            layout: 'vertical',
                                                            color: 'gold',
                                                            shape: 'rect',
                                                            label: 'donate'
                                                        }}
                                                        createOrder={createPayPalOrder}
                                                        onApprove={onPayPalApprove}
                                                        onError={onPayPalError}
                                                        disabled={isProcessing}
                                                />
                                            </div>
                                    )}

                                    {/* Submit Button for Credit Card */}
                                    {paymentMethod === 'card' && (
                                            <button
                                                    type="submit"
                                                    disabled={isProcessing || !stripe}
                                                    style={{
                                                        width: '100%',
                                                        padding: '15px',
                                                        backgroundColor: isProcessing ? '#6c757d' : '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                        fontSize: '18px',
                                                        fontWeight: 'bold'
                                                    }}
                                            >
                                                {isProcessing ? 'Processing...' : `Donate $${selectedAmount.toFixed(2)}`}
                                            </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Security Note */}
                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                            🔒 Your donation is secure and encrypted. We use Stripe for credit card processing and PayPal for PayPal payments. We never store your payment information on our servers.
                        </p>
                    </div>
                </main>
            </div>
    );
}

// Main component wrapped with both Stripe and PayPal providers
export default function DonatePage() {
    return (
            <PayPalScriptProvider options={paypalOptions}>
                <Elements stripe={stripePromise}>
                    <DonationForm />
                </Elements>
            </PayPalScriptProvider>
    );
}