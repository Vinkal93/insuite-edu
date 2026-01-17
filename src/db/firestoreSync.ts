// ============================================
// InSuite Edu - Firestore Sync Service
// Hybrid sync: Local Dexie + Cloud Firestore
// ============================================

import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { db } from './database';
import type {
    Student,
    Staff,
    FeeTransaction,
    Attendance,
    Notice,
} from '../types';

// ============================================
// Sync Status Tracking
// ============================================
export interface SyncStatus {
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    pendingChanges: number;
    error: string | null;
}

let syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncedAt: null,
    pendingChanges: 0,
    error: null,
};

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];

export function getSyncStatus(): SyncStatus {
    return { ...syncStatus };
}

export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    syncStatusListeners.push(callback);
    return () => {
        syncStatusListeners = syncStatusListeners.filter(cb => cb !== callback);
    };
}

function updateSyncStatus(updates: Partial<SyncStatus>) {
    syncStatus = { ...syncStatus, ...updates };
    syncStatusListeners.forEach(cb => cb(syncStatus));
}

// ============================================
// Helper Functions
// ============================================

// Convert Date objects to Firestore Timestamps
function serializeForFirestore(data: Record<string, unknown>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
            serialized[key] = Timestamp.fromDate(value);
        } else if (value === undefined) {
            // Skip undefined values
            continue;
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            serialized[key] = serializeForFirestore(value as Record<string, unknown>);
        } else {
            serialized[key] = value;
        }
    }
    return serialized;
}

// Convert Firestore Timestamps back to Date objects (for future pull operations)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _deserializeFromFirestore(data: Record<string, unknown>): Record<string, unknown> {
    const deserialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Timestamp) {
            deserialized[key] = value.toDate();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            deserialized[key] = _deserializeFromFirestore(value as Record<string, unknown>);
        } else {
            deserialized[key] = value;
        }
    }
    return deserialized;
}

// Generate a unique Firestore document ID from local ID
function generateFirestoreId(collectionName: string, localId: number): string {
    return `${collectionName}_${localId}`;
}

// ============================================
// Collection Sync Functions
// ============================================

// Sync Students
export async function syncStudents(): Promise<void> {
    const collectionRef = collection(firestore, 'students');

    try {
        // Get all local students
        const localStudents = await db.students.toArray();

        // Push each student to Firestore
        const batch = writeBatch(firestore);

        for (const student of localStudents) {
            if (student.id) {
                const docId = generateFirestoreId('student', student.id);
                const docRef = doc(collectionRef, docId);
                const data = serializeForFirestore({
                    ...student,
                    localId: student.id,
                    syncedAt: serverTimestamp(),
                });
                batch.set(docRef, data, { merge: true });
            }
        }

        await batch.commit();
        console.log(`✅ Synced ${localStudents.length} students to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing students:', error);
        throw error;
    }
}

// Sync Staff
export async function syncStaff(): Promise<void> {
    const collectionRef = collection(firestore, 'staff');

    try {
        const localStaff = await db.staff.toArray();
        const batch = writeBatch(firestore);

        for (const staffMember of localStaff) {
            if (staffMember.id) {
                const docId = generateFirestoreId('staff', staffMember.id);
                const docRef = doc(collectionRef, docId);
                const data = serializeForFirestore({
                    ...staffMember,
                    localId: staffMember.id,
                    syncedAt: serverTimestamp(),
                });
                batch.set(docRef, data, { merge: true });
            }
        }

        await batch.commit();
        console.log(`✅ Synced ${localStaff.length} staff to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing staff:', error);
        throw error;
    }
}

// Sync Classes
export async function syncClasses(): Promise<void> {
    const collectionRef = collection(firestore, 'classes');

    try {
        const localClasses = await db.classes.toArray();
        const batch = writeBatch(firestore);

        for (const classItem of localClasses) {
            if (classItem.id) {
                const docId = generateFirestoreId('class', classItem.id);
                const docRef = doc(collectionRef, docId);
                const data = serializeForFirestore({
                    ...classItem,
                    localId: classItem.id,
                    syncedAt: serverTimestamp(),
                });
                batch.set(docRef, data, { merge: true });
            }
        }

        await batch.commit();
        console.log(`✅ Synced ${localClasses.length} classes to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing classes:', error);
        throw error;
    }
}

// Sync Fee Structures
export async function syncFeeStructures(): Promise<void> {
    const collectionRef = collection(firestore, 'feeStructures');

    try {
        const localFeeStructures = await db.feeStructures.toArray();
        const batch = writeBatch(firestore);

        for (const feeStructure of localFeeStructures) {
            if (feeStructure.id) {
                const docId = generateFirestoreId('feeStructure', feeStructure.id);
                const docRef = doc(collectionRef, docId);
                const data = serializeForFirestore({
                    ...feeStructure,
                    localId: feeStructure.id,
                    syncedAt: serverTimestamp(),
                });
                batch.set(docRef, data, { merge: true });
            }
        }

        await batch.commit();
        console.log(`✅ Synced ${localFeeStructures.length} fee structures to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing fee structures:', error);
        throw error;
    }
}

// Sync Fee Transactions
export async function syncFeeTransactions(): Promise<void> {
    const collectionRef = collection(firestore, 'feeTransactions');

    try {
        const localTransactions = await db.feeTransactions.toArray();
        const batch = writeBatch(firestore);

        for (const transaction of localTransactions) {
            if (transaction.id) {
                const docId = generateFirestoreId('feeTransaction', transaction.id);
                const docRef = doc(collectionRef, docId);
                const data = serializeForFirestore({
                    ...transaction,
                    localId: transaction.id,
                    syncedAt: serverTimestamp(),
                });
                batch.set(docRef, data, { merge: true });
            }
        }

        await batch.commit();
        console.log(`✅ Synced ${localTransactions.length} fee transactions to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing fee transactions:', error);
        throw error;
    }
}

// Sync Attendance
export async function syncAttendance(): Promise<void> {
    const collectionRef = collection(firestore, 'attendance');

    try {
        const localAttendance = await db.attendance.toArray();

        // Batch limit is 500 in Firestore, so we chunk if needed
        const chunkSize = 450;
        for (let i = 0; i < localAttendance.length; i += chunkSize) {
            const chunk = localAttendance.slice(i, i + chunkSize);
            const batch = writeBatch(firestore);

            for (const attendance of chunk) {
                if (attendance.id) {
                    const docId = generateFirestoreId('attendance', attendance.id);
                    const docRef = doc(collectionRef, docId);
                    const data = serializeForFirestore({
                        ...attendance,
                        localId: attendance.id,
                        syncedAt: serverTimestamp(),
                    });
                    batch.set(docRef, data, { merge: true });
                }
            }

            await batch.commit();
        }

        console.log(`✅ Synced ${localAttendance.length} attendance records to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing attendance:', error);
        throw error;
    }
}

// Sync Notices
export async function syncNotices(): Promise<void> {
    const collectionRef = collection(firestore, 'notices');

    try {
        const localNotices = await db.notices.toArray();
        const batch = writeBatch(firestore);

        for (const notice of localNotices) {
            if (notice.id) {
                const docId = generateFirestoreId('notice', notice.id);
                const docRef = doc(collectionRef, docId);
                const data = serializeForFirestore({
                    ...notice,
                    localId: notice.id,
                    syncedAt: serverTimestamp(),
                });
                batch.set(docRef, data, { merge: true });
            }
        }

        await batch.commit();
        console.log(`✅ Synced ${localNotices.length} notices to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing notices:', error);
        throw error;
    }
}

// Sync Exams
export async function syncExams(): Promise<void> {
    const collectionRef = collection(firestore, 'exams');

    try {
        const localExams = await db.exams.toArray();
        const batch = writeBatch(firestore);

        for (const exam of localExams) {
            if (exam.id) {
                const docId = generateFirestoreId('exam', exam.id);
                const docRef = doc(collectionRef, docId);
                const data = serializeForFirestore({
                    ...exam,
                    localId: exam.id,
                    syncedAt: serverTimestamp(),
                });
                batch.set(docRef, data, { merge: true });
            }
        }

        await batch.commit();
        console.log(`✅ Synced ${localExams.length} exams to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing exams:', error);
        throw error;
    }
}

// Sync Exam Results
export async function syncExamResults(): Promise<void> {
    const collectionRef = collection(firestore, 'examResults');

    try {
        const localResults = await db.examResults.toArray();

        // Batch limit is 500 in Firestore
        const chunkSize = 450;
        for (let i = 0; i < localResults.length; i += chunkSize) {
            const chunk = localResults.slice(i, i + chunkSize);
            const batch = writeBatch(firestore);

            for (const result of chunk) {
                if (result.id) {
                    const docId = generateFirestoreId('examResult', result.id);
                    const docRef = doc(collectionRef, docId);
                    const data = serializeForFirestore({
                        ...result,
                        localId: result.id,
                        syncedAt: serverTimestamp(),
                    });
                    batch.set(docRef, data, { merge: true });
                }
            }

            await batch.commit();
        }

        console.log(`✅ Synced ${localResults.length} exam results to Firestore`);
    } catch (error) {
        console.error('❌ Error syncing exam results:', error);
        throw error;
    }
}

// Sync Institute
export async function syncInstitute(): Promise<void> {
    const collectionRef = collection(firestore, 'institute');

    try {
        const institute = await db.institute.toCollection().first();

        if (institute && institute.id) {
            const docId = generateFirestoreId('institute', institute.id);
            const docRef = doc(collectionRef, docId);
            const data = serializeForFirestore({
                ...institute,
                localId: institute.id,
                syncedAt: serverTimestamp(),
            });
            await setDoc(docRef, data, { merge: true });
            console.log('✅ Synced institute to Firestore');
        }
    } catch (error) {
        console.error('❌ Error syncing institute:', error);
        throw error;
    }
}

// ============================================
// Single Item Sync Functions (for immediate sync)
// ============================================

export async function syncStudent(student: Student): Promise<void> {
    if (!student.id) return;

    const collectionRef = collection(firestore, 'students');
    const docId = generateFirestoreId('student', student.id);
    const docRef = doc(collectionRef, docId);

    const data = serializeForFirestore({
        ...student,
        localId: student.id,
        syncedAt: serverTimestamp(),
    });

    await setDoc(docRef, data, { merge: true });
    console.log(`✅ Synced student ${student.studentId} to Firestore`);
}

export async function syncStaffMember(staffMember: Staff): Promise<void> {
    if (!staffMember.id) return;

    const collectionRef = collection(firestore, 'staff');
    const docId = generateFirestoreId('staff', staffMember.id);
    const docRef = doc(collectionRef, docId);

    const data = serializeForFirestore({
        ...staffMember,
        localId: staffMember.id,
        syncedAt: serverTimestamp(),
    });

    await setDoc(docRef, data, { merge: true });
    console.log(`✅ Synced staff ${staffMember.staffId} to Firestore`);
}

export async function syncFeeTransaction(transaction: FeeTransaction): Promise<void> {
    if (!transaction.id) return;

    const collectionRef = collection(firestore, 'feeTransactions');
    const docId = generateFirestoreId('feeTransaction', transaction.id);
    const docRef = doc(collectionRef, docId);

    const data = serializeForFirestore({
        ...transaction,
        localId: transaction.id,
        syncedAt: serverTimestamp(),
    });

    await setDoc(docRef, data, { merge: true });
    console.log(`✅ Synced fee transaction ${transaction.receiptNumber} to Firestore`);
}

export async function syncAttendanceRecord(attendance: Attendance): Promise<void> {
    if (!attendance.id) return;

    const collectionRef = collection(firestore, 'attendance');
    const docId = generateFirestoreId('attendance', attendance.id);
    const docRef = doc(collectionRef, docId);

    const data = serializeForFirestore({
        ...attendance,
        localId: attendance.id,
        syncedAt: serverTimestamp(),
    });

    await setDoc(docRef, data, { merge: true });
}

export async function syncNotice(notice: Notice): Promise<void> {
    if (!notice.id) return;

    const collectionRef = collection(firestore, 'notices');
    const docId = generateFirestoreId('notice', notice.id);
    const docRef = doc(collectionRef, docId);

    const data = serializeForFirestore({
        ...notice,
        localId: notice.id,
        syncedAt: serverTimestamp(),
    });

    await setDoc(docRef, data, { merge: true });
    console.log(`✅ Synced notice "${notice.title}" to Firestore`);
}

// ============================================
// Delete Sync Functions
// ============================================

export async function deleteStudentFromFirestore(studentId: number): Promise<void> {
    const collectionRef = collection(firestore, 'students');
    const docId = generateFirestoreId('student', studentId);
    const docRef = doc(collectionRef, docId);
    await deleteDoc(docRef);
    console.log(`🗑️ Deleted student ${studentId} from Firestore`);
}

export async function deleteStaffFromFirestore(staffId: number): Promise<void> {
    const collectionRef = collection(firestore, 'staff');
    const docId = generateFirestoreId('staff', staffId);
    const docRef = doc(collectionRef, docId);
    await deleteDoc(docRef);
    console.log(`🗑️ Deleted staff ${staffId} from Firestore`);
}

// ============================================
// Full Sync (All Collections)
// ============================================

export async function syncAllToFirestore(): Promise<void> {
    if (syncStatus.isSyncing) {
        console.log('⏳ Sync already in progress...');
        return;
    }

    updateSyncStatus({ isSyncing: true, error: null });
    console.log('🔄 Starting full sync to Firestore...');

    try {
        // Sync all collections
        await syncInstitute();
        await syncClasses();
        await syncStudents();
        await syncStaff();
        await syncFeeStructures();
        await syncFeeTransactions();
        await syncAttendance();
        await syncNotices();
        await syncExams();
        await syncExamResults();

        updateSyncStatus({
            isSyncing: false,
            lastSyncedAt: new Date(),
            pendingChanges: 0,
            error: null,
        });

        console.log('✅ Full sync completed successfully!');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
        updateSyncStatus({
            isSyncing: false,
            error: errorMessage,
        });
        console.error('❌ Full sync failed:', error);
        throw error;
    }
}

// ============================================
// Auto Sync on Online/Offline Events
// ============================================

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('🌐 Back online - triggering sync...');
        isOnline = true;
        syncAllToFirestore().catch(console.error);
    });

    window.addEventListener('offline', () => {
        console.log('📴 Gone offline - changes will sync when back online');
        isOnline = false;
    });
}

export function isAppOnline(): boolean {
    return isOnline;
}

// ============================================
// Initialize Sync
// ============================================

export async function initializeSync(): Promise<void> {
    console.log('🚀 Initializing Firestore sync...');

    // Perform initial sync if online
    if (isOnline) {
        try {
            await syncAllToFirestore();
        } catch (error) {
            console.error('Initial sync failed, will retry when online:', error);
        }
    } else {
        console.log('📴 Offline - sync will happen when online');
    }
}
