'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Lock, Camera, TrendingUp, Award, LogOut, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { usersApi } from '@/lib/api';
import Link from 'next/link';
import { fadeInUp, staggerContainer, EASE_OUT_EXPO } from '@/lib/animations';

interface Stats {
  totalPoses: number;
  weeklyPoses: number;
  averageScore: number;
  topScore: number;
}

function ProfileContent() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setForm({ firstName: user.firstName, lastName: user.lastName });
    usersApi.stats().then(({ data }) => setStats(data)).catch(() => {});
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await usersApi.update({ firstName: form.firstName, lastName: form.lastName });
      await refreshUser();
      setProfileMsg('Profile updated successfully!');
      setEditing(false);
    } catch {
      setProfileMsg('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) {
      setPwMsg('New password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    setPwMsg('');
    try {
      await usersApi.changePassword(pwForm);
      setPwMsg('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setPwMsg(axErr?.response?.data?.error || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading || !user) return null;

  const statCards = [
    { label: 'Total Poses', value: stats?.totalPoses ?? '–', icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'This Week', value: stats?.weeklyPoses ?? '–', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Avg Score', value: stats?.averageScore ? `${stats.averageScore}%` : '–', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Top Score', value: stats?.topScore ? `${stats.topScore}%` : '–', icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <main className="min-h-screen pt-8 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="btn-ghost py-2 px-3" aria-label="Back to dashboard">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
            Profile
          </h1>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-6"
        >
          {/* Avatar + Name */}
          <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO} className="glass-card p-8 flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#050A18] flex items-center justify-center">
                <CheckCircle size={10} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted text-sm">{user.email}</p>
              <span className="tag tag-blue mt-2">{user.role}</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO} className="grid grid-cols-2 gap-4">
            {statCards.map(c => (
              <div key={c.label} className="glass-card p-5">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${c.bg}`}>
                  <c.icon size={16} className={c.color} />
                </div>
                <p className="text-muted text-xs">{c.label}</p>
                <p className="text-xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>{c.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO}>
            <div className="flex gap-2 glass-card p-1.5 w-fit mb-6">
              {(['profile', 'security'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab ? 'bg-blue-500 text-white' : 'text-muted hover:text-white'
                  }`}
                  aria-pressed={activeTab === tab}
                >
                  {tab === 'profile' ? <User size={14} /> : <Lock size={14} />}
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'profile' && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Personal Info</h3>
                  {!editing && (
                    <button onClick={() => setEditing(true)} className="btn-ghost py-1.5 px-3 text-sm gap-1.5">
                      <Edit2 size={13} /> Edit
                    </button>
                  )}
                </div>

                {profileMsg && (
                  <div className={`flex items-center gap-2 p-3 mb-4 rounded-xl text-sm ${
                    profileMsg.includes('success') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`} role="status">
                    {profileMsg.includes('success') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {profileMsg}
                  </div>
                )}

                <form onSubmit={saveProfile} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="profile-fname" className="block text-xs text-muted mb-1.5">First name</label>
                      <input
                        id="profile-fname"
                        value={form.firstName}
                        onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                        className="input-field"
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-lname" className="block text-xs text-muted mb-1.5">Last name</label>
                      <input
                        id="profile-lname"
                        value={form.lastName}
                        onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                        className="input-field"
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Email address</label>
                    <input value={user.email} className="input-field opacity-60" disabled aria-readonly="true" />
                  </div>

                  {editing && (
                    <div className="flex gap-3">
                      <button type="submit" className="btn-primary" disabled={savingProfile}>
                        {savingProfile ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="glass-card p-6">
                <h3 className="font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>Change Password</h3>

                {pwMsg && (
                  <div className={`flex items-center gap-2 p-3 mb-4 rounded-xl text-sm ${
                    pwMsg.includes('success') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`} role="status">
                    {pwMsg.includes('success') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {pwMsg}
                  </div>
                )}

                <form onSubmit={changePassword} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="current-pw" className="block text-xs text-muted mb-1.5">Current password</label>
                    <input
                      id="current-pw"
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                      className="input-field"
                      autoComplete="current-password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-pw" className="block text-xs text-muted mb-1.5">New password</label>
                    <input
                      id="new-pw"
                      type="password"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                      className="input-field"
                      autoComplete="new-password"
                      placeholder="Min. 8 chars"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-fit" disabled={savingPw}>
                    {savingPw ? 'Changing…' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>

          {/* Sign Out */}
          <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO}>
            <button
              onClick={logout}
              className="btn-ghost w-full justify-center gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10"
              aria-label="Sign out of account"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}
