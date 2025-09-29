'use client';
// file: /src/app/donate/page.jsx v2 - Donation Page with Stripe Integration

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navigation from '../../components/layout/Navigation';
import Footer from '../../components/legal/Footer';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Card Element styles
const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
            padding: '10px',
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
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [clientSecret, setClientSecret] = useState('');

    // Donor form state
    const [donorForm, setDonorForm] = useState({
        name: '',
        email: '',
        anonymous: false,
        recurring: false,
        message: ''
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

    // Create PaymentIntent on the server
    const createPaymentIntent = async () => {
        try {
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

            if (response.ok) {
                return data.clientSecret;
            } else {
                throw new Error(data.message || 'Failed to create payment intent');
            }
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    };

    const handleStripePayment = async () => {
        if (!stripe || !elements) {
            setMessage({ type: 'error', text: 'Stripe is not loaded yet. Please try again.' });
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setMessage({ type: 'error', text: 'Card element not found. Please refresh the page.' });
            return;
        }

        try {
            // Create payment intent
            const clientSecret = await createPaymentIntent();

            // Confirm payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
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
                await saveDonationToDatabase(paymentIntent);
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

    const saveDonationToDatabase = async (paymentIntent) => {
        try {
            const response = await fetch('/api/donations?operation=save-donation', {
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
                    message: donorForm.message,
                    paymentMethod: 'stripe',
                    paymentIntentId: paymentIntent.id,
                    transactionId: paymentIntent.id,
                    status: 'completed'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to save donation:', errorData);
                // Don't throw error here since payment succeeded
            }
        } catch (error) {
            console.error('Error saving donation to database:', error);
            // Don't throw error here since payment succeeded
        }
    };

    const handlePayPalPayment = async () => {
        try {
            const response = await fetch('/api/donations?operation=create-paypal-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: selectedAmount,
                    name: donorForm.name,
                    email: donorForm.email,
                    anonymous: donorForm.anonymous,
                    recurring: donorForm.recurring,
                    message: donorForm.message
                })
            });

            const data = await response.json();

            if (response.ok && data.approvalUrl) {
                // Redirect to PayPal for approval
                window.location.href = data.approvalUrl;
                return true;
            } else {
                throw new Error(data.message || 'PayPal payment creation failed');
            }
        } catch (error) {
            console.error('PayPal payment error:', error);
            setMessage({ type: 'error', text: error.message || 'PayPal payment failed' });
            return false;
        }
    };

    const handleDonationSubmit = async (e) => {
        e.preventDefault();

        const errors = validateDonationForm();
        if (errors.length > 0) {
            setMessage({ type: 'error', text: errors.join('. ') });
            return;
        }

        setIsProcessing(true);
        setMessage({ type: '', text: '' });

        let success = false;

        try {
            if (paymentMethod === 'stripe') {
                success = await handleStripePayment();
            } else if (paymentMethod === 'paypal') {
                success = await handlePayPalPayment();
            }

            if (success) {
                setShowSuccess(true);
            }
        } catch (error) {
            console.error('Donation error:', error);
            setMessage({ type: 'error', text: error.message || 'Donation processing failed' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (showSuccess) {
        return (
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="pt-20 pb-12">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="bg-white rounded-lg shadow-md p-8 text-center border-2 border-green-500">
                                <div className="text-6xl text-green-500 mb-6">✅</div>
                                <h2 className="text-3xl font-bold text-green-600 mb-4">
                                    Thank You for Your Support!
                                </h2>
                                <h3 className="text-xl text-gray-800 mb-6">
                                    Your donation of ${selectedAmount.toFixed(2)} has been processed successfully
                                </h3>
                                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                                    Your support helps us continue connecting heroes with businesses that appreciate their service.
                                </p>

                                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                                    <p className="text-gray-700 mb-2">
                                        A confirmation email has been sent to: <strong>{donorForm.email}</strong>
                                    </p>
                                    {donorForm.recurring && (
                                            <p className="text-blue-600 font-semibold">
                                                Your donation will recur monthly. You can manage your subscription by contacting us.
                                            </p>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                            onClick={() => router.push('/')}
                                            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        Return to Home
                                    </button>
                                    <button
                                            onClick={() => router.push('/contact')}
                                            className="bg-transparent border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                        Contact Us
                                    </button>
                                </div>

                                <div className="mt-8 text-sm text-gray-500">
                                    <p>Problem with your donation? Please{' '}
                                        <span
                                                className="text-blue-600 cursor-pointer underline"
                                                onClick={() => router.push('/contact')}
                                        >
                                        contact us
                                    </span>{' '}
                                        for assistance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
        );
    }

    return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="pt-20 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Our Mission</h1>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Help us connect veterans, active-duty military, first responders, and their families
                                with businesses that appreciate their service.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            {/* Mission Statement */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-md p-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Help Us Serve Those Who Serve</h2>
                                    <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                        Patriot Thanks connects veterans, active-duty military, first responders, and their families
                                        with businesses that offer special discounts and incentives. Your donation helps us maintain
                                        and grow this valuable resource for our community.
                                    </p>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Donation Helps Us:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ul className="space-y-3 text-gray-700">
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                Cover hosting and operational costs
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                Develop enhanced features and tools
                                            </li>
                                        </ul>
                                        <ul className="space-y-3 text-gray-700">
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                Expand our database of participating businesses
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                Improve user experience for heroes and businesses
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Quick PayPal Option */}
                            <div className="lg:col-span-1">
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                                        <span className="mr-2">⚡</span>
                                        Quick PayPal Donation
                                    </h3>
                                    <p className="text-blue-700 mb-6">
                                        Make a donation directly through PayPal without creating an account.
                                    </p>

                                    <div className="bg-yellow-400 hover:bg-yellow-500 transition-colors p-4 rounded-lg text-center cursor-pointer font-bold text-blue-900">
                                        🅿️ Donate with PayPal
                                    </div>

                                    <p className="text-sm text-blue-600 mt-4 text-center">
                                        For custom amounts and options, use the form below
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Message Display */}
                        {message.text && (
                                <div className={`mb-6 p-4 rounded-md ${
                                        message.type === 'success'
                                                ? 'bg-green-50 border border-green-200 text-green-800'
                                                : 'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                    {message.text}
                                </div>
                        )}

                        {/* Main Donation Form */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8">Customize Your Donation</h3>

                            <form onSubmit={handleDonationSubmit}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Amount Selection */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-6">Choose Amount:</h4>

                                        {/* Preset Amounts */}
                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            {donationAmounts.map(amount => (
                                                    <button
                                                            key={amount}
                                                            type="button"
                                                            onClick={() => handleAmountSelect(amount)}
                                                            className={`p-3 border-2 rounded-lg font-semibold text-lg transition-colors ${
                                                                    selectedAmount === amount && !customAmount
                                                                            ? 'border-blue-600 bg-blue-600 text-white'
                                                                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        ${amount}
                                                    </button>
                                            ))}
                                        </div>

                                        {/* Custom Amount */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Custom Amount ($):
                                            </label>
                                            <input
                                                    type="number"
                                                    value={customAmount}
                                                    onChange={handleCustomAmountChange}
                                                    min="1"
                                                    step="0.01"
                                                    placeholder="Enter amount"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Payment Method Selection */}
                                        <div className="mb-6">
                                            <h5 className="text-lg font-semibold text-gray-900 mb-4">Payment Method:</h5>
                                            <div className="space-y-3">
                                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                            type="radio"
                                                            value="stripe"
                                                            checked={paymentMethod === 'stripe'}
                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                            className="mr-3"
                                                    />
                                                    <span className="mr-2">💳</span>
                                                    Credit/Debit Card
                                                </label>
                                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                            type="radio"
                                                            value="paypal"
                                                            checked={paymentMethod === 'paypal'}
                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                            className="mr-3"
                                                    />
                                                    <span className="mr-2">🅿️</span>
                                                    PayPal
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Donor Information */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-6">Donor Information:</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Name *
                                                </label>
                                                <input
                                                        type="text"
                                                        name="name"
                                                        value={donorForm.name}
                                                        onChange={handleDonorFormChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email *
                                                </label>
                                                <input
                                                        type="email"
                                                        name="email"
                                                        value={donorForm.email}
                                                        onChange={handleDonorFormChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                        type="checkbox"
                                                        name="anonymous"
                                                        checked={donorForm.anonymous}
                                                        onChange={handleDonorFormChange}
                                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                Make my donation anonymous
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                        type="checkbox"
                                                        name="recurring"
                                                        checked={donorForm.recurring}
                                                        onChange={handleDonorFormChange}
                                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                Make this a monthly donation
                                            </label>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Message (Optional):
                                            </label>
                                            <textarea
                                                    name="message"
                                                    value={donorForm.message}
                                                    onChange={handleDonorFormChange}
                                                    rows="3"
                                                    placeholder="Leave a message of support..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                                            />
                                        </div>

                                        {/* Stripe Card Element */}
                                        {paymentMethod === 'stripe' && (
                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Card Information *
                                                    </label>
                                                    <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
                                                        <CardElement options={cardElementOptions} />
                                                    </div>
                                                </div>
                                        )}

                                        {/* Submit Button */}
                                        <button
                                                type="submit"
                                                disabled={isProcessing || !stripe}
                                                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? (
                                                    <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </span>
                                            ) : (
                                                    `Donate $${selectedAmount.toFixed(2)}`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Security Note */}
                        <div className="mt-8 bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
                            <p className="text-sm text-gray-600 flex items-center justify-center">
                                <span className="mr-2">🔒</span>
                                Your donation is secure and encrypted. We use Stripe for payment processing and never store your card information.
                            </p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
    );
}

// Main component wrapped with Stripe Elements
export default function DonatePage() {
    return (
            <Elements stripe={stripePromise}>
                <DonationForm />
            </Elements>
    );
}