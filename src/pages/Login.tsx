import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

type LoginMode = 'institute' | 'student';
type AuthView = 'login' | 'signup';

export default function Login() {
    const { login, studentLogin, sendOTP, verifyOTP, signupInstitute, blockedInfo, initRecaptcha } = useAuth();
    const [mode, setMode] = useState<LoginMode>('institute');
    const [view, setView] = useState<AuthView>('login');
    const recaptchaInitialized = useRef(false);

    // Institute login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Institute signup
    const [signupData, setSignupData] = useState({
        instituteName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        address: '',
        city: '',
        state: '',
    });

    // Student login
    const [studentId, setStudentId] = useState('');
    const [studentPassword, setStudentPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'credentials' | 'otp'>('credentials');
    const [otpSent, setOtpSent] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    // Initialize reCAPTCHA when OTP mode is selected
    useEffect(() => {
        if (mode === 'student' && loginMethod === 'otp' && !recaptchaInitialized.current) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                initRecaptcha('recaptcha-container');
                recaptchaInitialized.current = true;
            }, 100);
        }
    }, [mode, loginMethod, initRecaptcha]);

    // If user is blocked, show blocked page
    if (blockedInfo) {
        return (
            <div className="login-page">
                <div className="blocked-card animate-slide-up">
                    <div className="blocked-icon">
                        <span className="material-symbols-rounded">block</span>
                    </div>
                    <h1>Account Blocked</h1>
                    <p className="blocked-message">{blockedInfo.message}</p>

                    <div className="blocked-contact">
                        <h3>Need Help?</h3>
                        <div className="contact-options">
                            <a href="tel:+919876543210" className="contact-item">
                                <span className="material-symbols-rounded">call</span>
                                <span>+91 98765 43210</span>
                            </a>
                            <a href="mailto:support@insuite.edu" className="contact-item">
                                <span className="material-symbols-rounded">mail</span>
                                <span>support@insuite.edu</span>
                            </a>
                            <a href="https://wa.me/919876543210" target="_blank" rel="noopener" className="contact-item whatsapp">
                                <span className="material-symbols-rounded">chat</span>
                                <span>WhatsApp Support</span>
                            </a>
                        </div>
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={() => window.location.reload()}
                        style={{ marginTop: 'var(--spacing-6)' }}
                    >
                        <span className="material-symbols-rounded">arrow_back</span>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const handleInstituteLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (!result.success) {
                setError(result.message || 'Invalid email or password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInstituteSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (signupData.password !== signupData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (signupData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const result = await signupInstitute(signupData);
            if (result.success) {
                setSuccess('Registration successful! Please wait for admin verification. You will be notified once approved.');
                setSignupData({
                    instituteName: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    address: '',
                    city: '',
                    state: '',
                });
            } else {
                setError(result.message || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await studentLogin(studentId, studentPassword);
            if (!result.success) {
                setError(result.message || 'Invalid Student ID or Password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!phone || phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const success = await sendOTP(phone, 'recaptcha-container');
            if (success) {
                setOtpSent(true);
                setOtpTimer(60);
                const interval = setInterval(() => {
                    setOtpTimer(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError('Phone number not registered or reCAPTCHA failed. Try again.');
            }
        } catch (err) {
            setError('Failed to send OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await verifyOTP(phone, otp);
            if (!result.success) {
                setError(result.message || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('Verification failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* reCAPTCHA container - invisible */}
            <div id="recaptcha-container"></div>

            <div className="login-card animate-slide-up">
                <div className="login-header">
                    <div className="login-logo">E</div>
                    <h1>InSuite Edu</h1>
                    <p>School Management System</p>
                </div>

                {/* Mode Toggle */}
                <div className="login-mode-toggle">
                    <button
                        className={`mode-btn ${mode === 'institute' ? 'active' : ''}`}
                        onClick={() => { setMode('institute'); setView('login'); setError(''); setSuccess(''); }}
                    >
                        <span className="material-symbols-rounded">business</span>
                        Institute
                    </button>
                    <button
                        className={`mode-btn ${mode === 'student' ? 'active' : ''}`}
                        onClick={() => { setMode('student'); setError(''); setSuccess(''); }}
                    >
                        <span className="material-symbols-rounded">school</span>
                        Student
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span className="material-symbols-rounded">error</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span className="material-symbols-rounded">check_circle</span>
                        {success}
                    </div>
                )}

                {/* Institute Login/Signup */}
                {mode === 'institute' && (
                    <>
                        {view === 'login' ? (
                            <form className="login-form" onSubmit={handleInstituteLogin}>
                                <div className="form-group">
                                    <label className="form-label required">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-control"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            style={{ paddingRight: 'var(--spacing-12)' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="password-toggle"
                                        >
                                            <span className="material-symbols-rounded">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-rounded spinning">progress_activity</span>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-rounded">login</span>
                                            Sign In
                                        </>
                                    )}
                                </button>

                                <div className="login-footer-links">
                                    <p>Don't have an account?</p>
                                    <button
                                        type="button"
                                        className="link-btn"
                                        onClick={() => { setView('signup'); setError(''); setSuccess(''); }}
                                    >
                                        Register your Institute
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="login-form" onSubmit={handleInstituteSignup}>
                                <div className="form-group">
                                    <label className="form-label required">Institute Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter institute name"
                                        value={signupData.instituteName}
                                        onChange={(e) => setSignupData(d => ({ ...d, instituteName: e.target.value }))}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Email address"
                                            value={signupData.email}
                                            onChange={(e) => setSignupData(d => ({ ...d, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Phone number"
                                            value={signupData.phone}
                                            onChange={(e) => setSignupData(d => ({ ...d, phone: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">Address</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Full address"
                                        value={signupData.address}
                                        onChange={(e) => setSignupData(d => ({ ...d, address: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">City</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="City"
                                            value={signupData.city}
                                            onChange={(e) => setSignupData(d => ({ ...d, city: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">State</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="State"
                                            value={signupData.state}
                                            onChange={(e) => setSignupData(d => ({ ...d, state: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Min 8 characters"
                                            value={signupData.password}
                                            onChange={(e) => setSignupData(d => ({ ...d, password: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Confirm</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Confirm password"
                                            value={signupData.confirmPassword}
                                            onChange={(e) => setSignupData(d => ({ ...d, confirmPassword: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-rounded spinning">progress_activity</span>
                                            Registering...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-rounded">app_registration</span>
                                            Register Institute
                                        </>
                                    )}
                                </button>

                                <div className="login-footer-links">
                                    <p>Already have an account?</p>
                                    <button
                                        type="button"
                                        className="link-btn"
                                        onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}

                {/* Student Login */}
                {mode === 'student' && (
                    <>
                        {/* Login Method Toggle */}
                        <div className="student-login-methods">
                            <button
                                className={`method-btn ${loginMethod === 'credentials' ? 'active' : ''}`}
                                onClick={() => { setLoginMethod('credentials'); setOtpSent(false); setError(''); }}
                            >
                                <span className="material-symbols-rounded">password</span>
                                ID & Password
                            </button>
                            <button
                                className={`method-btn ${loginMethod === 'otp' ? 'active' : ''}`}
                                onClick={() => { setLoginMethod('otp'); setError(''); }}
                            >
                                <span className="material-symbols-rounded">sms</span>
                                Phone OTP
                            </button>
                        </div>

                        {loginMethod === 'credentials' ? (
                            <form className="login-form" onSubmit={handleStudentLogin}>
                                <div className="form-group">
                                    <label className="form-label required">Student ID</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., STU2026001"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-control"
                                            placeholder="Enter your password"
                                            value={studentPassword}
                                            onChange={(e) => setStudentPassword(e.target.value)}
                                            required
                                            style={{ paddingRight: 'var(--spacing-12)' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="password-toggle"
                                        >
                                            <span className="material-symbols-rounded">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-rounded spinning">progress_activity</span>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-rounded">login</span>
                                            Student Login
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form className="login-form" onSubmit={handleVerifyOTP}>
                                <div className="form-group">
                                    <label className="form-label required">Phone Number</label>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                        <span className="phone-prefix">+91</span>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Enter 10-digit number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            maxLength={10}
                                            disabled={otpSent}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </div>

                                {!otpSent ? (
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-block"
                                        disabled={loading || phone.length !== 10}
                                        onClick={handleSendOTP}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="material-symbols-rounded spinning">progress_activity</span>
                                                Sending OTP...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-rounded">send</span>
                                                Send OTP
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label required">Enter OTP</label>
                                            <input
                                                type="text"
                                                className="form-control otp-input"
                                                placeholder="• • • • • •"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                maxLength={6}
                                                autoFocus
                                            />
                                            <p className="otp-hint">
                                                {otpTimer > 0 ? (
                                                    <>OTP sent to +91 {phone}. Resend in {otpTimer}s</>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setOtpSent(false); setOtp(''); }}
                                                        className="link-btn"
                                                    >
                                                        Resend OTP
                                                    </button>
                                                )}
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-success btn-block"
                                            disabled={loading || otp.length !== 6}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="material-symbols-rounded spinning">progress_activity</span>
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-rounded">verified</span>
                                                    Verify & Login
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
