// ============================================
// InSuite Edu - TypeScript Type Definitions
// ============================================

// User Roles
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'accountant' | 'student' | 'parent' | 'reception';

// Gender
export type Gender = 'male' | 'female' | 'other';

// Status Types
export type StudentStatus = 'active' | 'left' | 'transferred';
export type StaffStatus = 'active' | 'resigned' | 'terminated';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank' | 'cheque' | 'razorpay' | 'phonepe' | 'paytm' | 'stripe' | 'online';
export type FeeFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'one_time';
export type ExamType = 'unit_test' | 'mid_term' | 'final' | 'practical' | 'assignment';
export type ClassType = 'school' | 'course';
export type DocumentType = 'photo' | 'id_proof' | 'address_proof' | 'birth_certificate' | 'tc' | 'character_certificate' | 'bonafide' | 'marksheet' | 'other';

// ============================================
// User & Authentication
// ============================================
export interface User {
    id?: number;
    email: string;
    password: string;
    role: UserRole;
    profileId?: number;
    instituteId?: number;
    isActive: boolean;
    isVerified?: boolean;
    isBlocked?: boolean;
    blockMessage?: string;
    blockedAt?: Date;
    lastLogin?: Date;
    firebaseUid?: string;  // Firebase Auth UID
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
}

// ============================================
// Student
// ============================================
export interface Student {
    id?: number;
    studentId: string;           // Auto-generated: STU2026001
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: Gender;
    bloodGroup?: string;
    phone?: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    photo?: string;              // Base64

    // Academic Info
    classId: number;
    batchId?: number;
    sectionId?: number;
    rollNumber?: string;
    admissionDate: Date;
    admissionNumber?: string;
    previousSchool?: string;

    // Parent/Guardian Info
    fatherName: string;
    fatherPhone: string;
    fatherOccupation?: string;
    motherName?: string;
    motherPhone?: string;
    motherOccupation?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianRelation?: string;

    // Status
    status: StudentStatus;
    remarks?: string;

    // Authentication
    password?: string;
    isBlocked?: boolean;
    blockMessage?: string;
    blockedAt?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface StudentDocument {
    id?: number;
    studentId: number;
    type: DocumentType;
    name: string;
    data: string;                // Base64
    uploadedBy: number;
    createdAt: Date;
}

// ============================================
// Staff & Teacher
// ============================================
export interface Staff {
    id?: number;
    staffId: string;             // Auto-generated: STF2026001
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender: Gender;
    phone: string;
    email: string;
    address?: string;
    photo?: string;

    // Professional Info
    role: 'teacher' | 'accountant' | 'admin' | 'reception' | 'librarian' | 'peon' | 'other';
    department?: string;
    designation?: string;
    qualification?: string;
    specialization?: string;
    experience?: number;

    // Employment Info
    joiningDate: Date;
    salary: number;
    bankAccount?: string;
    ifscCode?: string;
    panNumber?: string;
    aadharNumber?: string;

    // Status
    status: StaffStatus;
    remarks?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Class, Batch & Section
// ============================================
export interface Class {
    id?: number;
    name: string;                // e.g., "Class 10" or "BCA Sem 1"
    type: ClassType;
    description?: string;
    subjects: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Batch {
    id?: number;
    classId: number;
    name: string;                // e.g., "Morning Batch"
    timing?: string;             // e.g., "9:00 AM - 12:00 PM"
    teacherId?: number;
    maxStrength?: number;
    createdAt: Date;
}

export interface Section {
    id?: number;
    classId: number;
    name: string;                // e.g., "A", "B", "C"
    teacherId?: number;
    createdAt: Date;
}

export interface Subject {
    id?: number;
    name: string;
    code?: string;
    classId: number;
    teacherId?: number;
    maxMarks?: number;
    createdAt: Date;
}

// ============================================
// Attendance
// ============================================
export interface Attendance {
    id?: number;
    entityType: 'student' | 'staff';
    entityId: number;
    date: Date;
    status: AttendanceStatus;
    inTime?: string;
    outTime?: string;
    remarks?: string;
    markedBy: number;
    createdAt: Date;
}

export interface AttendanceSummary {
    entityId: number;
    entityType: 'student' | 'staff';
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    percentage: number;
}

// ============================================
// Fees
// ============================================
export interface FeeStructure {
    id?: number;
    name: string;
    classId?: number;
    amount: number;
    frequency: FeeFrequency;
    dueDay?: number;
    lateFeePerDay?: number;
    lateFeeMaxDays?: number;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface FeeTransaction {
    id?: number;
    studentId: number;
    feeStructureId?: number;
    receiptNumber: string;       // Auto-generated: RCP2026001

    // Amount Details
    amount: number;
    discount?: number;
    discountReason?: string;
    lateFee?: number;
    previousDue?: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;

    // Payment Info
    paymentMode: PaymentMode;
    transactionId?: string;
    bankName?: string;
    chequeNumber?: string;

    // Dates
    feeMonth?: string;           // e.g., "January 2026"
    dueDate?: Date;
    paidDate: Date;

    // Meta
    collectedBy: number;
    remarks?: string;
    createdAt: Date;
}

export interface Discount {
    id?: number;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    description?: string;
    isActive: boolean;
    createdAt: Date;
}

// ============================================
// Exam & Results
// ============================================
export interface Exam {
    id?: number;
    name: string;
    classId: number;
    examType: ExamType;
    academicYear: string;
    startDate: Date;
    endDate?: Date;
    maxMarks: number;
    passingMarks: number;
    description?: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExamSchedule {
    id?: number;
    examId: number;
    subject: string;
    date: Date;
    startTime: string;
    endTime: string;
    room?: string;
}

export interface ExamResult {
    id?: number;
    examId: number;
    studentId: number;
    subject: string;
    marksObtained: number;
    maxMarks: number;
    grade?: string;
    remarks?: string;
    isAbsent?: boolean;
    enteredBy: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface StudentResult {
    studentId: number;
    examId: number;
    subjects: Array<{
        name: string;
        marks: number;
        maxMarks: number;
        grade: string;
    }>;
    totalMarks: number;
    totalMaxMarks: number;
    percentage: number;
    grade: string;
    rank?: number;
    remarks?: string;
}

// ============================================
// Communication
// ============================================
export interface Notice {
    id?: number;
    title: string;
    content: string;
    category: 'general' | 'academic' | 'event' | 'holiday' | 'urgent';
    targetRoles: UserRole[];
    targetAudience: ('all' | 'students' | 'parents' | 'teachers' | 'staff')[];
    targetClasses?: number[];
    attachments?: string[];
    publishDate: Date;
    expiryDate?: Date;
    isPinned: boolean;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id?: number;
    senderId: number;
    senderType: 'staff' | 'parent';
    receiverId: number;
    receiverType: 'staff' | 'parent';
    subject: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
}

// ============================================
// Documents & Certificates
// ============================================
export interface Certificate {
    id?: number;
    studentId: number;
    type: 'tc' | 'character' | 'bonafide' | 'study' | 'custom';
    certificateNumber: string;
    issueDate: Date;
    content?: string;
    issuedBy: number;
    createdAt: Date;
}

export interface IDCard {
    id?: number;
    entityType: 'student' | 'staff';
    entityId: number;
    cardNumber: string;
    issueDate: Date;
    expiryDate?: Date;
    isActive: boolean;
    createdAt: Date;
}

// ============================================
// Settings & Configuration
// ============================================
export interface Institute {
    id?: number;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email?: string;
    website?: string;
    logo?: string;
    principalName?: string;
    registrationNumber?: string;
    affiliationNumber?: string;
    establishedYear?: number;
    gstNumber?: string;
    // Verification
    isVerified?: boolean;
    isActive?: boolean;
    verifiedAt?: Date;
    rejectionReason?: string;
    // Blocking
    isBlocked?: boolean;
    blockMessage?: string;
    blockedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AcademicYear {
    id?: number;
    name: string;                // e.g., "2025-26"
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    createdAt: Date;
}

export interface AppSettings {
    id?: number;
    theme: 'light' | 'dark' | 'system';
    language: string;
    dateFormat: string;
    currencySymbol: string;
    receiptPrefix: string;
    studentIdPrefix: string;
    staffIdPrefix: string;
    autoBackup: boolean;
    updatedAt: Date;
}

// ============================================
// Payment Gateway Configuration
// ============================================
export type PaymentGatewayType = 'razorpay' | 'phonepe' | 'paytm' | 'stripe' | 'upi_direct';

export interface PaymentGatewayConfig {
    id?: number;
    provider: PaymentGatewayType;
    displayName: string;
    isActive: boolean;
    isTestMode: boolean;
    // Common fields
    merchantName?: string;
    // Razorpay
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    // PhonePe
    phonepeMerchantId?: string;
    phonepeApiKey?: string;
    phonepeSaltKey?: string;
    phonepeSaltIndex?: string;
    // Paytm
    paytmMid?: string;
    paytmMerchantKey?: string;
    // Stripe
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    // UPI Direct (simple UPI ID for direct payments)
    upiId?: string;
    upiQrCode?: string; // Base64 QR code image
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Analytics & Reports
// ============================================
export interface DashboardStats {
    totalStudents: number;
    activeStudents: number;
    totalTeachers: number;
    totalClasses: number;
    todayCollections: number;
    monthlyCollections: number;
    pendingFees: number;
    todayAttendance: number;
    recentAdmissions: Student[];
    recentTransactions: FeeTransaction[];
    attendanceChartData: Array<{ date: string; present: number; absent: number }>;
    feeChartData: Array<{ month: string; amount: number }>;
}

// ============================================
// Form Props & State
// ============================================
export interface AdmissionFormData {
    // Step 1: Personal
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    bloodGroup?: string;

    // Step 2: Contact
    phone?: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;

    // Step 3: Parent
    fatherName: string;
    fatherPhone: string;
    fatherOccupation?: string;
    motherName?: string;
    motherPhone?: string;

    // Step 4: Academic
    classId: number;
    batchId?: number;
    sectionId?: number;
    previousSchool?: string;

    // Step 5: Documents
    photo?: string;
}

export interface FeeCollectionFormData {
    studentId: number;
    feeStructureId?: number;
    amount: number;
    discount?: number;
    discountReason?: string;
    paymentMode: PaymentMode;
    transactionId?: string;
    remarks?: string;
}

// ============================================
// Component Props
// ============================================
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    footer?: React.ReactNode;
}

export interface TableColumn<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    width?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    loading?: boolean;
    searchable?: boolean;
    searchKeys?: (keyof T)[];
    pagination?: boolean;
    pageSize?: number;
    onRowClick?: (item: T) => void;
    actions?: (item: T) => React.ReactNode;
    emptyMessage?: string;
}

export interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'students' | 'teachers' | 'fees' | 'pending' | 'attendance';
}
