// Razorpay Payment Service
// Uses Razorpay for payments in India

// Razorpay Key ID (public key - safe to expose in frontend)
const RAZORPAY_KEY_ID = 'rzp_live_RsLnrgKYQL6GIU';

// Plan configurations
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        priceDisplay: '₹0',
        period: 'forever',
        features: [
            '3 projects per month',
            '50 AI responses per month',
            '5 team members',
            '100MB knowledge storage',
            'PDF export',
            'Email support'
        ],
        limits: {
            projectsPerMonth: 3,
            aiResponsesPerMonth: 50,
            teamMembers: 5,
            storageMB: 100
        }
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        price: 399900, // ₹3,999 in paise
        priceDisplay: '₹3,999',
        period: 'month',
        features: [
            'Unlimited projects',
            '500 AI responses per month',
            '25 team members',
            '5GB knowledge storage',
            'PDF & Word export',
            'Priority support',
            'Team collaboration'
        ],
        limits: {
            projectsPerMonth: -1, // unlimited
            aiResponsesPerMonth: 500,
            teamMembers: 25,
            storageMB: 5120
        }
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 1599900, // ₹15,999 in paise
        priceDisplay: '₹15,999',
        period: 'month',
        features: [
            'Everything in Professional',
            'Unlimited AI responses',
            'Unlimited team members',
            '50GB knowledge storage',
            'Custom AI training',
            'API access',
            'Dedicated support',
            'White-label exports'
        ],
        limits: {
            projectsPerMonth: -1,
            aiResponsesPerMonth: -1,
            teamMembers: -1,
            storageMB: 51200
        }
    }
};

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Initialize Razorpay checkout
 */
export const initiatePayment = async ({
    planId,
    user,
    onSuccess,
    onFailure
}) => {
    const plan = PLANS[planId];
    if (!plan || plan.price === 0) {
        console.error('Invalid plan or free plan selected');
        return;
    }

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
        onFailure?.('Failed to load payment gateway');
        return;
    }

    // Create order options
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: plan.price, // Amount in paise
        currency: 'INR',
        name: 'RFPgrep',
        description: `${plan.name} Plan - Monthly Subscription`,
        image: 'https://responceai.web.app/logo.png', // Optional: Add your logo
        prefill: {
            name: user?.displayName || '',
            email: user?.email || '',
        },
        notes: {
            planId: planId,
            userId: user?.uid || '',
        },
        theme: {
            color: '#6366F1' // Indigo color matching our brand
        },
        handler: function (response) {
            // Payment successful
            console.log('Payment successful:', response);
            onSuccess?.({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                planId: planId
            });
        },
        modal: {
            ondismiss: function () {
                console.log('Checkout form closed');
            }
        }
    };

    // Open Razorpay checkout
    try {
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
            console.error('Payment failed:', response.error);
            onFailure?.(response.error.description);
        });
        razorpay.open();
    } catch (error) {
        console.error('Error opening Razorpay:', error);
        onFailure?.('Failed to open payment gateway');
    }
};

/**
 * Check if user has exceeded their plan limits
 */
export const checkPlanLimits = (userData, limitType) => {
    const plan = PLANS[userData?.plan || 'free'];
    const limits = plan.limits;
    const usage = userData?.usage || {};

    switch (limitType) {
        case 'projects':
            if (limits.projectsPerMonth === -1) return { allowed: true, limit: -1 };
            return {
                allowed: (usage.projectsThisMonth || 0) < limits.projectsPerMonth,
                current: usage.projectsThisMonth || 0,
                limit: limits.projectsPerMonth
            };

        case 'aiResponses':
            if (limits.aiResponsesPerMonth === -1) return { allowed: true, limit: -1 };
            return {
                allowed: (usage.aiCallsMade || 0) < limits.aiResponsesPerMonth,
                current: usage.aiCallsMade || 0,
                limit: limits.aiResponsesPerMonth
            };

        case 'teamMembers':
            if (limits.teamMembers === -1) return { allowed: true, limit: -1 };
            return {
                allowed: (usage.teamMemberCount || 0) < limits.teamMembers,
                current: usage.teamMemberCount || 0,
                limit: limits.teamMembers
            };

        case 'storage':
            return {
                allowed: (usage.storageUsedMB || 0) < limits.storageMB,
                current: usage.storageUsedMB || 0,
                limit: limits.storageMB
            };

        default:
            return { allowed: true, limit: -1 };
    }
};

/**
 * Get user's current plan details
 */
export const getUserPlan = (userData) => {
    const planId = userData?.plan || 'free';
    return PLANS[planId] || PLANS.free;
};
