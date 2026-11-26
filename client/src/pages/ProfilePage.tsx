import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Globe,
  Github,
  Twitter,
  Calendar,
  Settings,
  BookOpen,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { User, Post } from '../types';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PostCard } from '../components/blog/PostCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, updateUser } = useAuth();
  const { addToast } = useToast();

  const [profileUser, setProfileUser] = useState<(User & { posts: Post[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'settings'>('stories');

  // Edit profile state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isCurrentUsersProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setIsLoading(true);
      try {
        const data = await authService.getUserProfile(username);
        setProfileUser(data.user as any);
        setDisplayName(data.user.displayName || '');
        setBio(data.user.bio || '');
        setAvatarUrl(data.user.avatarUrl || '');
        setWebsite(data.user.website || '');
        setGithub(data.user.github || '');
        setTwitter(data.user.twitter || '');
      } catch (err: any) {
        addToast(err.message || 'User not found', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username, addToast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const data = await authService.updateProfile({
        displayName,
        bio,
        avatarUrl,
        website,
        github,
        twitter,
      });
      updateUser(data.user);
      setProfileUser((prev) => (prev ? { ...prev, ...data.user } : null));
      addToast('Profile updated successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      addToast('Password changed successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-zinc-400">Loading author profile...</div>;
  }

  if (!profileUser) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold">User Not Found</h2>
        <Link to="/" className="text-sm underline text-zinc-500 mt-2 inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Profile Header Box */}
      <div className="p-6 sm:p-8 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
        <div className="flex items-center gap-5">
          {profileUser.avatarUrl ? (
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-2xl">
              {profileUser.displayName.charAt(0)}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {profileUser.displayName}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {profileUser.role}
              </span>
            </div>
            <p className="text-xs text-zinc-500">@{profileUser.username}</p>
            {profileUser.bio && (
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-w-lg mt-2 leading-relaxed">
                {profileUser.bio}
              </p>
            )}

            {/* Social links */}
            <div className="flex items-center gap-3 text-xs text-zinc-500 pt-2">
              {profileUser.website && (
                <a
                  href={profileUser.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
              {profileUser.github && (
                <a
                  href={`https://github.com/${profileUser.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}
              {profileUser.twitter && (
                <a
                  href={`https://twitter.com/${profileUser.twitter}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>Twitter</span>
                </a>
              )}
              <span className="flex items-center gap-1 text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                Joined {format(new Date(profileUser.createdAt), 'MMM yyyy')}
              </span>
            </div>
          </div>
        </div>

        {isCurrentUsersProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'settings' ? 'stories' : 'settings')}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
          >
            {activeTab === 'settings' ? 'View Stories' : 'Account Settings'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      {isCurrentUsersProfile && (
        <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 text-sm font-medium">
          <button
            onClick={() => setActiveTab('stories')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'stories'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Published Stories ({profileUser.posts?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Security</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      {activeTab === 'stories' ? (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Stories by {profileUser.displayName}
          </h2>

          {!profileUser.posts || profileUser.posts.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-400">No published stories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileUser.posts.map((post) => (
                <PostCard key={post.id} post={{ ...post, author: profileUser as any }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Settings Forms */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile Form */}
          <form
            onSubmit={handleUpdateProfile}
            className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4"
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Edit Public Profile
            </h3>
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <Input
              label="Avatar Image URL"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A brief bio about yourself..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 min-h-[80px]"
              />
            </div>
            <Input
              label="Personal Website"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="GitHub Username"
                placeholder="username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
              <Input
                label="Twitter / X"
                placeholder="handle"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" isLoading={isUpdatingProfile} className="w-full">
              Save Changes
            </Button>
          </form>

          {/* Change Password Form */}
          <form
            onSubmit={handleChangePassword}
            className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 h-fit"
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </h3>
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="outline"
              isLoading={isChangingPassword}
              disabled={!currentPassword || !newPassword}
              className="w-full"
            >
              Update Password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
