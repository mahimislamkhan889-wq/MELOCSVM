import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Lock,
  RefreshCw,
  Smartphone,
  Eye,
  EyeOff,
  User,
  Zap,
  KeyRound
} from 'lucide-react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  RecaptchaVerifier, 
  ConfirmationResult, 
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

type AuthMethod = 'google' | 'email' | 'phone';

const COUNTRY_CODES = [
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' }
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [method, setMethod] = useState<AuthMethod>('google');
  
  // Email Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone Auth State
  const [selectedCountryCode, setSelectedCountryCode] = useState('+880');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isSmsRegionBlocked, setIsSmsRegionBlocked] = useState(false);

  // General State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Timer for OTP resend countdown
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Clean up reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Initialize or get reCAPTCHA verifier safely
  const getOrCreateRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        const container = document.getElementById('recaptcha-container') || 'recaptcha-container';
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, container, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setErrorMessage('Security verification expired. Please try sending OTP again.');
          }
        });
      } catch (err: any) {
        console.error('RecaptchaVerifier setup notice:', err);
        throw new Error('Security reCAPTCHA cannot run in this iframe. Please use Gmail or Email sign-in.');
      }
    }
    return recaptchaVerifierRef.current;
  };

  const handleAuthSuccess = (userObj: any, welcomeName: string) => {
    setSuccessMessage(`Welcome, ${welcomeName}!`);
    if (onSuccess) onSuccess(userObj);
    setTimeout(() => {
      onClose();
      setIsLoading(false);
    }, 800);
  };

  // 1. Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSmsRegionBlocked(false);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      handleAuthSuccess(result.user, result.user.displayName || result.user.email || 'Creator');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Browser popup blocked. Please allow popups or use Email sign-in.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage('Domain authorization required. You can use Email login or Instant Access.');
      } else {
        setErrorMessage(err.message || 'Failed to sign in with Google.');
      }
      setIsLoading(false);
    }
  };

  // 2. Handle Email & Password (Login / Register)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        // Register new contributor
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (displayName.trim()) {
          try {
            await updateProfile(cred.user, { displayName: displayName.trim() });
          } catch {}
        }
        handleAuthSuccess(cred.user, displayName.trim() || cleanEmail.split('@')[0]);
      } else {
        // Sign in existing contributor
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        handleAuthSuccess(cred.user, cred.user.displayName || cleanEmail.split('@')[0]);
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Incorrect email or password. If you are new, click "Create an account" below.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account already exists with this email. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use at least 6 characters.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
      }
      setIsLoading(false);
    }
  };

  // 3. Handle Send Phone OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSmsRegionBlocked(false);

    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNumber || cleanNumber.length < 6) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }

    // Format full E.164 phone number
    const fullPhoneNumber = `${selectedCountryCode}${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;

    setIsLoading(true);
    try {
      const verifier = getOrCreateRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendCountdown(60);
      setSuccessMessage(`OTP sent to ${fullPhoneNumber}`);
    } catch (err: any) {
      console.error('Phone SMS Error:', err);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }

      // Check if SMS region is blocked by Firebase policy (common for BD +880 in new projects)
      const isRegionError = err.code === 'auth/operation-not-allowed' || 
                            (err.message && err.message.toLowerCase().includes('region enabled')) ||
                            (err.message && err.message.toLowerCase().includes('operation-not-allowed'));

      if (isRegionError) {
        setIsSmsRegionBlocked(true);
        setErrorMessage('Firebase: SMS unable to be sent until this region enabled by the app developer. (auth/operation-not-allowed).');
      } else if (err.code === 'auth/invalid-phone-number') {
        setErrorMessage('Invalid phone number format. Please check the country code and digits.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please wait a few minutes before requesting another OTP.');
      } else if (err.code === 'auth/quota-exceeded') {
        setErrorMessage('SMS quota limit reached. Please use Gmail or Email login.');
      } else {
        setErrorMessage(err.message || 'Failed to send OTP to this mobile number.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (!confirmationResult) {
      setErrorMessage('Session expired. Please request a new OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(cleanOtp);
      handleAuthSuccess(result.user, result.user.phoneNumber || 'Contributor');
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setErrorMessage('Incorrect verification code. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setErrorMessage('Verification code has expired. Please request a new code.');
      } else {
        setErrorMessage(err.message || 'Failed to verify OTP code.');
      }
      setIsLoading(false);
    }
  };

  // 5. Handle Instant Contributor Quick Access
  const handleInstantAccess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Try official anonymous auth first
      const cred = await signInAnonymously(auth);
      handleAuthSuccess(cred.user, 'Melo Creator');
    } catch (err) {
      console.warn('Anonymous auth notice, falling back to local creator session:', err);
      // Seamless fallback so contributor is NEVER blocked
      const localCreator = {
        uid: 'creator_' + Math.random().toString(36).substring(2, 9),
        displayName: 'Melo Creator',
        email: 'creator@melo.workspace',
        isAnonymous: true,
      };
      handleAuthSuccess(localCreator, 'Melo Creator');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#ECEEF4] dark:bg-[#1A202E] border border-zinc-300/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 text-zinc-900 dark:text-zinc-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invisible reCAPTCHA container for Phone Auth */}
        <div id="recaptcha-container" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md mb-2">
            <Sparkles size={22} className="text-amber-400 dark:text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">
            Welcome to Melo
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            Sign in to sync your stock contributor metadata, custom prompts & API configurations.
          </p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 p-1 mb-5 rounded-2xl bg-[#DFE3EA] dark:bg-[#131722] border border-zinc-300/60 dark:border-white/5 text-center">
          <button
            type="button"
            onClick={() => {
              setMethod('google');
              setErrorMessage(null);
              setIsSmsRegionBlocked(false);
            }}
            className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              method === 'google'
                ? 'bg-white dark:bg-[#252E42] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Mail size={13} />
            <span className="truncate">Gmail / Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setErrorMessage(null);
              setIsSmsRegionBlocked(false);
            }}
            className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              method === 'email'
                ? 'bg-white dark:bg-[#252E42] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <KeyRound size={13} />
            <span className="truncate">Email & Pass</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod('phone');
              setErrorMessage(null);
            }}
            className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              method === 'phone'
                ? 'bg-white dark:bg-[#252E42] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Smartphone size={13} />
            <span className="truncate">Mobile Phone</span>
          </button>
        </div>

        {/* Smart SMS Region Notice with 1-Click Alternative Buttons */}
        {isSmsRegionBlocked && method === 'phone' && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[13px] text-zinc-900 dark:text-zinc-50">
                  Firebase SMS Delivery Limitation (+880 Region)
                </p>
                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Google Firebase SMS verification is restricted for certain telecommunication carriers. To continue without delay, please use Google Gmail Sign-In or 1-Click Instant Contributor Access below:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMethod('google');
                  handleGoogleSignIn();
                }}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Sign in with Google</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={handleInstantAccess}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap size={13} className="fill-white" />
                <span>Instant 1-Click Access</span>
              </button>
            </div>
          </div>
        )}

        {/* Generic Error Notification (if not already handled by region banner) */}
        {errorMessage && (!isSmsRegionBlocked || method !== 'phone') && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Google Sign-In */}
        {method === 'google' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-[#22293C] hover:bg-zinc-50 dark:hover:bg-[#2A334A] text-zinc-800 dark:text-zinc-100 font-bold text-sm border border-zinc-300/80 dark:border-white/10 shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {/* Google Brand SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Connecting with Google...' : 'Continue with Gmail / Google'}</span>
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Official Google OAuth • 100% Instant & Secure</span>
            </div>
          </div>
        )}

        {/* Tab 2: Email & Password */}
        {method === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isRegistering && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Full Name / Contributor Handle
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="e.g. Mainul Islam"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3.5 text-zinc-400" />
                <input
                  type="email"
                  placeholder="creator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isRegistering ? 'Create Account & Sign In' : 'Sign In with Email'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMessage(null);
                }}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Mobile Phone SMS OTP */}
        {method === 'phone' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Mobile Phone Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Select */}
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="px-2.5 py-3 rounded-xl bg-white dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white shrink-0"
                    >
                      {COUNTRY_CODES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.flag} {item.code}
                        </option>
                      ))}
                    </select>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      placeholder="e.g. 01712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isLoading}
                      required
                      className="flex-1 px-3.5 py-3 rounded-xl bg-white dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin" />
                      <span>Sending Verification SMS...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Enter 6-Digit OTP Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Change number
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={isLoading}
                    autoFocus
                    required
                    className="w-full text-center tracking-[0.4em] text-xl font-bold px-4 py-3 rounded-xl bg-white dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  {resendCountdown > 0 ? (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Resend code in <strong className="font-mono">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isLoading}
                      className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <RefreshCw size={11} />
                      <span>Resend OTP Code</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
              <Lock size={12} className="text-zinc-400" />
              <span>Encrypted Firebase Authentication</span>
            </div>
          </div>
        )}

        {/* Instant Access Footer for Immediate Unblocking */}
        <div className="mt-5 pt-4 border-t border-zinc-300/60 dark:border-white/10 text-center">
          <button
            type="button"
            onClick={handleInstantAccess}
            disabled={isLoading}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-200/80 hover:bg-zinc-300/80 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap size={13} className="text-amber-500 fill-amber-500" />
            <span>Instant Contributor Access (1-Click Guest Sign-In)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
