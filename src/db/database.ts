// ============================================
// InSuite Edu - Dexie Database
// IndexedDB for offline-first architecture
// With Firebase Firestore Sync
// ============================================

import Dexie, { type EntityTable } from 'dexie';
import type {
    User,
    Student,
    StudentDocument,
    Staff,
    Class,
    Batch,
    Section,
    Subject,
    Attendance,
    FeeStructure,
    FeeTransaction,
    Discount,
    Exam,
    ExamSchedule,
    ExamResult,
    Notice,
    Message,
    Certificate,
    IDCard,
    Institute,
    AcademicYear,
    AppSettings,
    PaymentGatewayConfig,
} from '../types';
import {
    initializeSync,
    syncStudent,
    syncStaffMember,
    syncFeeTransaction,
    syncAttendanceRecord,
    syncNotice,
    syncAllToFirestore,
    deleteStudentFromFirestore,
    deleteStaffFromFirestore,
    getSyncStatus,
    onSyncStatusChange,
    isAppOnline,
} from './firestoreSync';

// Database class
class InSuiteEduDB extends Dexie {
    // Define tables
    users!: EntityTable<User, 'id'>;
    students!: EntityTable<Student, 'id'>;
    studentDocuments!: EntityTable<StudentDocument, 'id'>;
    staff!: EntityTable<Staff, 'id'>;
    classes!: EntityTable<Class, 'id'>;
    batches!: EntityTable<Batch, 'id'>;
    sections!: EntityTable<Section, 'id'>;
    subjects!: EntityTable<Subject, 'id'>;
    attendance!: EntityTable<Attendance, 'id'>;
    feeStructures!: EntityTable<FeeStructure, 'id'>;
    feeTransactions!: EntityTable<FeeTransaction, 'id'>;
    discounts!: EntityTable<Discount, 'id'>;
    exams!: EntityTable<Exam, 'id'>;
    examSchedules!: EntityTable<ExamSchedule, 'id'>;
    examResults!: EntityTable<ExamResult, 'id'>;
    notices!: EntityTable<Notice, 'id'>;
    messages!: EntityTable<Message, 'id'>;
    certificates!: EntityTable<Certificate, 'id'>;
    idCards!: EntityTable<IDCard, 'id'>;
    institute!: EntityTable<Institute, 'id'>;
    academicYears!: EntityTable<AcademicYear, 'id'>;
    appSettings!: EntityTable<AppSettings, 'id'>;
    paymentGatewayConfigs!: EntityTable<PaymentGatewayConfig, 'id'>;

    constructor() {
        super('InSuiteEduDB');

        this.version(1).stores({
            users: '++id, email, role, isActive',
            students: '++id, studentId, classId, batchId, status, [classId+status]',
            studentDocuments: '++id, studentId, type',
            staff: '++id, staffId, role, status',
            classes: '++id, name, type',
            batches: '++id, classId, name',
            sections: '++id, classId, name',
            subjects: '++id, classId, name',
            attendance: '++id, entityType, entityId, date, [entityType+entityId+date]',
            feeStructures: '++id, classId, isActive',
            feeTransactions: '++id, studentId, receiptNumber, paidDate, [studentId+paidDate]',
            discounts: '++id, name, isActive',
            exams: '++id, classId, examType, isPublished',
            examSchedules: '++id, examId, date',
            examResults: '++id, examId, studentId, [examId+studentId]',
            notices: '++id, category, publishDate, isPinned',
            messages: '++id, senderId, receiverId, isRead',
            certificates: '++id, studentId, type, certificateNumber',
            idCards: '++id, entityType, entityId, cardNumber',
            institute: '++id',
            academicYears: '++id, isCurrent',
            appSettings: '++id',
            paymentGatewayConfigs: '++id, provider, isActive',
        });
    }
}

// Database instance
export const db = new InSuiteEduDB();

// ============================================
// Seed Data (Demo/Initial Data)
// ============================================
export async function seedDatabase() {
    // Always ensure super admin exists with correct credentials
    const superAdmin = await db.users.where('email').equals('vinkal93041@gmail.com').first();

    if (superAdmin) {
        // Update password if exists
        await db.users.update(superAdmin.id!, {
            password: 'Vinkal@890',
            role: 'super_admin',
            isActive: true,
            isVerified: true,
            isBlocked: false,
            updatedAt: new Date(),
        });
    } else {
        // Create super admin user (platform owner)
        await db.users.add({
            email: 'vinkal93041@gmail.com',
            password: 'Vinkal@890',
            role: 'super_admin',
            isActive: true,
            isVerified: true,
            isBlocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    // Create default institute if not exists
    const instituteCount = await db.institute.count();
    if (instituteCount === 0) {
        await db.institute.add({
            name: 'InSuite Academy',
            address: '123 Education Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            phone: '9876543210',
            email: 'info@insuite.edu',
            principalName: 'Dr. Sharma',
            establishedYear: 2020,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    // Create default classes if not exists
    const classCount = await db.classes.count();
    if (classCount === 0) {
        const classes = [
            { name: 'Class 1', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'EVS'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 2', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'EVS'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 3', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'EVS', 'Computer'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 4', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'Science', 'SST', 'Computer'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 5', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'Science', 'SST', 'Computer'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 6', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'Science', 'SST', 'Computer', 'Sanskrit'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 7', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'Science', 'SST', 'Computer', 'Sanskrit'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 8', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'Science', 'SST', 'Computer', 'Sanskrit'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 9', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'Science', 'SST', 'Computer'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 10', type: 'school' as const, subjects: ['English', 'Hindi', 'Math', 'Science', 'SST', 'Computer'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 11 Science', type: 'school' as const, subjects: ['English', 'Physics', 'Chemistry', 'Math', 'Computer Science'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 11 Commerce', type: 'school' as const, subjects: ['English', 'Accountancy', 'Business Studies', 'Economics', 'Math'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 12 Science', type: 'school' as const, subjects: ['English', 'Physics', 'Chemistry', 'Math', 'Computer Science'], createdAt: new Date(), updatedAt: new Date() },
            { name: 'Class 12 Commerce', type: 'school' as const, subjects: ['English', 'Accountancy', 'Business Studies', 'Economics', 'Math'], createdAt: new Date(), updatedAt: new Date() },
        ];

        await db.classes.bulkAdd(classes);
    }

    // Create default fee structures if not exists
    const feeCount = await db.feeStructures.count();
    if (feeCount === 0) {
        await db.feeStructures.bulkAdd([
            { name: 'Admission Fee', amount: 5000, frequency: 'one_time', isActive: true, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Monthly Tuition Fee (Class 1-5)', amount: 1500, frequency: 'monthly', dueDay: 10, lateFeePerDay: 50, lateFeeMaxDays: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Monthly Tuition Fee (Class 6-10)', amount: 2000, frequency: 'monthly', dueDay: 10, lateFeePerDay: 50, lateFeeMaxDays: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Monthly Tuition Fee (Class 11-12)', amount: 2500, frequency: 'monthly', dueDay: 10, lateFeePerDay: 50, lateFeeMaxDays: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Computer Lab Fee', amount: 500, frequency: 'quarterly', isActive: true, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Annual Sports Fee', amount: 1000, frequency: 'yearly', isActive: true, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Exam Fee', amount: 500, frequency: 'half_yearly', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        ]);
    }

    // Create demo students
    const studentCount = await db.students.count();
    if (studentCount === 0) {
        const demoStudents: Omit<Student, 'id'>[] = [
            {
                studentId: 'STU2026001',
                firstName: 'Aarav',
                lastName: 'Sharma',
                dateOfBirth: new Date('2015-05-15'),
                gender: 'male',
                phone: '9876543210',
                address: '123 Main Street, Delhi',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110001',
                classId: 5,
                rollNumber: '01',
                admissionDate: new Date('2024-04-01'),
                fatherName: 'Rajesh Sharma',
                fatherPhone: '9876543210',
                fatherOccupation: 'Business',
                motherName: 'Priya Sharma',
                status: 'active',
                password: 'student123',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                studentId: 'STU2026002',
                firstName: 'Ananya',
                lastName: 'Patel',
                dateOfBirth: new Date('2014-08-22'),
                gender: 'female',
                phone: '9876543220',
                address: '456 Park Avenue, Mumbai',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                classId: 6,
                rollNumber: '02',
                admissionDate: new Date('2024-04-01'),
                fatherName: 'Vikram Patel',
                fatherPhone: '9876543221',
                fatherOccupation: 'Doctor',
                motherName: 'Kavita Patel',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                studentId: 'STU2026003',
                firstName: 'Arjun',
                lastName: 'Singh',
                dateOfBirth: new Date('2013-03-10'),
                gender: 'male',
                address: '789 Lake View, Jaipur',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302001',
                classId: 7,
                rollNumber: '03',
                admissionDate: new Date('2024-04-01'),
                fatherName: 'Manpreet Singh',
                fatherPhone: '9876543231',
                fatherOccupation: 'Engineer',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                studentId: 'STU2026004',
                firstName: 'Ishita',
                lastName: 'Verma',
                dateOfBirth: new Date('2012-11-05'),
                gender: 'female',
                address: '101 Green Colony, Lucknow',
                city: 'Lucknow',
                state: 'Uttar Pradesh',
                pincode: '226001',
                classId: 8,
                rollNumber: '04',
                admissionDate: new Date('2024-04-01'),
                fatherName: 'Amit Verma',
                fatherPhone: '9876543241',
                fatherOccupation: 'Teacher',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                studentId: 'STU2026005',
                firstName: 'Kabir',
                lastName: 'Gupta',
                dateOfBirth: new Date('2011-07-18'),
                gender: 'male',
                address: '202 Hill Road, Pune',
                city: 'Pune',
                state: 'Maharashtra',
                pincode: '411001',
                classId: 9,
                rollNumber: '05',
                admissionDate: new Date('2024-04-01'),
                fatherName: 'Suresh Gupta',
                fatherPhone: '9876543251',
                fatherOccupation: 'Accountant',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await db.students.bulkAdd(demoStudents);
    }

    // Create demo staff
    const staffCount = await db.staff.count();
    if (staffCount === 0) {
        const demoStaff: Omit<Staff, 'id'>[] = [
            {
                staffId: 'STF2026001',
                firstName: 'Neha',
                lastName: 'Kapoor',
                gender: 'female',
                phone: '9876543300',
                email: 'neha.kapoor@insuite.edu',
                role: 'teacher',
                department: 'Science',
                designation: 'Senior Teacher',
                qualification: 'M.Sc. Physics',
                experience: 8,
                joiningDate: new Date('2020-04-01'),
                salary: 45000,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                staffId: 'STF2026002',
                firstName: 'Rohit',
                lastName: 'Mehta',
                gender: 'male',
                phone: '9876543301',
                email: 'rohit.mehta@insuite.edu',
                role: 'teacher',
                department: 'Mathematics',
                designation: 'Teacher',
                qualification: 'M.Sc. Mathematics',
                experience: 5,
                joiningDate: new Date('2021-04-01'),
                salary: 38000,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                staffId: 'STF2026003',
                firstName: 'Sakshi',
                lastName: 'Jain',
                gender: 'female',
                phone: '9876543302',
                email: 'sakshi.jain@insuite.edu',
                role: 'accountant',
                department: 'Admin',
                designation: 'Senior Accountant',
                qualification: 'M.Com',
                experience: 6,
                joiningDate: new Date('2020-06-01'),
                salary: 35000,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await db.staff.bulkAdd(demoStaff);
    }

    // Create academic year if not exists
    const yearCount = await db.academicYears.count();
    if (yearCount === 0) {
        await db.academicYears.add({
            name: '2025-26',
            startDate: new Date('2025-04-01'),
            endDate: new Date('2026-03-31'),
            isCurrent: true,
            createdAt: new Date(),
        });
    }

    // Create app settings if not exists
    const settingsCount = await db.appSettings.count();
    if (settingsCount === 0) {
        await db.appSettings.add({
            theme: 'light',
            language: 'en',
            dateFormat: 'DD/MM/YYYY',
            currencySymbol: '₹',
            receiptPrefix: 'RCP',
            studentIdPrefix: 'STU',
            staffIdPrefix: 'STF',
            autoBackup: true,
            updatedAt: new Date(),
        });
    }

    // Create demo fee transactions
    const transactionCount = await db.feeTransactions.count();
    if (transactionCount === 0) {
        await db.feeTransactions.bulkAdd([
            {
                studentId: 1,
                receiptNumber: 'RCP2026001',
                amount: 2000,
                totalAmount: 2000,
                paidAmount: 2000,
                dueAmount: 0,
                paymentMode: 'cash',
                feeMonth: 'January 2026',
                paidDate: new Date('2026-01-05'),
                collectedBy: 1,
                createdAt: new Date(),
            },
            {
                studentId: 2,
                receiptNumber: 'RCP2026002',
                amount: 2000,
                totalAmount: 2000,
                paidAmount: 2000,
                dueAmount: 0,
                paymentMode: 'upi',
                transactionId: 'UPI123456',
                feeMonth: 'January 2026',
                paidDate: new Date('2026-01-06'),
                collectedBy: 1,
                createdAt: new Date(),
            },
            {
                studentId: 3,
                receiptNumber: 'RCP2026003',
                amount: 2000,
                discount: 200,
                discountReason: 'Sibling discount',
                totalAmount: 1800,
                paidAmount: 1800,
                dueAmount: 0,
                paymentMode: 'card',
                feeMonth: 'January 2026',
                paidDate: new Date('2026-01-07'),
                collectedBy: 1,
                createdAt: new Date(),
            },
        ]);
    }

    // Create demo notices
    const noticeCount = await db.notices.count();
    if (noticeCount === 0) {
        await db.notices.bulkAdd([
            {
                title: 'Welcome to New Academic Year 2025-26',
                content: 'Dear Parents and Students, We are delighted to welcome you to the new academic year 2025-26. Wishing everyone a successful year ahead!',
                category: 'general',
                targetRoles: ['student', 'parent', 'teacher'],
                targetAudience: ['all'],
                publishDate: new Date(),
                isPinned: true,
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: 'Republic Day Celebration',
                content: 'Republic Day will be celebrated on 26th January with flag hoisting ceremony at 8:00 AM. All students are requested to attend in school uniform.',
                category: 'event',
                targetRoles: ['student', 'parent', 'teacher'],
                targetAudience: ['students', 'parents'],
                publishDate: new Date(),
                isPinned: false,
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    }

    console.log('Database seeded successfully!');
}

// ============================================
// Helper Functions
// ============================================

// Generate next ID with prefix
export async function generateStudentId(): Promise<string> {
    const settings = await db.appSettings.toCollection().first();
    const prefix = settings?.studentIdPrefix || 'STU';
    const year = new Date().getFullYear();
    const count = await db.students.count();
    const nextNum = String(count + 1).padStart(4, '0');
    return `${prefix}${year}${nextNum}`;
}

export async function generateStaffId(): Promise<string> {
    const settings = await db.appSettings.toCollection().first();
    const prefix = settings?.staffIdPrefix || 'STF';
    const year = new Date().getFullYear();
    const count = await db.staff.count();
    const nextNum = String(count + 1).padStart(4, '0');
    return `${prefix}${year}${nextNum}`;
}

export async function generateReceiptNumber(): Promise<string> {
    const settings = await db.appSettings.toCollection().first();
    const prefix = settings?.receiptPrefix || 'RCP';
    const year = new Date().getFullYear();
    const count = await db.feeTransactions.count();
    const nextNum = String(count + 1).padStart(4, '0');
    return `${prefix}${year}${nextNum}`;
}

export async function generateCertificateNumber(type: string): Promise<string> {
    const prefix = type.toUpperCase().substring(0, 2);
    const year = new Date().getFullYear();
    const count = await db.certificates.where('type').equals(type).count();
    const nextNum = String(count + 1).padStart(4, '0');
    return `${prefix}${year}${nextNum}`;
}

// Initialize database on load
export async function initializeDatabase() {
    try {
        await seedDatabase();

        // Initialize Firestore sync after seeding
        initializeSync().catch(err => {
            console.error('Firestore sync initialization failed:', err);
        });

        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
}

// ============================================
// Sync Helper Exports
// ============================================
export {
    syncStudent,
    syncStaffMember,
    syncFeeTransaction,
    syncAttendanceRecord,
    syncNotice,
    syncAllToFirestore,
    deleteStudentFromFirestore,
    deleteStaffFromFirestore,
    getSyncStatus,
    onSyncStatusChange,
    isAppOnline,
};
