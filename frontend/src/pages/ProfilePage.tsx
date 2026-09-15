import React from 'react'
import { UserCheck, Mail, ShieldCheck, LogOut, ShieldAlert, Cpu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { auth } from '../services/firebase'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const firebaseUser = auth.currentUser

  const creationTime = firebaseUser?.metadata.creationTime
  const providerId = firebaseUser?.providerData[0]?.providerId || 'email/password'
  const isVerified = firebaseUser?.emailVerified

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">My Profile</h1>
        <p className="text-text-secondary text-sm">
          Manage your authenticated session and account security details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-panel border border-surface-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-brand-primary/10 border-2 border-brand-primary/30 text-brand-bright flex items-center justify-center text-3xl font-bold mb-4">
              {firebaseUser?.photoURL ? (
                <img src={firebaseUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                (user?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <h2 className="text-xl font-semibold text-text-primary break-all">{user?.name || 'User'}</h2>
            <p className="text-sm text-text-secondary mt-1 break-all">{user?.email}</p>
            <div className="mt-6 w-full">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-status-critical/10 hover:bg-status-critical/20 text-status-critical border border-status-critical/20 rounded-lg transition-colors font-medium text-sm"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Account Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Account Details */}
          <div className="bg-surface-panel border border-surface-border rounded-xl overflow-hidden shadow-sm">
            <div className="border-b border-surface-border px-6 py-4 flex items-center gap-2">
              <UserCheck size={18} className="text-brand-bright" />
              <h3 className="font-semibold text-text-primary">Account Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-primary rounded-lg p-3 border border-surface-border">
                  <div className="text-xs text-text-secondary mb-1">Full Name</div>
                  <div className="font-medium text-text-primary break-all">{user?.name || 'Not provided'}</div>
                </div>
                <div className="bg-surface-primary rounded-lg p-3 border border-surface-border">
                  <div className="text-xs text-text-secondary mb-1">Email Address</div>
                  <div className="font-medium text-text-primary flex items-center gap-2 break-all">
                    {user?.email}
                  </div>
                </div>
                <div className="bg-surface-primary rounded-lg p-3 border border-surface-border sm:col-span-2">
                  <div className="text-xs text-text-secondary mb-1">Account Created</div>
                  <div className="font-medium text-text-primary">
                    {creationTime ? new Date(creationTime).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-surface-panel border border-surface-border rounded-xl overflow-hidden shadow-sm">
            <div className="border-b border-surface-border px-6 py-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-bright" />
              <h3 className="font-semibold text-text-primary">Security</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-primary rounded-lg p-3 border border-surface-border">
                  <div className="text-xs text-text-secondary mb-1">Authentication Method</div>
                  <div className="font-medium text-text-primary flex items-center gap-2">
                    <Cpu size={14} className="text-brand-bright" />
                    {providerId === 'password' ? 'Email & Password' : providerId}
                  </div>
                </div>
                <div className="bg-surface-primary rounded-lg p-3 border border-surface-border">
                  <div className="text-xs text-text-secondary mb-1">Email Verification</div>
                  <div className="font-medium flex items-center gap-2">
                    {isVerified ? (
                      <>
                        <ShieldCheck size={14} className="text-status-success" />
                        <span className="text-status-success">Verified</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={14} className="text-amber-400" />
                        <span className="text-amber-400">Unverified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
