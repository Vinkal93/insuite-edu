import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import type { Student, Class, AttendanceStatus } from '../../types';

interface StudentAttendanceState {
    studentId: number;
    status: AttendanceStatus;
}

export default function StudentAttendance() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [attendanceState, setAttendanceState] = useState<StudentAttendanceState[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadStudents();
        }
    }, [selectedClass, selectedDate]);

    const loadClasses = async () => {
        try {
            const allClasses = await db.classes.toArray();
            setClasses(allClasses);
            if (allClasses.length > 0) {
                setSelectedClass(String(allClasses[0].id));
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            const classStudents = await db.students
                .where('classId')
                .equals(parseInt(selectedClass))
                .filter(s => s.status === 'active')
                .toArray();

            setStudents(classStudents);

            // Check existing attendance for the date
            const date = new Date(selectedDate);
            date.setHours(0, 0, 0, 0);

            const existingAttendance = await db.attendance
                .where({ entityType: 'student', date: date })
                .toArray();

            const initialState: StudentAttendanceState[] = classStudents.map(student => {
                const existing = existingAttendance.find(a => a.entityId === student.id);
                return {
                    studentId: student.id!,
                    status: existing?.status || 'present',
                };
            });

            setAttendanceState(initialState);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const updateAttendance = (studentId: number, status: AttendanceStatus) => {
        setAttendanceState(prev =>
            prev.map(a => a.studentId === studentId ? { ...a, status } : a)
        );
    };

    const markAll = (status: AttendanceStatus) => {
        setAttendanceState(prev => prev.map(a => ({ ...a, status })));
    };

    const saveAttendance = async () => {
        setSaving(true);
        try {
            const date = new Date(selectedDate);
            date.setHours(0, 0, 0, 0);

            // Delete existing attendance for this date and class
            const studentIds = students.map(s => s.id!);
            await db.attendance
                .where({ entityType: 'student', date: date })
                .filter(a => studentIds.includes(a.entityId))
                .delete();

            // Add new attendance
            const attendanceRecords = attendanceState.map(a => ({
                entityType: 'student' as const,
                entityId: a.studentId,
                date: date,
                status: a.status,
                markedBy: 1, // Current user
                createdAt: new Date(),
            }));

            await db.attendance.bulkAdd(attendanceRecords);
            alert('Attendance saved successfully!');
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getStats = () => {
        const total = attendanceState.length;
        const present = attendanceState.filter(a => a.status === 'present').length;
        const absent = attendanceState.filter(a => a.status === 'absent').length;
        const late = attendanceState.filter(a => a.status === 'late').length;
        const leave = attendanceState.filter(a => a.status === 'leave').length;
        return { total, present, absent, late, leave };
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>
                        hourglass_empty
                    </span>
                </div>
                <h3 className="empty-state-title">Loading...</h3>
            </div>
        );
    }

    const stats = getStats();

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

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button className="btn btn-secondary" onClick={() => markAll('present')}>
                            <span className="material-symbols-rounded">check_circle</span>
                            Mark All Present
                        </button>
                        <button className="btn btn-secondary" onClick={() => markAll('absent')}>
                            <span className="material-symbols-rounded">cancel</span>
                            Mark All Absent
                        </button>
                    </div>

                    <button
                        className="btn btn-success"
                        onClick={saveAttendance}
                        disabled={saving || students.length === 0}
                        style={{ marginLeft: 'auto' }}
                    >
                        {saving ? (
                            <>
                                <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>progress_activity</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-rounded">save</span>
                                Save Attendance
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">group</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Students</p>
                        <h3 className="stat-value">{stats.total}</h3>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">check_circle</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Present</p>
                        <h3 className="stat-value" style={{ color: 'var(--success-600)' }}>{stats.present}</h3>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">cancel</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Absent</p>
                        <h3 className="stat-value" style={{ color: 'var(--error-600)' }}>{stats.absent}</h3>
                    </div>
                </div>
                <div className="stat-card attendance">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">schedule</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Late</p>
                        <h3 className="stat-value" style={{ color: 'var(--warning-600)' }}>{stats.late}</h3>
                    </div>
                </div>
            </div>

            {/* Attendance Grid */}
            {students.length > 0 ? (
                <div className="attendance-grid">
                    {students.map((student) => {
                        const state = attendanceState.find(a => a.studentId === student.id);
                        const status = state?.status || 'present';

                        return (
                            <div
                                key={student.id}
                                className={`attendance-card ${status}`}
                                onClick={() => {
                                    const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'leave'];
                                    const currentIndex = statuses.indexOf(status);
                                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                                    updateAttendance(student.id!, nextStatus);
                                }}
                            >
                                <div className="attendance-avatar">
                                    {getInitials(student.firstName, student.lastName)}
                                </div>
                                <div className="attendance-info">
                                    <div className="attendance-name">{student.firstName} {student.lastName}</div>
                                    <div className="attendance-roll">{student.rollNumber || student.studentId}</div>
                                </div>
                                <div className="attendance-status">
                                    <select
                                        value={status}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateAttendance(student.id!, e.target.value as AttendanceStatus)}
                                        className="form-control"
                                        style={{
                                            width: 'auto',
                                            height: '36px',
                                            fontSize: 'var(--font-size-sm)',
                                            padding: '0 var(--spacing-8) 0 var(--spacing-2)',
                                        }}
                                    >
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="late">Late</option>
                                        <option value="leave">Leave</option>
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-rounded">group_off</span>
                        </div>
                        <h3 className="empty-state-title">No Students Found</h3>
                        <p className="empty-state-text">
                            There are no students in this class. Add students first to mark attendance.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
