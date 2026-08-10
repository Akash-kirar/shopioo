import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../shared/types';
import { Smartphone, ArrowLeft } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    RecaptchaVerifier, 
    signInWithPhoneNumber,
    ConfirmationResult,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthProps {
  onLogin: (user: User) => void;
}

const ShopiooLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6V4a4 4 0 0 1 8 0v2" />
        <path d="M3 6h18v13a2 2 0 0 1-2 2h-4" />
        <path d="M9 21H5a2 2 0 0 1-2-2V6" />
        <path d="M12 18.5c0 0-4-3-4-6.5a4 4 0 0 1 8 0c0 3.5-4 6.5-4 6.5Z" />
        <circle cx="12" cy="12" r="1.5" />
    </svg>
);

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'email' | 'mobile' | 'otp' | 'forgot-password'>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize recaptcha when component mounts
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

  const getOrCreateFirestoreUser = async (userAuth: any, additionalData: any = {}): Promise<User> => {
    const userRef = doc(db, 'users', userAuth.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    } else {
      const newUser: User = {
        id: userAuth.uid,
        name: userAuth.displayName || additionalData.name || 'User',
        email: userAuth.email || `${userAuth.phoneNumber}@mobile.user`,
        role: additionalData.role || 'user',
        ...additionalData
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        if (isLogin) {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = await getOrCreateFirestoreUser(userCredential.user);
          onLogin(user);
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = await getOrCreateFirestoreUser(userCredential.user, { name, role });
          onLogin(user);
        }
    } catch (e: any) {
        if (e.code === 'auth/operation-not-allowed') {
            setError("Email/Password auth is not enabled. Please enable it in Firebase Console -> Authentication -> Sign-in method.");
        } else {
            setError(e.message || "An error occurred. Please try again.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mobileNumber.length < 10) {
        setError('Please enter a valid mobile number.');
        return;
    }
    
    setIsLoading(true);
    try {
        const appVerifier = (window as any).recaptchaVerifier;
        const formattedNumber = `+91${mobileNumber}`;
        const result = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
        setConfirmationResult(result);
        setAuthMode('otp');
    } catch (e: any) {
        if (e.code === 'auth/operation-not-allowed' || e.message?.toLowerCase().includes('region')) {
            setError("Phone auth / SMS region is not enabled. Go to Firebase Console -> Authentication -> Settings -> SMS Region and enable it.");
        } else if (e.code === 'auth/billing-not-enabled') {
            setError("Firebase project requires the Blaze (pay-as-you-go) billing plan to use Phone Authentication.");
        } else {
            setError(e.message || "Failed to send OTP.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4) {
        setError('Please enter a valid OTP.');
        return;
    }
    
    if (!confirmationResult) {
        setError('Please request a new OTP.');
        return;
    }

    setIsLoading(true);
    try {
        const result = await confirmationResult.confirm(otp);
        const user = await getOrCreateFirestoreUser(result.user, { mobileNumber });
        onLogin(user);
    } catch (e: any) {
        setError(e.message || "Invalid OTP.");
    } finally {
        setIsLoading(false);
    }
  };

  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
        setError('Please enter your email address first.');
        return;
    }
    
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        setError('Password reset email sent! Check your inbox.');
        // After sending, we don't automatically go back, so user can read the message.
        // We'll leave it in the forgot-password mode or they can use the back button.
    } catch (e: any) {
        setError(e.message || "Failed to send reset email.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = await getOrCreateFirestoreUser(result.user);
        onLogin(user);
    } catch (e: any) {
        if (e.code === 'auth/operation-not-allowed') {
            setError("Google sign-in is not enabled. Please enable it in Firebase Console -> Authentication -> Sign-in method.");
        } else if (e.code === 'auth/unauthorized-domain') {
            setError("Domain not authorized. Please add this app's URL to Firebase Console -> Authentication -> Settings -> Authorized domains.");
        } else if (e.code === 'auth/popup-closed-by-user') {
            setError("Popup was closed before completing sign in.");
        } else if (e.code === 'auth/popup-blocked') {
            setError("Popup blocked by browser. Please allow popups for this site, or open the app in a new tab using the button in the top right.");
        } else {
            setError(`${e.code || ''}: ${e.message || "Google sign-in failed."}`);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div id="recaptcha-container"></div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center p-4 border border-gray-100 rotate-3 hover:rotate-0 transition-transform">
                <ShopiooLogo className="w-full h-full" />
            </div>
        </div>
        <h2 className="mt-8 text-center text-3xl font-black tracking-tight text-gray-900">
          {authMode === 'mobile' ? 'Verify your number' : 
           authMode === 'otp' ? 'Enter OTP' :
           authMode === 'forgot-password' ? 'Reset Password' :
           isLogin ? 'Sign in to your account' : 'Create an account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px] bg-white py-8 px-6 shadow-2xl shadow-purple-500/10 sm:rounded-[2rem] border border-gray-100">
        
        
        {authMode === 'forgot-password' && (
             <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleResetPassword}>
                <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 font-medium">Enter your email address and we'll send you a link to reset your password.</p>
                    <p className="text-sm text-gray-600 font-bold mt-2">Please also check your spam folder.</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1 px-1">
                      <label className="block text-xs font-bold text-gray-900">Email address</label>
                  </div>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 bg-gray-50 font-medium" />
                </div>

                {error && <p className={`text-xs font-bold text-center py-2 rounded-lg ${error.includes('sent') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setAuthMode('email'); setError(''); }} className="flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 w-12 h-12 text-gray-600 hover:bg-gray-200 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button type="submit" disabled={isLoading || !email} className="flex-1 flex justify-center items-center rounded-full bg-[#a82283] px-3 py-3 text-sm font-bold leading-6 text-white shadow-lg hover:bg-[#8a1c6b] active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a82283] disabled:opacity-70">
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
             </form>
        )}

        {authMode === 'email' && (
            <form className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1 ml-1">
                        <label className="block text-xs font-bold text-gray-900">Full Name</label>
                    </div>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 bg-gray-50 font-medium" />
                  </div>

                </>
              )}

              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                    <label className="block text-xs font-bold text-gray-900">Email address</label>
                </div>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 bg-gray-50 font-medium" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                    <label className="block text-xs font-bold text-gray-900">Password</label>
                    {isLogin && <button type="button" onClick={() => { setAuthMode('forgot-password'); setError(''); }} className="text-xs font-bold text-[#a82283] hover:text-[#8a1c6b]">Forgot?</button>}
                </div>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 bg-gray-50 font-medium" />
              </div>

              {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}

              <div>
                <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-full bg-[#a82283] px-3 py-3 text-sm font-bold leading-6 text-white shadow-lg hover:bg-[#8a1c6b] active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a82283] disabled:opacity-70">
                  {isLoading ? 'Processing...' : (isLogin ? 'Sign in' : 'Register')}
                </button>
              </div>
            </form>
        )}

        {authMode === 'mobile' && (
             <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleSendOtp}>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 ml-1">Mobile Number</label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">+91</span>
                      <input type="tel" required value={mobileNumber} onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} className="block w-full rounded-xl border-0 py-3 pl-12 pr-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 bg-gray-50 font-medium tracking-wider" placeholder="98765 43210" />
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setAuthMode('email'); setError(''); }} className="flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 w-12 h-12 text-gray-600 hover:bg-gray-200 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button type="submit" disabled={isLoading || mobileNumber.length < 10} className="flex-1 flex justify-center items-center rounded-full bg-[#a82283] px-3 py-3 text-sm font-bold leading-6 text-white shadow-lg hover:bg-[#8a1c6b] active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a82283] disabled:opacity-70">
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
             </form>
        )}

        {authMode === 'otp' && (
             <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleVerifyOtp}>
                <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 font-medium">OTP sent to <span className="font-bold text-gray-900">+91 {mobileNumber}</span></p>
                    <button type="button" onClick={() => { setAuthMode('mobile'); setOtp(''); }} className="text-[#a82283] text-xs font-bold hover:underline mt-1">Change Number</button>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1 px-1">
                      <label className="block text-xs font-bold text-gray-900">Enter OTP</label>
                  </div>
                  <input type="text" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} className="block w-full rounded-xl border-0 py-3 text-center text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-2xl sm:leading-6 font-black tracking-[0.5em] bg-gray-50" placeholder="••••" />
                </div>

                {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setAuthMode('mobile'); setError(''); setOtp(''); }} className="flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 w-12 h-12 text-gray-600 hover:bg-gray-200 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button type="submit" disabled={isLoading || otp.length < 4} className="flex-1 flex justify-center items-center rounded-full bg-[#a82283] px-3 py-3 text-sm font-bold leading-6 text-white shadow-lg hover:bg-[#8a1c6b] active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a82283] disabled:opacity-70">
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
             </form>
        )}

        {authMode === 'email' && (
            <>
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-xs text-gray-400 font-medium">Or continue with</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="flex w-full justify-center items-center rounded-full bg-black px-3 py-3 text-sm font-bold leading-6 text-white shadow-lg hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Connecting...</span>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>


                </div>

                <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                  {isLogin ? 'Not a member? ' : 'Already have an account? '}
                  <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-bold leading-6 text-[#a82283] hover:text-[#8a1c6b] hover:underline">
                    {isLogin ? 'Register now' : 'Sign in'}
                  </button>
                </p>
            </>
        )}
      </div>
    </div>
  );
};
