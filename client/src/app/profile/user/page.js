'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// --- ICONS ---
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const TicketIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M18 12h.01"/></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);

function UserProfile() {
  const router = useRouter();
  const { user: authUser, logout, updatePasswordFunc, updateEmailFunc, reauthenticate ,deleteAccount } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile'); 
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Re-Auth Modal State
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null); 

  const [statusMsg, setStatusMsg] = useState({ type: '', msg: '' });

  const glassCard = "bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl";
  const glassInput = "w-full p-3 bg-white/30 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition backdrop-blur-sm";

  useEffect(() => {
    if (!authUser?.uid) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${authUser.uid}`);
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setUserData(data);
        setNewName(data.name);
        setNewEmail(data.email);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [authUser?.uid]);

  useEffect(() => {
    if (authUser?.mongoEmailSynced) {
      setStatusMsg({ type: 'success', msg: 'Email verified and updated in database successfully.' });
    }
  }, [authUser?.mongoEmailSynced]);

  // --- RE-AUTHENTICATION LOGIC ---
  const handleReauthSubmit = async (e) => {
    e.preventDefault();
    try {
      await reauthenticate(reauthPassword);
      setShowReauthModal(false);
      setReauthPassword('');
      setStatusMsg({ type: 'success', msg: 'Identity verified. Retrying update...' });
      
      if (pendingAction === 'email') executeEmailUpdate();
      if (pendingAction === 'password') executePasswordUpdate();
      if (pendingAction === 'delete') executeDeleteAccount();
      
    } catch (err) {
      console.error(err);
      alert("Incorrect password. Please try again.");
    }
  };

  // --- 1. UPDATE NAME (MongoDB) ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', msg: '' });
    try {
      const res = await fetch(`/api/users/${userData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setUserData(updated.user);
      setIsEditingProfile(false);
      setStatusMsg({ type: 'success', msg: 'Profile updated successfully!' });
    } catch (err) {
      setStatusMsg({ type: 'error', msg: err.message });
    }
  };

  // --- 2. UPDATE EMAIL (Firebase + MongoDB) ---
  const handleUpdateEmail = (e) => {
    e.preventDefault();
    if(newEmail === userData.email) return;
    executeEmailUpdate();
  };

  const executeEmailUpdate = async () => {
    try {
      setStatusMsg({ type: 'loading', msg: 'Processing email update...' });
      
      // A. Update Firebase (Sends verification email)
      await updateEmailFunc(newEmail);

      // IMPORTANT: MongoDB should update ONLY after Firebase email is actually changed
      // (after the user clicks the verification link). That sync happens on next login/refresh.
      setStatusMsg({
        type: 'success',
        msg: `Verification link sent to ${newEmail}. After you verify, please log in again to finish updating your account.`
      });
      setPendingAction(null);

      // Simple UX: sign out and send user to login.
      await logout();
      router.push('/login?emailUpdate=sent');

    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setPendingAction('email');
        setShowReauthModal(true);
      } else {
        setStatusMsg({ type: 'error', msg: err.message });
      }
    }
  };

  // --- 3. UPDATE PASSWORD (Firebase) ---
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if(newPassword.length < 6) {
        setStatusMsg({ type: 'error', msg: 'Password must be at least 6 characters' });
        return;
    }
    executePasswordUpdate();
  };

  const executePasswordUpdate = async () => {
    try {
      setStatusMsg({ type: 'loading', msg: 'Updating password...' });
      await updatePasswordFunc(newPassword);
      setNewPassword('');
      setStatusMsg({ type: 'success', msg: 'Password changed successfully!' });
      setPendingAction(null);
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setPendingAction('password');
        setShowReauthModal(true);
      } else {
        setStatusMsg({ type: 'error', msg: err.message });
      }
    }
  };

  // --- 4. DELETE ACCOUNT ---
  const executeDeleteAccount = async () => {
    try {
      setStatusMsg({ type: 'loading', msg: 'Deleting account...' });

      // Delete Firebase user first; this can require a recent login.
      await deleteAccount();

      // Best-effort cleanup of Mongo user document.
      const res = await fetch(`/api/users/${userData._id}`, { method: 'DELETE' });
      if (!res.ok) {
        console.warn('Mongo delete failed:', await res.text());
      }

      await logout();
      router.push('/');
    } catch (err) {
      if (err?.code === 'auth/requires-recent-login') {
        setPendingAction('delete');
        setShowReauthModal(true);
        setStatusMsg({ type: 'error', msg: 'Please confirm your password to delete your account.' });
      } else {
        setStatusMsg({ type: 'error', msg: err?.message || 'Delete failed' });
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This action is permanent.")) return;
    executeDeleteAccount();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-br bg-white/20 p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto relative">
          
          {/* RE-AUTH MODAL */}
          {showReauthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full m-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Security Check</h3>
                <p className="text-gray-500 mb-4 text-sm">For your security, please verify your password to continue.</p>
                <form onSubmit={handleReauthSubmit} className="space-y-4">
                   <input 
                      type="password" 
                      placeholder="Enter your current password"
                      value={reauthPassword}
                      onChange={(e) => setReauthPassword(e.target.value)}
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      autoFocus
                   />
                   <div className="flex gap-3 justify-end">
                      <button type="button" onClick={() => { setShowReauthModal(false); setPendingAction(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Verify & Continue</button>
                   </div>
                </form>
              </div>
            </div>
          )}

          {/* PAGE CONTENT */}
          <div className="mb-8 ml-2">
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account preferences</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-72 flex-shrink-0">
               <nav className={`${glassCard} overflow-hidden p-2`}>
                 <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}><UserIcon /> General Profile</button>
                 <button onClick={() => router.push('/dashboard/user')} className="w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium text-gray-600 hover:bg-white/50 transition-all"><TicketIcon /> My Tickets</button>
                 <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}><LockIcon /> Security</button>
                 <div className="h-px bg-gray-200/50 my-2 mx-2"></div>
                 <button onClick={() => setActiveTab('danger')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'danger' ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-50'}`}><TrashIcon /> Delete Account</button>
               </nav>
               <button onClick={async () => { await logout(); router.push('/login'); }} className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 ${glassCard} text-gray-700 hover:bg-white hover:text-indigo-600 transition-all text-sm font-medium group`}><LogOutIcon /> Sign Out</button>
            </aside>

            <main className="flex-1">
              {statusMsg.msg && (
                <div className={`mb-6 p-4 rounded-xl border backdrop-blur-md shadow-sm text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-50/80 border-green-200 text-green-800' : statusMsg.type === 'error' ? 'bg-red-50/80 border-red-200 text-red-800' : 'bg-blue-50/80 border-blue-200 text-blue-800'}`}>
                  {statusMsg.msg}
                </div>
              )}

              {/* TABS */}
              {activeTab === 'profile' && (
                <div className={`${glassCard} p-6 md:p-8 animate-fade-in`}>
                  <div className="flex justify-between items-center mb-8">
                    <div><h2 className="text-xl font-bold text-gray-800">Personal Information</h2></div>
                    {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition">Edit</button>}
                  </div>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        {isEditingProfile ? <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={glassInput} /> : <div className="text-lg font-medium text-gray-800 pl-1">{userData?.name}</div>}
                    </div>
                    {isEditingProfile && (
                      <div className="flex items-center gap-3 pt-6 border-t border-gray-200/50">
                        <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition font-medium text-sm">Save Changes</button>
                        <button type="button" onClick={() => { setIsEditingProfile(false); setNewName(userData.name); }} className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6 animate-fade-in">
                  <div className={`${glassCard} p-6 md:p-8`}>
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Email Address</h2>
                    <form onSubmit={handleUpdateEmail} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Email</label>
                            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={glassInput} required />
                        </div>
                        <button type="submit" className="w-full md:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition shadow-sm whitespace-nowrap">Update Email</button>
                    </form>
                  </div>
                  <div className={`${glassCard} p-6 md:p-8`}>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Password</h2>
                    <p className="text-sm text-gray-500 mb-6">Enter a new password (min 6 chars).</p>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className={glassInput} minLength={6} />
                        <div className="flex justify-end">
                            <button type="submit" disabled={!newPassword} className="px-6 py-2.5 bg-indigo-600 disabled:bg-gray-300 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition font-medium text-sm">Change Password</button>
                        </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className={`${glassCard} border-red-200 p-6 md:p-8 animate-fade-in relative overflow-hidden`}>
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                   <h2 className="text-xl font-bold text-red-600 mb-4">Delete Account</h2>
                   <p className="text-gray-600 mb-8 max-w-lg">This is permanent.</p>
                   <div className="flex justify-end">
                     <button onClick={handleDelete} className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition font-medium shadow-sm">Permanently Delete Account</button>
                   </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default UserProfile;