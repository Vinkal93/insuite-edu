import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useAuth } from '../../context/AuthContext';
import type { Institute, User } from '../../types';

interface InstituteWithUser extends Institute {
    adminUser?: User;
}

export default function InstitutesPage() {
    const { verifyInstitute, rejectInstitute, blockUser, unblockUser } = useAuth();
    const [institutes, setInstitutes] = useState<InstituteWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'blocked'>('all');
    const [selectedInstitute, setSelectedInstitute] = useState<InstituteWithUser | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [actionType, setActionType] = useState<'verify' | 'reject' | 'block' | 'unblock' | null>(null);

    useEffect(() => {
        loadInstitutes();
    }, []);

    const loadInstitutes = async () => {
        try {
            const allInstitutes = await db.institute.toArray();
            const allUsers = await db.users.toArray();

            const institutesWithUsers = allInstitutes.map(inst => ({
                ...inst,
                adminUser: allUsers.find(u => u.instituteId === inst.id)
            }));

            setInstitutes(institutesWithUsers);
        } catch (error) {
            console.error('Error loading institutes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedInstitute) return;

        try {
            switch (actionType) {
                case 'verify':
                    await verifyInstitute(selectedInstitute.id!);
                    break;
                case 'reject':
                    await rejectInstitute(selectedInstitute.id!, actionMessage);
                    break;
                case 'block':
                    if (selectedInstitute.adminUser?.id) {
                        await blockUser(selectedInstitute.adminUser.id, actionMessage);
                    }
                    break;
                case 'unblock':
                    if (selectedInstitute.adminUser?.id) {
                        await unblockUser(selectedInstitute.adminUser.id);
                    }
                    break;
            }

            await loadInstitutes();
            setShowModal(false);
            setSelectedInstitute(null);
            setActionMessage('');
            setActionType(null);
        } catch (error) {
            console.error('Error performing action:', error);
        }
    };

    const filteredInstitutes = institutes.filter(inst => {
        switch (filter) {
            case 'pending': return !inst.isVerified && !inst.adminUser?.isBlocked;
            case 'verified': return inst.isVerified && !inst.adminUser?.isBlocked;
            case 'blocked': return inst.adminUser?.isBlocked;
            default: return true;
        }
    });

    const getStatusBadge = (inst: InstituteWithUser) => {
        if (inst.adminUser?.isBlocked) return <span className="badge badge-error">Blocked</span>;
        if (inst.isVerified) return <span className="badge badge-success">Verified</span>;
        return <span className="badge badge-warning">Pending</span>;
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded spinning">progress_activity</span>
                </div>
                <h3 className="empty-state-title">Loading...</h3>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Institute Management</h1>
                    <p>Verify and manage registered institutes</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--primary-100)' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--primary-600)' }}>business</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{institutes.length}</div>
                        <div className="stat-label">Total Institutes</div>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setFilter('pending')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--warning-100)' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--warning-600)' }}>pending</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{institutes.filter(i => !i.isVerified && !i.adminUser?.isBlocked).length}</div>
                        <div className="stat-label">Pending Verification</div>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setFilter('verified')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--success-100)' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--success-600)' }}>verified</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{institutes.filter(i => i.isVerified && !i.adminUser?.isBlocked).length}</div>
                        <div className="stat-label">Verified</div>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setFilter('blocked')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--error-100)' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--error-600)' }}>block</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{institutes.filter(i => i.adminUser?.isBlocked).length}</div>
                        <div className="stat-label">Blocked</div>
                    </div>
                </div>
            </div>

            {/* Institutes List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <span className="material-symbols-rounded">business</span>
                        {filter === 'all' ? 'All Institutes' : filter === 'pending' ? 'Pending Verification' : filter === 'verified' ? 'Verified Institutes' : 'Blocked Institutes'}
                    </h3>
                </div>
                <div className="card-body">
                    {filteredInstitutes.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-rounded">business</span>
                            </div>
                            <h3 className="empty-state-title">No institutes found</h3>
                            <p className="empty-state-text">No institutes match the current filter.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Institute</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Registered</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInstitutes.map((inst) => (
                                        <tr key={inst.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                                    <div className="avatar" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                                                        {inst.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <strong>{inst.name}</strong>
                                                        {inst.principalName && (
                                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                                                {inst.principalName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{inst.email || inst.adminUser?.email || '-'}</td>
                                            <td>{inst.phone}</td>
                                            <td>{inst.city}, {inst.state}</td>
                                            <td>{getStatusBadge(inst)}</td>
                                            <td>{new Date(inst.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                    {!inst.isVerified && !inst.adminUser?.isBlocked && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => {
                                                                    setSelectedInstitute(inst);
                                                                    setActionType('verify');
                                                                    setShowModal(true);
                                                                }}
                                                            >
                                                                <span className="material-symbols-rounded">check</span>
                                                                Verify
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => {
                                                                    setSelectedInstitute(inst);
                                                                    setActionType('reject');
                                                                    setShowModal(true);
                                                                }}
                                                            >
                                                                <span className="material-symbols-rounded">close</span>
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {inst.isVerified && !inst.adminUser?.isBlocked && (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => {
                                                                setSelectedInstitute(inst);
                                                                setActionType('block');
                                                                setShowModal(true);
                                                            }}
                                                        >
                                                            <span className="material-symbols-rounded">block</span>
                                                            Block
                                                        </button>
                                                    )}
                                                    {inst.adminUser?.isBlocked && (
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => {
                                                                setSelectedInstitute(inst);
                                                                setActionType('unblock');
                                                                setShowModal(true);
                                                            }}
                                                        >
                                                            <span className="material-symbols-rounded">lock_open</span>
                                                            Unblock
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {actionType === 'verify' ? 'Verify Institute' :
                                    actionType === 'reject' ? 'Reject Institute' :
                                        actionType === 'block' ? 'Block Institute' : 'Unblock Institute'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 'var(--spacing-4)' }}>
                                <strong>{selectedInstitute?.name}</strong>
                            </p>

                            {actionType === 'verify' && (
                                <p>Are you sure you want to verify this institute? They will be able to access the platform.</p>
                            )}

                            {(actionType === 'reject' || actionType === 'block') && (
                                <div className="form-group">
                                    <label className="form-label required">
                                        {actionType === 'reject' ? 'Rejection Reason' : 'Block Message'}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={actionMessage}
                                        onChange={(e) => setActionMessage(e.target.value)}
                                        placeholder="Enter reason/message..."
                                        required
                                    />
                                </div>
                            )}

                            {actionType === 'unblock' && (
                                <p>Are you sure you want to unblock this institute? They will regain access to the platform.</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={`btn ${actionType === 'verify' || actionType === 'unblock' ? 'btn-success' : 'btn-danger'}`}
                                onClick={handleAction}
                                disabled={(actionType === 'reject' || actionType === 'block') && !actionMessage}
                            >
                                {actionType === 'verify' ? 'Verify' :
                                    actionType === 'reject' ? 'Reject' :
                                        actionType === 'block' ? 'Block' : 'Unblock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
