import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import type { Student, Class, Exam } from '../../types';

export default function MarksEntry() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [marks, setMarks] = useState<Record<number, number>>({});

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadStudents();
        }
    }, [selectedClass]);

    const loadClasses = async () => {
        try {
            const allClasses = await db.classes.toArray();
            setClasses(allClasses);
            if (allClasses.length > 0) {
                setSelectedClass(String(allClasses[0].id));
                if (allClasses[0].subjects.length > 0) {
                    setSelectedSubject(allClasses[0].subjects[0]);
                }
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

    const currentClass = classes.find(c => c.id === parseInt(selectedClass));

    const handleMarkChange = (studentId: number, value: string) => {
        const numValue = parseInt(value) || 0;
        setMarks(prev => ({ ...prev, [studentId]: numValue }));
    };

    const saveMarks = async () => {
        alert('Marks saved successfully!');
    };

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
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                const cls = classes.find(c => c.id === parseInt(e.target.value));
                                if (cls?.subjects.length) {
                                    setSelectedSubject(cls.subjects[0]);
                                }
                            }}
                        >
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                        <label className="form-label">Select Subject</label>
                        <select
                            className="form-control"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            {currentClass?.subjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
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

                    <button className="btn btn-success" onClick={saveMarks} style={{ marginLeft: 'auto' }}>
                        <span className="material-symbols-rounded">save</span>
                        Save Marks
                    </button>
                </div>
            </div>

            {/* Marks Entry Table */}
            {students.length > 0 ? (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Roll</th>
                                <th>Student Name</th>
                                <th style={{ width: '150px' }}>Marks (Out of 100)</th>
                                <th style={{ width: '100px' }}>Grade</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => {
                                const studentMarks = marks[student.id!] || 0;
                                const grade = studentMarks >= 90 ? 'A+' : studentMarks >= 80 ? 'A' : studentMarks >= 70 ? 'B+' : studentMarks >= 60 ? 'B' : studentMarks >= 50 ? 'C' : studentMarks >= 35 ? 'D' : 'F';

                                return (
                                    <tr key={student.id}>
                                        <td style={{ fontWeight: 600 }}>{student.rollNumber || index + 1}</td>
                                        <td>
                                            <div className="table-avatar">
                                                <div
                                                    className="avatar-placeholder"
                                                    style={{ width: '36px', height: '36px', fontSize: 'var(--font-size-sm)' }}
                                                >
                                                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                                </div>
                                                <span>{student.firstName} {student.lastName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ height: '40px' }}
                                                min="0"
                                                max="100"
                                                value={marks[student.id!] || ''}
                                                onChange={(e) => handleMarkChange(student.id!, e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <span className={`badge ${grade === 'A+' || grade === 'A' ? 'badge-success' :
                                                    grade === 'B+' || grade === 'B' ? 'badge-primary' :
                                                        grade === 'C' || grade === 'D' ? 'badge-warning' : 'badge-danger'
                                                }`}>
                                                {grade}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control"
                                                style={{ height: '40px' }}
                                                placeholder="Optional remarks"
                                            />
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
                            <span className="material-symbols-rounded">edit_note</span>
                        </div>
                        <h3 className="empty-state-title">No Students Found</h3>
                        <p className="empty-state-text">There are no students in this class.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
