import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import type { Staff } from '../../types';

export default function StaffList() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allStaff = await db.staff.toArray();
            setStaff(allStaff);
        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStaff = staff.filter(s => {
        const matchesSearch =
            s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = filterRole === 'all' || s.role === filterRole;

        return matchesSearch && matchesRole;
    });

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>
                        hourglass_empty
                    </span>
                </div>
                <h3 className="empty-state-title">Loading Staff...</h3>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                    <div className="search-box" style={{ width: '300px' }}>
                        <span className="material-symbols-rounded">search</span>
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="form-control"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        style={{ width: 'auto', height: '44px' }}
                    >
                        <option value="all">All Roles</option>
                        <option value="teacher">Teachers</option>
                        <option value="accountant">Accountants</option>
                        <option value="admin">Admin</option>
                        <option value="reception">Reception</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <button className="btn btn-primary btn-lg">
                    <span className="material-symbols-rounded">person_add</span>
                    Add Staff
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card teachers">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">group</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Staff</p>
                        <h3 className="stat-value">{staff.length}</h3>
                    </div>
                </div>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">school</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Teachers</p>
                        <h3 className="stat-value">{staff.filter(s => s.role === 'teacher').length}</h3>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">check_circle</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Active</p>
                        <h3 className="stat-value">{staff.filter(s => s.status === 'active').length}</h3>
                    </div>
                </div>
            </div>

            {/* Staff Grid */}
            {filteredStaff.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-5)' }}>
                    {filteredStaff.map((member) => (
                        <div key={member.id} className="card" style={{ cursor: 'pointer' }}>
                            <div className="card-body">
                                <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                                    {member.photo ? (
                                        <img
                                            src={member.photo}
                                            alt={member.firstName}
                                            style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: 'var(--radius-full)',
                                                background: 'linear-gradient(135deg, var(--primary-400), var(--secondary-400))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: 'var(--font-size-lg)',
                                            }}
                                        >
                                            {getInitials(member.firstName, member.lastName)}
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontWeight: 600, marginBottom: '2px' }}>
                                            {member.firstName} {member.lastName}
                                        </h3>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            {member.designation || member.role}
                                        </p>
                                        <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: 'var(--spacing-1)' }}>
                                            {member.status}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>badge</span>
                                        <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {member.staffId}
                                        </code>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>mail</span>
                                        {member.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>call</span>
                                        {member.phone}
                                    </div>
                                    {member.department && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>domain</span>
                                            {member.department}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    marginTop: 'var(--spacing-4)',
                                    paddingTop: 'var(--spacing-4)',
                                    borderTop: '1px solid var(--border-light)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{ color: 'var(--success-600)', fontWeight: 600 }}>
                                        {formatCurrency(member.salary)}/mo
                                    </span>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                        <button className="table-action-btn" title="View">
                                            <span className="material-symbols-rounded">visibility</span>
                                        </button>
                                        <button className="table-action-btn edit" title="Edit">
                                            <span className="material-symbols-rounded">edit</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-rounded">badge</span>
                        </div>
                        <h3 className="empty-state-title">No Staff Found</h3>
                        <p className="empty-state-text">
                            {searchQuery || filterRole !== 'all'
                                ? 'No staff match your search criteria.'
                                : 'Get started by adding your first staff member.'}
                        </p>
                        <button className="btn btn-primary">
                            <span className="material-symbols-rounded">person_add</span>
                            Add Staff
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
