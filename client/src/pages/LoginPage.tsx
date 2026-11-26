import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await login({ login: loginIdentifier, password });
      addToast('Welcome back!', 'success');
      navigate('/');
    } catch (err: any) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click test credentials handler
  const handleQuickLogin = async (email: string, pass: string) => {
    setLoginIdentifier(email);
    setPassword(pass);
    setIsLoading(true);
    try {
      await login({ login: email, password: pass });
      addToast('Welcome back!', 'success');
      navigate('/');
    } catch (err: any) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-base mx-auto mb-3">
            C
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Welcome back</h1>
          <p className="text-xs text-zinc-500 mt-1">Sign in to your Chronicle account</p>
        </div>

        {/* Demo 1-Click Credentials Banner */}
        <div className="mb-6 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick 1-Click Test Login:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@chronicle.dev', 'Password123!')}
              className="py-1 px-2 rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-medium text-center hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('marcus@chronicle.dev', 'Password123!')}
              className="py-1 px-2 rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-medium text-center hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
            >
              Author
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('alex@example.com', 'Password123!')}
              className="py-1 px-2 rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-medium text-center hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
            >
              Reader
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Username"
            type="text"
            placeholder="name@example.com or username"
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full mt-2"
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
