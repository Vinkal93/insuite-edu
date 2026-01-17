import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import type { Student, Class } from '../../types';

export default function Results() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadStudents();
        }
    }, [selectedClass]);

    const loadData = async () => {
        try {
            const allClasses = await db.classes.toArray();
            setClasses(allClasses);
            if (allClasses.length > 0) {
                setSelectedClass(String(allClasses[0].id));
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        const classStudents = await db.students
            .where('classId')
            .equals(parseInt(selectedClass))
            .filter(s => s.status === 'active')
            .toArray();
        setStudents(classStudents);
    };

    // Demo results
    const results = students.map((s, i) => ({
        student: s,
        subjects: [
            { name: 'English', marks: 75 + Math.floor(Math.random() * 20) },
            { name: 'Hindi', marks: 70 + Math.floor(Math.random() * 25) },
            { name: 'Math', marks: 65 + Math.floor(Math.random() * 30) },
            { name: 'Science', marks: 70 + Math.floor(Math.random() * 25) },
            { name: 'SST', marks: 75 + Math.floor(Math.random() * 20) },
        ],
        rank: i + 1,
    })).map(r => ({
        ...r,
        total: r.subjects.reduce((s, sub) => s + sub.marks, 0),
        percentage: Math.round(r.subjects.reduce((s, sub) => s + sub.marks, 0) / r.subjects.length),
    })).sort((a, b) => b.percentage - a.percentage).map((r, i) => ({ ...r, rank: i + 1 }));

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

    const getGrade = (percentage: number) => {
        if (percentage >= 90) return { grade: 'A+', color: 'success' };
        if (percentage >= 80) return { grade: 'A', color: 'success' };
        if (percentage >= 70) return { grade: 'B+', color: 'primary' };
        if (percentage >= 60) return { grade: 'B', color: 'primary' };
        if (percentage >= 50) return { grade: 'C', color: 'warning' };
        if (percentage >= 35) return { grade: 'D', color: 'warning' };
        return { grade: 'F', color: 'danger' };
    };

    return (
        <div className="animate-fade-in">
            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                        <label className="form-label">Select Class</label>
                        <select
                            className="form-control"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                        <label className="form-label">Select Exam</label>
                        <select className="form-control">
                            <option>Mid Term 2025-26</option>
                            <option>Unit Test 1</option>
                            <option>Final Exam 2025-26</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginLeft: 'auto' }}>
                        <button className="btn btn-secondary">
                            <span className="material-symbols-rounded">download</span>
                            Export Results
                        </button>
                        <button className="btn btn-primary">
                            <span className="material-symbols-rounded">print</span>
                            Print Report Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            {results.length > 0 ? (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Rank</th>
                                <th>Student</th>
                                {results[0]?.subjects.map(sub => (
                                    <th key={sub.name} style={{ textAlign: 'center' }}>{sub.name}</th>
                                ))}
                                <th style={{ textAlign: 'center' }}>Total</th>
                                <th style={{ textAlign: 'center' }}>%</th>
                                <th style={{ textAlign: 'center' }}>Grade</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result) => {
                                const { grade, color } = getGrade(result.percentage);

                                return (
                                    <tr key={result.student.id}>
                                        <td>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: 'var(--radius-full)',
                                                background: result.rank <= 3 ?
                                                    result.rank === 1 ? 'linear-gradient(135deg, #fcd34d, #f59e0b)' :
                                                        result.rank === 2 ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' :
                                                            'linear-gradient(135deg, #fdba74, #f97316)' :
                                                    'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                color: result.rank <= 3 ? 'white' : 'var(--text-primary)',
                                                fontSize: 'var(--font-size-sm)',
                                            }}>
                                                {result.rank}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-avatar">
                                                <div className="avatar-placeholder" style={{ width: '36px', height: '36px', fontSize: 'var(--font-size-sm)' }}>
                                                    {result.student.firstName.charAt(0)}{result.student.lastName.charAt(0)}
                                                </div>
                                                <div className="table-avatar-info">
                                                    <span className="table-avatar-name">{result.student.firstName} {result.student.lastName}</span>
                                                    <span className="table-avatar-sub">{result.student.studentId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {result.subjects.map(sub => (
                                            <td key={sub.name} style={{ textAlign: 'center', fontWeight: 500 }}>
                                                <span style={{ color: sub.marks < 35 ? 'var(--error-600)' : 'var(--text-primary)' }}>
                                                    {sub.marks}
                                                </span>
                                            </td>
                                        ))}
                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{result.total}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{result.percentage}%</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge badge-${color}`}>{grade}</span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary">
                                                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>download</span>
                                                Report Card
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-rounded">grade</span>
                        </div>
                        <h3 className="empty-state-title">No Results Found</h3>
                        <p className="empty-state-text">No results available for this class and exam.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
