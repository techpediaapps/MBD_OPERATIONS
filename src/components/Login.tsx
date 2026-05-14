import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setError('');
      setLoading(true);
      try {
        await login(username, password);
      } catch (err) {
        setError('Invalid username or password');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Pane - Branding */}
      <div className="flex-1 bg-gradient-to-br from-[#801416] to-[#4a0809] flex flex-col items-center justify-center text-white p-12 relative overflow-hidden">
        {/* Abstract Background element */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 blur-3xl pointer-events-none">
          <div className="w-[500px] h-[500px] bg-red-500 rounded-full mix-blend-screen mix-blend-overlay absolute -top-40 -left-40"></div>
          <div className="w-[800px] h-[800px] bg-[#3a0405] rounded-full absolute bottom-[-400px] right-[-200px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
          <div className="w-[30rem] max-w-full h-auto flex items-center justify-center mb-12">
            <Logo className="w-full h-full" variant="full" showText={true} forceWhite={true} />
          </div>
          
          <p className="text-xs tracking-[0.3em] uppercase text-gray-300 font-medium mb-4">
            Mainetti Bangladesh - Hanger
          </p>
          <h1 className="text-5xl font-bold mb-12 leading-tight">
            Operation<br/>
            <span className="text-white">Management</span> System
          </h1>

          <p className="text-sm text-gray-300 max-w-sm mb-12">
            Centralized platform for managing operational teams
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold">
            <span className="px-4 py-1.5 border border-white/20 rounded-full">Production</span>
            <span className="px-4 py-1.5 border border-white/20 rounded-full">Technical</span>
            <span className="px-4 py-1.5 border border-white/20 rounded-full">Quality</span>
            <span className="px-4 py-1.5 border border-white/20 rounded-full">FGS</span>
            <span className="px-4 py-1.5 border border-white/20 rounded-full">RMS</span>
            <span className="px-4 py-1.5 border border-white/20 rounded-full">HR</span>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-md">
          <div className="w-12 h-1 bg-[#801416] mb-8"></div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-10 text-sm">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Username
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username" 
                className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#801416] placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className={`w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-[#801416] placeholder-gray-400 ${error ? 'border-red-500' : 'border-gray-200'}`}
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#801416] hover:bg-[#6b1012] disabled:opacity-50 text-white font-medium py-3 rounded-md transition-colors flex justify-center items-center gap-2 mt-4"
            >
              {loading ? 'Signing in...' : <>Sign In <span aria-hidden="true">&rarr;</span></>}
            </button>
          </form>

          <div className="mt-16 text-center text-xs text-gray-400">
            <p>Mainetti Bangladesh • Operation Management System v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
