import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { updateProfile as updateProfileAPI } from '../api/apiCalls';
import {
    User,
    Lock,
    Trash2,
    Save,
    LogOut,
    Loader2,
    Eye,
    EyeOff,
} from 'lucide-react';

export default function AccountSettings() {
    const navigate = useNavigate();

    // ---------- STATES ----------
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [notifications, setNotifications] = useState({
        email: true,
        marketing: false,
        system: true,
    });

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
    const [language, setLanguage] = useState('English (US)');
    const [timezone, setTimezone] = useState('UTC');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // ---------- LOAD USER DATA ----------
    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            try {
                const { data: { user }, error: userErr } = await supabase.auth.getUser();
                if (userErr) throw userErr;
                if (!user) return;

                setUserId(user.id);
                setEmail(user.email || '');
                // fetch expanded profile columns (safe to exist after migration)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, first_name, last_name, theme, density, language, timezone, notifications, two_factor_enabled')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    setDisplayName(profile.display_name || '');
                    setFirstName(profile.first_name || '');
                    setLastName(profile.last_name || '');
                    setTheme((profile as any).theme || 'system');
                    setDensity((profile as any).density || 'comfortable');
                    setLanguage((profile as any).language || 'English (US)');
                    setTimezone((profile as any).timezone || 'UTC');
                    setNotifications((profile as any).notifications || { email: true, marketing: false, system: true });
                    setTwoFactorEnabled(!!(profile as any).two_factor_enabled);
                } else {
                    // optional: fallback to auth metadata if profiles row missing
                    setDisplayName(user.user_metadata?.display_name || '');
                    setFirstName(user.user_metadata?.first_name || '');
                    setLastName(user.user_metadata?.last_name || '');
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load account data.');
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    // ---------- HELPERS ----------
    const initials = (() => {
        const name = displayName || `${firstName} ${lastName}`.trim();
        return name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
    })();

    const saveProfile = async () => {
        if (!userId) return setError('No user id available.');
        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            // Update auth user (email + metadata). If email changed, Supabase may send confirmation.
            const authPayload: any = {
                data: {
                    display_name: displayName || null,
                    first_name: firstName || null,
                    last_name: lastName || null,
                },
            };
            // include email in auth update to persist any email edits
            if (email) authPayload.email = email;

            const { error: authErr } = await supabase.auth.updateUser(authPayload);
            if (authErr) throw authErr;

            // Update profile via backend API
            const profilePayload = {
                display_name: displayName || null,
                first_name: firstName || null,
                last_name: lastName || null,
                theme,
                density,
                language,
                timezone,
                notifications,
                two_factor_enabled: twoFactorEnabled,
            };

            const backendResult = await updateProfileAPI(profilePayload);
            if (!backendResult.success) {
                const errorMsg = backendResult.error || 'Failed to update profile in backend';
                console.error('Backend profile update error:', errorMsg, backendResult);
                throw new Error(errorMsg);
            }

            // Also update in Supabase for immediate local consistency
            const { error: upsertErr } = await supabase.from('profiles').upsert({
                id: userId,
                display_name: displayName || null,
                first_name: firstName || null,
                last_name: lastName || null,
                theme,
                density,
                language,
                timezone,
                notifications,
                two_factor_enabled: twoFactorEnabled,
            });
            if (upsertErr) {
                console.warn('Supabase upsert error (non-fatal):', upsertErr);
            }

            // Trigger backend sync via Supabase RPC (optional, for any listeners)
            const { error: syncErr } = await supabase.rpc('sync_profile', { p_user_id: userId });
            if (syncErr) {
                console.warn('sync_profile RPC error (non-fatal):', syncErr);
            }

            // Re-fetch to sync local state
            const { data: refreshedProfile, error: refreshErr } = await supabase
                .from('profiles')
                .select('display_name, first_name, last_name, theme, density, language, timezone, notifications, two_factor_enabled')
                .eq('id', userId)
                .single();
            if (refreshErr && refreshErr.code !== 'PGRST116') throw refreshErr;
            if (refreshedProfile) {
                setDisplayName(refreshedProfile.display_name || '');
                setFirstName(refreshedProfile.first_name || '');
                setLastName(refreshedProfile.last_name || '');
                setTheme((refreshedProfile.theme as any) || 'system');
                setDensity((refreshedProfile.density as any) || 'comfortable');
                setLanguage((refreshedProfile.language as any) || 'English (US)');
                setTimezone((refreshedProfile.timezone as any) || 'UTC');
                setNotifications((refreshedProfile.notifications as any) || { email: true, marketing: false, system: true });
                setTwoFactorEnabled(!!refreshedProfile.two_factor_enabled);
            }

            setMessage('Profile and settings saved successfully.');
        } catch (err: any) {
            setError(err?.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    // ---------- STYLES ----------
    const btnPrimary = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition';
    const btnSecondary = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200 transition';
    const btnDanger = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-sm text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 transition';
    const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
    const cardClass = 'border border-gray-200 rounded-xl bg-white p-6 shadow-sm';

    // ---------- TOGGLE COMPONENT ----------
    const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
    );

    // ---------- LOADING STATE ----------
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading account...
            </div>
        );
    }

    // ---------- CLEAN LAYOUT ----------
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* PROFILE CARD */}
            <section className={`${cardClass} flex flex-col items-center text-center relative p-8`}>
                <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white opacity-70 rounded-xl pointer-events-none" />
                <div className="relative -mt-16 mb-4">
                    <div className="h-28 w-28 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-4xl shadow-xl border-4 border-white">
                        {initials}
                    </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 z-10">{displayName || `${firstName} ${lastName}`.trim() || 'Unnamed User'}</h2>
                <p className="text-sm text-gray-600 mb-5 z-10">{email}</p>

                <div className="flex flex-wrap justify-center gap-4 z-10">
                    <button onClick={saveProfile} disabled={saving} className={btnPrimary}>
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/login');
                        }}
                        className={btnSecondary}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </section>

            {/* ALL OTHER SECTIONS (left-aligned, same width as profile) */}
            <div className="space-y-6">
                {/* PERSONAL INFO */}
                <section className={cardClass}>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-primary-600" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className={labelClass}>First Name</label>
                            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Last Name</label>
                            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-0">
                        <label className={labelClass}>Change Email</label>
                        <div className="flex gap-3 mt-1">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* SECURITY */}
                <section className={cardClass}>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Lock className="h-5 w-5 text-primary-600" /> Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Two-Factor Authentication</label>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-700">Enable 2FA for extra security</p>
                                <Toggle checked={twoFactorEnabled} onChange={setTwoFactorEnabled} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Password</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} readOnly value="••••••••" className={inputClass} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* DANGER ZONE */}
                <section className={cardClass + ' border-red-200 bg-red-50'}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Danger Zone
                        </h3>
                    </div>

                    <p className="text-sm text-red-700 mb-4">
                        Deleting your account will permanently remove all your data. This cannot be undone.
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                const confirmed = window.confirm(
                                    'Are you sure you want to permanently delete your account? This action cannot be undone.'
                                );
                                if (!confirmed) return;

                                setSaving(true);
                                setError(null);
                                setMessage(null);

                                try {
                                    const { error } = await supabase.rpc('delete_user');
                                    if (error) throw error;

                                    await supabase.auth.signOut();
                                    navigate('/goodbye');
                                } catch (err: any) {
                                    setError(err?.message || 'Failed to delete account.');
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            className={btnDanger}
                        >
                            <Trash2 className="h-4 w-4" />
                            {saving ? 'Deleting...' : 'Delete Account'}
                        </button>
                    </div>
                </section>

                {/* MESSAGES */}
                {message && <div className="text-sm text-green-700">{message}</div>}
                {error && <div className="text-sm text-red-700">{error}</div>}
            </div>
        </div>
    );
}
