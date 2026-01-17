import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import type { Exam } from '../../types';

export default function ExamList() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allExams = await db.exams.toArray();
            setExams(allExams);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Note: getClassName will be used when displaying class info in exam cards

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Demo exams
    const demoExams = [
        { id: 1, name: 'Mid Term Examination 2025-26', examType: 'mid_term', startDate: new Date('2025-09-15'), endDate: new Date('2025-09-25'), maxMarks: 100, passingMarks: 35, isPublished: true },
        { id: 2, name: 'Unit Test 1', examType: 'unit_test', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-22'), maxMarks: 50, passingMarks: 18, isPublished: true },
        { id: 3, name: 'Final Examination 2025-26', examType: 'final', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-15'), maxMarks: 100, passingMarks: 35, isPublished: false },
    ];

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>hourglass_empty</span>
                </div>
                <h3 className="empty-state-title">Loading...</h3>
            </div>
        );
    }

    const displayExams = exams.length > 0 ? exams : demoExams;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Create and manage examinations
                </p>
                <button className="btn btn-primary btn-lg">
                    <span className="material-symbols-rounded">add</span>
                    Create Exam
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">quiz</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Exams</p>
                        <h3 className="stat-value">{displayExams.length}</h3>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">check_circle</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Published</p>
                        <h3 className="stat-value">{displayExams.filter(e => e.isPublished).length}</h3>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">pending</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Upcoming</p>
                        <h3 className="stat-value">{displayExams.filter(e => new Date(e.startDate) > new Date()).length}</h3>
                    </div>
                </div>
            </div>

            {/* Exam Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-5)' }}>
                {displayExams.map((exam) => (
                    <div key={exam.id} className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>{exam.name}</h3>
                                    <span className={`badge ${exam.isPublished ? 'badge-success' : 'badge-warning'}`}>
                                        {exam.isPublished ? 'Published' : 'Draft'}
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
                                        quiz
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Type</p>
                                    <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{exam.examType.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Max Marks</p>
                                    <p style={{ fontWeight: 500 }}>{exam.maxMarks}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Start Date</p>
                                    <p style={{ fontWeight: 500 }}>{formatDate(exam.startDate)}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>End Date</p>
                                    <p style={{ fontWeight: 500 }}>{exam.endDate ? formatDate(exam.endDate) : '-'}</p>
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
                                    Passing: {exam.passingMarks} marks
                                </span>
                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                    <button className="btn btn-sm btn-secondary">
                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>edit_note</span>
                                        Enter Marks
                                    </button>
                                    <button className="table-action-btn edit" title="Edit">
                                        <span className="material-symbols-rounded">edit</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New */}
                <div
                    className="card"
                    style={{
                        cursor: 'pointer',
                        border: '2px dashed var(--border-light)',
                        background: 'transparent',
                    }}
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
                        <h3 style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Create New Exam</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
