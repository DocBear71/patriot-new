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
        // Use Enterprise API endpoint
        const projectId = process.env.RECAPTCHA_PROJECT_ID;
        const apiKey = process.env.RECAPTCHA_API_KEY || secretKey;
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

        let data;

        if (projectId) {
            // Enterprise API with project ID
            const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event: {
                        token: token,
                        expectedAction: expectedAction,
                        siteKey: siteKey,
                    }
                }),
            });

            const result = await response.json();

            console.log('🔒 reCAPTCHA Enterprise verification result:', JSON.stringify(result, null, 2));

            if (result.error) {
                return {
                    success: false,
                    score: 0,
                    action: '',
                    error: `reCAPTCHA Enterprise error: ${result.error.message || JSON.stringify(result.error)}`
                };
            }

            // Enterprise API returns tokenProperties and riskAnalysis
            const tokenValid = result.tokenProperties?.valid;
            const action = result.tokenProperties?.action || '';
            const score = result.riskAnalysis?.score ?? 0;

            if (!tokenValid) {
                return {
                    success: false,
                    score: 0,
                    action: action,
                    error: `reCAPTCHA token invalid: ${result.tokenProperties?.invalidReason || 'unknown'}`
                };
            }

            if (action && action !== expectedAction) {
                return {
                    success: false,
                    score: score,
                    action: action,
                    error: `reCAPTCHA action mismatch: expected "${expectedAction}", got "${action}"`
                };
            }

            if (score < minScore) {
                return {
                    success: false,
                    score: score,
                    action: action,
                    error: `reCAPTCHA score too low: ${score} (minimum: ${minScore})`
                };
            }

            return {
                success: true,
                score: score,
                action: action,
                error: null
            };

        } else {
            // Fallback: Standard reCAPTCHA API (siteverify)
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

            data = await response.json();

            console.log('🔒 reCAPTCHA verification result:', {
                success: data.success,
                score: data.score,
                action: data.action,
                hostname: data.hostname,
                errors: data['error-codes']
            });

            if (!data.success) {
                return {
                    success: false,
                    score: 0,
                    action: data.action || '',
                    error: `reCAPTCHA verification failed: ${(data['error-codes'] || []).join(', ')}`
                };
            }

            if (data.action && data.action !== expectedAction) {
                return {
                    success: false,
                    score: data.score,
                    action: data.action,
                    error: `reCAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}"`
                };
            }

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
        }

    } catch (error) {
        console.error('❌ reCAPTCHA verification error:', error);
        // On network errors, allow registration to proceed
        // (better to let a potential bot through than block real users)
        return { success: true, score: 0, action: expectedAction, error: null, networkError: true };
    }
}