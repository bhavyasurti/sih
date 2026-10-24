import React, { useRef } from 'react'
import { UserCheck, Mail, ShieldCheck, LogOut, Lock, Calendar, Key, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { auth } from '../services/firebase'
import { usePageEntrance } from '../utils/motion'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const firebaseUser = auth.currentUser
  const pageRef = useRef<HTMLDivElement>(null)

  usePageEntrance(pageRef, [user?.email])

  const creationTime = firebaseUser?.metadata.creationTime
  const providerId = firebaseUser?.providerData[0]?.providerId || 'email/password'
  const isVerified = firebaseUser?.emailVerified

  return (
    <div ref={pageRef} className="space-y-8 max-w-4xl mx-auto">
      {/* 1. EDITORIAL HEADER */}
      <div className="animate-reveal pb-4 border-b border-[#D7DCE5]">
        <div className="eyebrow mb-2">Account Administration</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
          Auditor Profile & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5B60] mt-1">
          Manage your authenticated auditor session, cryptographic identity, and access permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: User Avatar & Session Card (4 Cols) */}
        <div className="animate-reveal md:col-span-4 bg-white border border-[#D7DCE5] rounded-3xl p-6 sm:p-8 text-center shadow-xs ui-card-hover transition-all">
          <div className="w-20 h-20 rounded-2xl bg-[#0A282D] text-white flex items-center justify-center font-display text-3xl font-bold mx-auto mb-4 shadow-sm border border-[#1E4950]">
            {firebaseUser?.photoURL ? (
              <img
                src={firebaseUser.photoURL}
                alt="Profile"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              (user?.name || user?.email || 'U').charAt(0).toUpperCase()
            )}
          </div>

          <h2 className="text-lg font-display font-bold text-[#0A282D] break-words">
            {user?.name || 'Authorized Auditor'}
          </h2>
          <p className="text-xs font-mono text-[#7E8F95] mt-1 break-all">
            {user?.email}
          </p>

          <div className="mt-4 pt-4 border-t border-[#D7DCE5]">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB] font-mono text-[10px] font-bold tracking-wider uppercase">
              Auditor Clearance Active
            </span>
          </div>

          <div className="mt-6">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FFF1F2] hover:bg-[#FEECEC] text-[#E11D48] border border-[#FECDD3] rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>

        {/* Right: Security & Authentication Telemetry (8 Cols) */}
        <div className="md:col-span-8 space-y-6">
          <div className="animate-reveal bg-white border border-[#D7DCE5] rounded-3xl p-6 sm:p-8 shadow-xs ui-card-hover space-y-4 transition-all">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A282D] font-mono flex items-center gap-2 pb-3 border-b border-[#D7DCE5]">
              <Lock size={15} className="text-[#3DB663]" />
              Authentication & Security Clearance
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F2F3F7]">
                <div className="flex items-center gap-2 text-[#7E8F95]">
                  <Mail size={14} />
                  <span>Email Identity</span>
                </div>
                <span className="font-bold text-[#0A282D]">{user?.email || 'Unknown'}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F2F3F7]">
                <div className="flex items-center gap-2 text-[#7E8F95]">
                  <ShieldCheck size={14} />
                  <span>Authentication Provider</span>
                </div>
                <span className="font-bold text-[#3DB663] uppercase">{providerId}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F2F3F7]">
                <div className="flex items-center gap-2 text-[#7E8F95]">
                  <Calendar size={14} />
                  <span>Session Created</span>
                </div>
                <span className="text-[#4A5B60]">{creationTime || 'Current Session'}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F2F3F7]">
                <div className="flex items-center gap-2 text-[#7E8F95]">
                  <Key size={14} />
                  <span>Verification Status</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isVerified
                      ? 'bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB]'
                      : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                  }`}
                >
                  {isVerified ? 'VERIFIED IDENTITY' : 'UNVERIFIED EMAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
