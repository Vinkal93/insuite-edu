import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import type { Class } from '../../types';

export default function ClassList() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allClasses = await db.classes.toArray();
            setClasses(allClasses);
        } catch (error) {
            console.error('Error loading classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStudentCount = async (classId: number) => {
        return await db.students.where('classId').equals(classId).count();
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>
                        hourglass_empty
                    </span>
                </div>
                <h3 className="empty-state-title">Loading Classes...</h3>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Manage classes, subjects, and batches
                </p>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add Class
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">class</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Classes</p>
                        <h3 className="stat-value">{classes.length}</h3>
                    </div>
                </div>
                <div className="stat-card teachers">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">school</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">School Classes</p>
                        <h3 className="stat-value">{classes.filter(c => c.type === 'school').length}</h3>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">book</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Courses</p>
                        <h3 className="stat-value">{classes.filter(c => c.type === 'course').length}</h3>
                    </div>
                </div>
            </div>

            {/* Classes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-5)' }}>
                {classes.map((cls) => (
                    <div key={cls.id} className="card" style={{ cursor: 'pointer' }}>
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>{cls.name}</h3>
                                    <span className={`badge ${cls.type === 'school' ? 'badge-primary' : 'badge-info'}`}>
                                        {cls.type}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--primary-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span className="material-symbols-rounded" style={{ color: 'var(--primary-600)' }}>
                                        class
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                    Subjects
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
                                    {cls.subjects.slice(0, 4).map((subject, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                fontSize: 'var(--font-size-xs)',
                                                padding: '2px 8px',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                    {cls.subjects.length > 4 && (
                                        <span
                                            style={{
                                                fontSize: 'var(--font-size-xs)',
                                                padding: '2px 8px',
                                                background: 'var(--primary-100)',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--primary-600)',
                                            }}
                                        >
                                            +{cls.subjects.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: 'var(--spacing-4)',
                                borderTop: '1px solid var(--border-light)',
                            }}>
                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    {cls.subjects.length} subjects
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

                {/* Add New Card */}
                <div
                    className="card"
                    style={{
                        cursor: 'pointer',
                        border: '2px dashed var(--border-light)',
                        background: 'transparent',
                    }}
                    onClick={() => setShowModal(true)}
                >
                    <div className="card-body" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '200px',
                    }}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--spacing-4)',
                            }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>
                                add
                            </span>
                        </div>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Add New Class</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
