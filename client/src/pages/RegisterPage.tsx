import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User as UserIcon, PenTool, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'READER' | 'AUTHOR'>('READER');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !username || !displayName || !password) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        username,
        displayName,
        password,
        role,
      });
      addToast('Account created successfully! Welcome to Chronicle.', 'success');
      navigate('/');
    } catch (err: any) {
      addToast(err.message || 'Registration failed', 'error');
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create an account</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Join thousands of developers and writers on Chronicle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            type="text"
            placeholder="Jane Doe"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label="Username"
            type="text"
            placeholder="janedoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="Letters, numbers, underscores and hyphens"
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          {/* Account Role Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
              I want to:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('READER')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  role === 'READER'
                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/80 ring-1 ring-zinc-900 dark:ring-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Stories</span>
                </div>
                <p className="text-[11px] text-zinc-500">Discover and comment on articles</p>
              </button>

              <button
                type="button"
                onClick={() => setRole('AUTHOR')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  role === 'AUTHOR'
                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/80 ring-1 ring-zinc-900 dark:ring-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Write & Publish</span>
                </div>
                <p className="text-[11px] text-zinc-500">Publish stories and access Studio</p>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full mt-2"
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Create Chronicle Account
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
