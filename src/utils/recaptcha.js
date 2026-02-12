// file: /src/utils/recaptcha.js v1 - Server-side Google reCAPTCHA v3 verification

/**
 * Verify a reCAPTCHA v3 token with Google's API
 * @param {string} token - The reCAPTCHA token from the frontend
 * @param {string} expectedAction - The action name to verify (e.g., 'register')
 * @param {number} minScore - Minimum score threshold (0.0 to 1.0, default 0.5)
 * @returns {Promise<{ success: boolean, score: number, action: string, error: string|null }>}
 */
export async function verifyRecaptcha(token, expectedAction = 'register', minScore = 0.5) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        console.warn('⚠️ RECAPTCHA_SECRET_KEY not set — skipping reCAPTCHA verification');
        // Allow registration to proceed if reCAPTCHA is not configured
        // This prevents breaking registration if keys aren't set up yet
        return { success: true, score: 1.0, action: expectedAction, error: null, skipped: true };
    }

    if (!token) {
        console.warn('⚠️ No reCAPTCHA token provided');
        return { success: false, score: 0, action: '', error: 'No reCAPTCHA token provided' };
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data = await response.json();

        console.log('🔒 reCAPTCHA verification result:', {
            success: data.success,
            score: data.score,
            action: data.action,
            hostname: data.hostname,
            errors: data['error-codes']
        });

        // Check if verification was successful
        if (!data.success) {
            return {
                success: false,
                score: 0,
                action: data.action || '',
                error: `reCAPTCHA verification failed: ${(data['error-codes'] || []).join(', ')}`
            };
        }

        // Check the action matches what we expected
        if (data.action && data.action !== expectedAction) {
            return {
                success: false,
                score: data.score,
                action: data.action,
                error: `reCAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}"`
            };
        }

        // Check the score threshold
        // Score ranges from 0.0 (likely bot) to 1.0 (likely human)
        if (data.score < minScore) {
            return {
                success: false,
                score: data.score,
                action: data.action,
                error: `reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`
            };
        }

        return {
            success: true,
            score: data.score,
            action: data.action,
            error: null
        };

    } catch (error) {
        console.error('❌ reCAPTCHA verification error:', error);
        // On network errors, allow registration to proceed
        // (better to let a potential bot through than block real users)
        return { success: true, score: 0, action: expectedAction, error: null, networkError: true };
    }
}