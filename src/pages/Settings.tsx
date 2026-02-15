import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  LogOut,
  Loader2,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import authService, { Session } from '../services/authService';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'appearance';

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await authService.getSessions();
      setSessions(data);
    } catch {
      // Ignore errors
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      await authService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // Ignore errors
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await authService.revokeAllSessions();
      await loadSessions(); // Reload to show current session only
    } catch {
      // Ignore errors
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex border-b border-gray-200">
            {/* Tab navigation */}
            <nav className="w-48 border-r border-gray-200 p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'security') {
                      loadSessions();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}

              <hr className="my-4 border-gray-200" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>

            {/* Tab content */}
            <div className="flex-1 p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Profile Information
                    </h2>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-semibold text-indigo-600">
                          {currentUser?.firstName?.charAt(0) ||
                            currentUser?.email?.charAt(0).toUpperCase() ||
                            '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {currentUser?.displayName ||
                            currentUser?.firstName ||
                            currentUser?.email}
                        </p>
                        <p className="text-sm text-gray-500">{currentUser?.email}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          defaultValue={currentUser?.firstName || ''}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          defaultValue={currentUser?.lastName || ''}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue={currentUser?.email || ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>

                    <button className="mt-6 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Security Settings
                    </h2>

                    {/* Change Password */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Change Password
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Update your password to keep your account secure.
                      </p>
                      <button className="px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Change Password
                      </button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-gray-900">
                          Two-Factor Authentication
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Add an extra layer of security to your account.
                      </p>
                      <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        Enable 2FA
                      </button>
                    </div>

                    {/* Active Sessions */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Active Sessions
                          </h3>
                          <p className="text-sm text-gray-500">
                            Manage your active sessions across devices.
                          </p>
                        </div>
                        <button
                          onClick={handleRevokeAllSessions}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Sign out all devices
                        </button>
                      </div>

                      {loadingSessions ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                      ) : sessions.length > 0 ? (
                        <div className="space-y-3">
                          {sessions.map((session) => (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {session.deviceInfo}
                                    {session.isCurrent && (
                                      <span className="ml-2 text-xs text-green-600">
                                        (Current)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {session.ipAddress} · Last active{' '}
                                    {new Date(session.lastActiveAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {!session.isCurrent && (
                                <button
                                  onClick={() => handleRevokeSession(session.id)}
                                  disabled={revokingSession === session.id}
                                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                                >
                                  {revokingSession === session.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Revoke'
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          No active sessions found.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Push Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive push notifications for new messages
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Email Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive email for missed messages
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Sound</p>
                        <p className="text-sm text-gray-500">
                          Play sound for new messages
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Appearance
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button className="p-4 border-2 border-indigo-600 rounded-lg text-center">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded mx-auto mb-2" />
                        <span className="text-sm font-medium text-gray-900">
                          Light
                        </span>
                      </button>
                      <button className="p-4 border border-gray-200 rounded-lg text-center hover:border-gray-300 transition-colors">
                        <div className="w-8 h-8 bg-gray-900 rounded mx-auto mb-2" />
                        <span className="text-sm font-medium text-gray-900">
                          Dark
                        </span>
                      </button>
                      <button className="p-4 border border-gray-200 rounded-lg text-center hover:border-gray-300 transition-colors">
                        <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-900 rounded mx-auto mb-2" />
                        <span className="text-sm font-medium text-gray-900">
                          System
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
