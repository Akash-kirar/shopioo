import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { loginUser, registerUser } from '../utils';

interface AuthProps {
  onLogin: (user: User) => void;
}

const ShopiooLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Handle */}
        <path d="M8 6V4a4 4 0 0 1 8 0v2" />
        {/* Bag Body - Open Bottom */}
        <path d="M3 6h18v13a2 2 0 0 1-2 2h-4" />
        <path d="M9 21H5a2 2 0 0 1-2-2V6" />
        {/* Location Pin Inside */}
        <path d="M12 18.5c0 0-4-3-4-6.5a4 4 0 0 1 8 0c0 3.5-4 6.5-4 6.5Z" />
        <circle cx="12" cy="12" r="1.5" />
    </svg>
);

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        if (isLogin) {
          const user = await loginUser(email, password);
          if (user) {
            onLogin(user);
          } else {
            setError('Invalid email or password.');
          }
        } else {
          const newUser = { id: Date.now().toString(), name, email, password, role: 'user' as UserRole };
          if (await registerUser(newUser)) {
            onLogin(newUser);
          } else {
            setError('User already exists.');
          }
        }
    } catch(e) {
        setError("An error occurred. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setTimeout(async () => {
        const googleEmail = "alex.doe@gmail.com";
        const googlePassword = "google_auth_token_simulated"; 
        
        const existingUser = await loginUser(googleEmail, googlePassword);
        
        if (existingUser) {
            onLogin(existingUser);
        } else {
            const newUser: User = {
                id: 'google_' + Date.now(),
                name: "Alex Doe",
                email: googleEmail,
                password: googlePassword,
                role: 'user',
            };
            await registerUser(newUser);
            onLogin(newUser);
        }
        setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-6">
            <div className="bg-orange-50 p-3 rounded-2xl mb-2">
                <ShopiooLogo className="w-12 h-12" />
            </div>
            <div className="flex items-baseline leading-none">
                <span className="text-3xl font-black text-[#F97316] tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>Shop</span>
                <span className="text-3xl font-black text-[#0f172a] tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>ioo</span>
            </div>
        </div>

        <p className="text-center text-sm font-medium text-gray-500 mt-2">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
             <div>
               <label className="block text-xs font-bold text-gray-900 mb-1 ml-1">Full Name</label>
               <input type="text" required value={name} onChange={e => setName(e.target.value)} className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 px-4 bg-gray-50" />
             </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 ml-1">Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 px-4 bg-gray-50" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-900 mb-1 ml-1">Password</label>
            </div>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#a82283] sm:text-sm sm:leading-6 px-4 bg-gray-50" />
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}

          <div>
            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-full bg-[#a82283] px-3 py-3 text-sm font-bold leading-6 text-white shadow-lg hover:bg-[#8a1c6b] active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a82283] disabled:opacity-70">
              {isLoading ? 'Processing...' : (isLogin ? 'Sign in' : 'Register')}
            </button>
          </div>
        </form>

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-gray-400 font-medium">Or continue with</span>
            </div>
        </div>

        <div>
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
      </div>
    </div>
  );
};