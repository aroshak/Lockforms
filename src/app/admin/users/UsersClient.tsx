'use client';

import { useState } from 'react';
import {
    Users, Plus, Search, Shield, ShieldAlert, ShieldCheck,
    MoreHorizontal, Unlock, KeyRound, UserX, UserCheck,
    AlertCircle, X, Loader2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    createUser, toggleUserActive, unlockAccount,
    resetPassword, assignRole, removeRole
} from './actions';

// ── Types ────────────────────────────────────────────────────────────────

interface UserRole {
    id: string;
    roleId: string;
    role: {
        id: string;
        name: string;
        description: string | null;
    };
}

interface UserRecord {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    isSSOUser: boolean;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    roles: UserRole[];
    organization: { name: string } | null;
}

interface RoleRecord {
    id: string;
    name: string;
    description: string | null;
}

interface UsersClientProps {
    users: UserRecord[];
    roles: RoleRecord[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-AU', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function isLocked(user: UserRecord): boolean {
    return !!(user.lockedUntil && new Date(user.lockedUntil) > new Date());
}

function getStatusInfo(user: UserRecord) {
    if (isLocked(user)) {
        return { label: 'Locked', classes: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    }
    if (!user.isActive) {
        return { label: 'Inactive', classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    }
    return { label: 'Active', classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
}

function getRoleIcon(roleName: string) {
    if (roleName === 'Super Admin') return <ShieldAlert className="w-3 h-3" />;
    if (roleName === 'Admin') return <ShieldCheck className="w-3 h-3" />;
    return <Shield className="w-3 h-3" />;
}

function getInitials(user: UserRecord): string {
    if (user.firstName && user.lastName) {
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.name) return user.name.slice(0, 2).toUpperCase();
    return user.email.slice(0, 2).toUpperCase();
}

// ── Main Component ───────────────────────────────────────────────────────

export function UsersClient({ users, roles }: UsersClientProps) {
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showResetModal, setShowResetModal] = useState<string | null>(null);
    const [showRoleModal, setShowRoleModal] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const filteredUsers = users.filter(u => {
        const q = search.toLowerCase();
        return (
            u.email.toLowerCase().includes(q) ||
            (u.name?.toLowerCase().includes(q)) ||
            (u.firstName?.toLowerCase().includes(q)) ||
            (u.lastName?.toLowerCase().includes(q)) ||
            u.roles.some(r => r.role.name.toLowerCase().includes(q))
        );
    });

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handleToggleActive = async (userId: string) => {
        setActionLoading(userId);
        const result = await toggleUserActive(userId);
        if (result.success) showFeedback('success', 'User status updated.');
        else showFeedback('error', result.error ?? 'Failed.');
        setActionLoading(null);
    };

    const handleUnlock = async (userId: string) => {
        setActionLoading(userId);
        const result = await unlockAccount(userId);
        if (result.success) showFeedback('success', 'Account unlocked.');
        else showFeedback('error', result.error ?? 'Failed.');
        setActionLoading(null);
    };


    return (
        <div className="space-y-8 p-8">
            {/* Feedback Toast */}
            {feedback && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2 ${
                    feedback.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {feedback.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-tight">Users</h2>
                    <p className="text-muted-foreground mt-1">Manage team members and access roles.</p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="shadow-lg shadow-primary/20 rounded-xl px-6 h-11 font-semibold"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Active</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{users.filter(u => u.isActive && !isLocked(u)).length}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Locked</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{users.filter(u => isLocked(u)).length}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Inactive</p>
                    <p className="text-2xl font-bold text-slate-400 mt-1">{users.filter(u => !u.isActive).length}</p>
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-card rounded-lg overflow-hidden">
                {/* Table header with search */}
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                    <h4 className="font-bold text-white">Team Members</h4>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            className="pl-9 w-64 bg-slate-800/50 border-white/[0.06] text-sm"
                            placeholder="Search users or roles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-slate-400 border-b border-white/[0.06] bg-slate-800/20">
                            <th className="px-6 py-4 font-semibold">User</th>
                            <th className="px-6 py-4 font-semibold">Role</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Last Login</th>
                            <th className="px-6 py-4 font-semibold">Created</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/[0.04]">
                        {filteredUsers.map((user) => {
                            const status = getStatusInfo(user);
                            const isExpanded = expandedUser === user.id;
                            return (
                                <tr
                                    key={user.id}
                                    className="hover:bg-slate-800/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                                {getInitials(user)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">
                                                    {user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}
                                                </p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.length > 0 ? user.roles.map((ur) => (
                                                <span
                                                    key={ur.id}
                                                    className="inline-flex items-center gap-1 rounded bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary uppercase"
                                                >
                                                    {getRoleIcon(ur.role.name)}
                                                    {ur.role.name}
                                                </span>
                                            )) : (
                                                <span className="text-xs text-slate-500 italic">No role</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${status.classes}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">
                                        {formatDate(user.lastLoginAt)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Expand/Actions menu */}
                                            <div className="relative">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-8 h-8 hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>

                                                {isExpanded && (
                                                    <div className="absolute right-0 top-full mt-1 w-52 rounded-lg glass border border-white/10 shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-2">
                                                        {/* Assign Role */}
                                                        <button
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
                                                            onClick={() => {
                                                                setShowRoleModal(user.id);
                                                                setExpandedUser(null);
                                                            }}
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                            Manage Roles
                                                        </button>

                                                        {/* Reset Password */}
                                                        <button
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
                                                            onClick={() => {
                                                                setShowResetModal(user.id);
                                                                setExpandedUser(null);
                                                            }}
                                                        >
                                                            <KeyRound className="w-4 h-4" />
                                                            Reset Password
                                                        </button>

                                                        {/* Unlock (if locked) */}
                                                        {isLocked(user) && (
                                                            <button
                                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                                                                onClick={() => {
                                                                    handleUnlock(user.id);
                                                                    setExpandedUser(null);
                                                                }}
                                                                disabled={actionLoading === user.id}
                                                            >
                                                                <Unlock className="w-4 h-4" />
                                                                Unlock Account
                                                            </button>
                                                        )}

                                                        <div className="border-t border-white/[0.06] my-1" />

                                                        {/* Toggle Active */}
                                                        <button
                                                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                                                                user.isActive
                                                                    ? 'text-red-400 hover:bg-red-500/10'
                                                                    : 'text-emerald-400 hover:bg-emerald-500/10'
                                                            }`}
                                                            onClick={() => {
                                                                handleToggleActive(user.id);
                                                                setExpandedUser(null);
                                                            }}
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            {user.isActive ? (
                                                                <><UserX className="w-4 h-4" /> Deactivate</>
                                                            ) : (
                                                                <><UserCheck className="w-4 h-4" /> Activate</>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">
                                        {search ? 'No users match your search.' : 'No users found.'}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Click-away overlay for dropdown */}
            {expandedUser && (
                <div className="fixed inset-0 z-40" onClick={() => setExpandedUser(null)} />
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <CreateUserModal
                    roles={roles}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={(msg) => showFeedback('success', msg)}
                    onError={(msg) => showFeedback('error', msg)}
                />
            )}

            {/* Reset Password Modal */}
            {showResetModal && (
                <ResetPasswordModal
                    userId={showResetModal}
                    onClose={() => setShowResetModal(null)}
                    onSuccess={(msg) => showFeedback('success', msg)}
                    onError={(msg) => showFeedback('error', msg)}
                />
            )}

            {/* Manage Roles Modal */}
            {showRoleModal && (
                <ManageRolesModal
                    userId={showRoleModal}
                    user={users.find(u => u.id === showRoleModal)!}
                    roles={roles}
                    onClose={() => setShowRoleModal(null)}
                    onSuccess={(msg) => showFeedback('success', msg)}
                    onError={(msg) => showFeedback('error', msg)}
                />
            )}
        </div>
    );
}

// ── Create User Modal ────────────────────────────────────────────────────

function CreateUserModal({ roles, onClose, onSuccess, onError }: {
    roles: RoleRecord[];
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}) {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            setLoading(false);
            return;
        }

        const result = await createUser({ email, firstName, lastName, password, roleId: roleId || undefined });

        if (result.success) {
            onSuccess('User created successfully.');
            onClose();
        } else {
            setError(result.error ?? 'Failed to create user.');
            onError(result.error ?? 'Failed to create user.');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="glass-card rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-white/10 animate-in zoom-in-95">
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <div>
                        <h3 className="text-lg font-bold text-white">Add New User</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Create a local authentication account.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                            placeholder="Min 8 characters"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
                        <div className="relative">
                            <select
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                className="w-full appearance-none rounded-lg bg-slate-900/50 border border-primary/10 px-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                            >
                                <option value="">No role assigned</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} — {r.description}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 border-white/10 hover:bg-white/5"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            {loading ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Reset Password Modal ─────────────────────────────────────────────────

function ResetPasswordModal({ userId, onClose, onSuccess, onError }: {
    userId: string;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');

        const result = await resetPassword(userId, password);
        if (result.success) {
            onSuccess('Password reset successfully.');
            onClose();
        } else {
            setError(result.error ?? 'Failed.');
            onError(result.error ?? 'Failed.');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="glass-card rounded-2xl w-full max-w-sm mx-4 shadow-2xl border border-white/10 animate-in zoom-in-95">
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <h3 className="text-lg font-bold text-white">Reset Password</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                            placeholder="Min 8 characters"
                            required
                            minLength={8}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                        <Input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                            required
                            minLength={8}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="flex-1 shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Manage Roles Modal ───────────────────────────────────────────────────

function ManageRolesModal({ userId, user, roles, onClose, onSuccess, onError }: {
    userId: string;
    user: UserRecord;
    roles: RoleRecord[];
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}) {
    const [loading, setLoading] = useState<string | null>(null);
    const assignedRoleIds = user.roles.map(ur => ur.role.id);
    const availableRoles = roles.filter(r => !assignedRoleIds.includes(r.id));

    const handleAssign = async (roleId: string) => {
        setLoading(roleId);
        const result = await assignRole(userId, roleId);
        if (result.success) onSuccess('Role assigned.');
        else onError(result.error ?? 'Failed.');
        setLoading(null);
    };

    const handleRemove = async (roleId: string) => {
        setLoading(roleId);
        const result = await removeRole(userId, roleId);
        if (result.success) onSuccess('Role removed.');
        else onError(result.error ?? 'Failed.');
        setLoading(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="glass-card rounded-2xl w-full max-w-sm mx-4 shadow-2xl border border-white/10 animate-in zoom-in-95">
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <div>
                        <h3 className="text-lg font-bold text-white">Manage Roles</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{user.name || user.email}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Current roles */}
                    {user.roles.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Roles</p>
                            <div className="space-y-2">
                                {user.roles.map(ur => (
                                    <div key={ur.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                                        <div className="flex items-center gap-2">
                                            {getRoleIcon(ur.role.name)}
                                            <span className="text-sm font-medium text-white">{ur.role.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(ur.roleId)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            disabled={loading === ur.roleId}
                                        >
                                            {loading === ur.roleId ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available roles to add */}
                    {availableRoles.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Roles</p>
                            <div className="space-y-2">
                                {availableRoles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => handleAssign(role.id)}
                                        className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all"
                                        disabled={loading === role.id}
                                    >
                                        <div className="flex items-center gap-2 text-left">
                                            {getRoleIcon(role.name)}
                                            <div>
                                                <span className="text-sm font-medium text-white">{role.name}</span>
                                                {role.description && (
                                                    <p className="text-[10px] text-slate-500">{role.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        {loading === role.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        ) : (
                                            <Plus className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 mt-2" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
}
