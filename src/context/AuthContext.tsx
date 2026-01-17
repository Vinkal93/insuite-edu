import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../db/database';
import {
    auth,
    loginWithEmail,
    signupWithEmail,
    logoutUser,
    onAuthChange,
    sendPhoneOTP,
    verifyPhoneOTP,
    setupRecaptcha,
    type FirebaseUser
} from '../firebase';
import type { User, UserRole, Student, Institute } from '../types';
import type { RecaptchaVerifier } from 'firebase/auth';

interface BlockedInfo {
    message: string;
    blockedAt?: Date;
}

interface AuthResult {
    success: boolean;
    message?: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    student: Student | null;
    institute: Institute | null;
    isStudent: boolean;
    isSuperAdmin: boolean;
    loading: boolean;
    blockedInfo: BlockedInfo | null;
    firebaseUser: FirebaseUser | null;
}

interface SignupData {
    instituteName: string;
    email: string;
    phone: string;
    password: string;
    address: string;
    city: string;
    state: string;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<AuthResult>;
    studentLogin: (studentId: string, password: string) => Promise<AuthResult>;
    sendOTP: (phone: string, recaptchaContainerId?: string) => Promise<boolean>;
    verifyOTP: (phone: string, otp: string) => Promise<AuthResult>;
    signupInstitute: (data: SignupData) => Promise<AuthResult>;
    logout: () => void;
    hasPermission: (roles: UserRole[]) => boolean;
    updateStudentPassword: (studentId: number, newPassword: string) => Promise<boolean>;
    updateStudentCredentials: (studentId: number, updates: { password?: string; studentIdField?: string }) => Promise<boolean>;
    blockUser: (userId: number, message: string) => Promise<boolean>;
    unblockUser: (userId: number) => Promise<boolean>;
    blockStudent: (studentId: number, message: string) => Promise<boolean>;
    unblockStudent: (studentId: number) => Promise<boolean>;
    verifyInstitute: (instituteId: number) => Promise<boolean>;
    rejectInstitute: (instituteId: number, reason: string) => Promise<boolean>;
    recaptchaVerifier: RecaptchaVerifier | null;
    initRecaptcha: (containerId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        student: null,
        institute: null,
        isStudent: false,
        isSuperAdmin: false,
        loading: true,
        blockedInfo: null,
        firebaseUser: null,
    });

    const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in - check if it's admin or student
                const email = firebaseUser.email;
                const phone = firebaseUser.phoneNumber;

                if (email) {
                    // Email login - must be institute/admin
                    const user = await db.users.where('email').equals(email).first();
                    if (user) {
                        if (user.isBlocked) {
                            setState(prev => ({
                                ...prev,
                                loading: false,
                                blockedInfo: {
                                    message: user.blockMessage || 'Your account has been blocked.'
                                }
                            }));
                            return;
                        }

                        setState({
                            isAuthenticated: true,
                            user,
                            student: null,
                            institute: null,
                            isStudent: false,
                            isSuperAdmin: user.role === 'super_admin',
                            loading: false,
                            blockedInfo: null,
                            firebaseUser,
                        });
                        return;
                    }
                }

                if (phone) {
                    // Phone login - must be student/parent
                    const cleanPhone = phone.replace('+91', '');
                    const student = await db.students
                        .filter(s => s.fatherPhone === cleanPhone || s.phone === cleanPhone)
                        .first();

                    if (student) {
                        if (student.isBlocked) {
                            setState(prev => ({
                                ...prev,
                                loading: false,
                                blockedInfo: {
                                    message: student.blockMessage || 'Your account has been blocked.'
                                }
                            }));
                            return;
                        }

                        setState({
                            isAuthenticated: true,
                            user: null,
                            student,
                            institute: null,
                            isStudent: true,
                            isSuperAdmin: false,
                            loading: false,
                            blockedInfo: null,
                            firebaseUser,
                        });
                        return;
                    }
                }

                // Firebase user exists but no local record - sign out
                await logoutUser();
                setState(prev => ({ ...prev, loading: false }));
            } else {
                // User is signed out
                setState({
                    isAuthenticated: false,
                    user: null,
                    student: null,
                    institute: null,
                    isStudent: false,
                    isSuperAdmin: false,
                    loading: false,
                    blockedInfo: null,
                    firebaseUser: null,
                });
            }
        });

        return () => unsubscribe();
    }, []);

    // Initialize reCAPTCHA
    const initRecaptcha = (containerId: string) => {
        if (!recaptchaVerifier) {
            const verifier = setupRecaptcha(containerId);
            setRecaptchaVerifier(verifier);
        }
    };

    // Institute/Admin login with Firebase
    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            // First check local database
            const user = await db.users.where('email').equals(email).first();

            if (!user) {
                return { success: false, message: 'Account not found' };
            }

            if (user.isBlocked) {
                setState(prev => ({
                    ...prev,
                    blockedInfo: {
                        message: user.blockMessage || 'Your account has been blocked.'
                    }
                }));
                return { success: false, message: 'Account blocked' };
            }

            if (!user.isActive) {
                return { success: false, message: 'Account is not active. Please wait for admin verification.' };
            }

            if (!user.isVerified && user.role !== 'super_admin') {
                return { success: false, message: 'Your registration is pending verification.' };
            }

            // Authenticate with Firebase
            const { user: firebaseUser, error } = await loginWithEmail(email, password);

            if (error || !firebaseUser) {
                // Fallback to local auth for super admin
                if (user.role === 'super_admin' && user.password === password) {
                    setState({
                        isAuthenticated: true,
                        user,
                        student: null,
                        institute: null,
                        isStudent: false,
                        isSuperAdmin: true,
                        loading: false,
                        blockedInfo: null,
                        firebaseUser: null,
                    });
                    return { success: true };
                }
                return { success: false, message: error || 'Invalid password' };
            }

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred' };
        }
    };

    // Student login with ID & Password (local auth)
    const studentLogin = async (studentId: string, password: string): Promise<AuthResult> => {
        try {
            const student = await db.students.where('studentId').equals(studentId).first();

            if (!student) {
                return { success: false, message: 'Student ID not found' };
            }

            if (student.password !== password) {
                return { success: false, message: 'Invalid password' };
            }

            if (student.isBlocked) {
                setState(prev => ({
                    ...prev,
                    blockedInfo: {
                        message: student.blockMessage || 'Your account has been blocked.'
                    }
                }));
                return { success: false, message: 'Account blocked' };
            }

            if (student.status !== 'active') {
                return { success: false, message: 'Your account is not active' };
            }

            setState({
                isAuthenticated: true,
                user: null,
                student,
                institute: null,
                isStudent: true,
                isSuperAdmin: false,
                loading: false,
                blockedInfo: null,
                firebaseUser: null,
            });
            return { success: true };
        } catch (error) {
            console.error('Student login error:', error);
            return { success: false, message: 'An error occurred' };
        }
    };

    // Send OTP via Firebase Phone Auth
    const sendOTP = async (phone: string, recaptchaContainerId?: string): Promise<boolean> => {
        try {
            // Check if phone exists in database
            const student = await db.students
                .filter(s => s.fatherPhone === phone || s.phone === phone)
                .first();

            if (!student || student.status !== 'active') {
                return false;
            }

            // Initialize recaptcha if not already done
            if (!recaptchaVerifier && recaptchaContainerId) {
                initRecaptcha(recaptchaContainerId);
            }

            if (!recaptchaVerifier) {
                console.error('reCAPTCHA not initialized');
                return false;
            }

            const success = await sendPhoneOTP(phone, recaptchaVerifier);
            return success;
        } catch (error) {
            console.error('Send OTP error:', error);
            return false;
        }
    };

    // Verify OTP via Firebase
    const verifyOTP = async (_phone: string, otp: string): Promise<AuthResult> => {
        try {
            const firebaseUser = await verifyPhoneOTP(otp);

            if (!firebaseUser) {
                return { success: false, message: 'Invalid OTP' };
            }

            // Firebase auth state change will handle the rest
            return { success: true };
        } catch (error) {
            console.error('Verify OTP error:', error);
            return { success: false, message: 'Verification failed' };
        }
    };

    // Institute signup with Firebase
    const signupInstitute = async (data: SignupData): Promise<AuthResult> => {
        try {
            // Check if email already exists
            const existing = await db.users.where('email').equals(data.email).first();
            if (existing) {
                return { success: false, message: 'Email already registered' };
            }

            // Create account in Firebase
            const { user: firebaseUser, error } = await signupWithEmail(data.email, data.password);

            if (error || !firebaseUser) {
                return { success: false, message: error || 'Registration failed' };
            }

            // Create institute in local DB
            const instituteId = await db.institute.add({
                name: data.instituteName,
                address: data.address,
                city: data.city,
                state: data.state,
                pincode: '',
                phone: data.phone,
                email: data.email,
                isVerified: false,
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Create user account in local DB
            await db.users.add({
                email: data.email,
                password: data.password, // Keep for reference
                role: 'admin',
                instituteId: Number(instituteId),
                isActive: false,
                isVerified: false,
                isBlocked: false,
                firebaseUid: firebaseUser.uid,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Sign out - user needs verification first
            await logoutUser();

            return { success: true };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'Registration failed' };
        }
    };

    const logout = async () => {
        await logoutUser();
        setState({
            isAuthenticated: false,
            user: null,
            student: null,
            institute: null,
            isStudent: false,
            isSuperAdmin: false,
            loading: false,
            blockedInfo: null,
            firebaseUser: null,
        });
    };

    const hasPermission = (roles: UserRole[]): boolean => {
        if (state.isStudent) return false;
        if (!state.user) return false;
        if (state.user.role === 'super_admin') return true;
        return roles.includes(state.user.role);
    };

    const updateStudentPassword = async (studentId: number, newPassword: string): Promise<boolean> => {
        try {
            await db.students.update(studentId, { password: newPassword, updatedAt: new Date() });
            return true;
        } catch (error) {
            console.error('Update password error:', error);
            return false;
        }
    };

    const updateStudentCredentials = async (
        studentId: number,
        updates: { password?: string; studentIdField?: string }
    ): Promise<boolean> => {
        try {
            const updateData: Record<string, unknown> = { updatedAt: new Date() };
            if (updates.password) updateData.password = updates.password;
            if (updates.studentIdField) updateData.studentId = updates.studentIdField;

            await db.students.update(studentId, updateData);
            return true;
        } catch (error) {
            console.error('Update credentials error:', error);
            return false;
        }
    };

    const blockUser = async (userId: number, message: string): Promise<boolean> => {
        try {
            await db.users.update(userId, {
                isBlocked: true,
                blockMessage: message,
                blockedAt: new Date(),
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Block user error:', error);
            return false;
        }
    };

    const unblockUser = async (userId: number): Promise<boolean> => {
        try {
            await db.users.update(userId, {
                isBlocked: false,
                blockMessage: undefined,
                blockedAt: undefined,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Unblock user error:', error);
            return false;
        }
    };

    const blockStudent = async (studentId: number, message: string): Promise<boolean> => {
        try {
            await db.students.update(studentId, {
                isBlocked: true,
                blockMessage: message,
                blockedAt: new Date(),
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Block student error:', error);
            return false;
        }
    };

    const unblockStudent = async (studentId: number): Promise<boolean> => {
        try {
            await db.students.update(studentId, {
                isBlocked: false,
                blockMessage: undefined,
                blockedAt: undefined,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Unblock student error:', error);
            return false;
        }
    };

    const verifyInstitute = async (instituteId: number): Promise<boolean> => {
        try {
            await db.institute.update(instituteId, {
                isVerified: true,
                isActive: true,
                verifiedAt: new Date(),
                updatedAt: new Date()
            });

            const user = await db.users.where('instituteId').equals(instituteId).first();
            if (user && user.id) {
                await db.users.update(user.id, {
                    isVerified: true,
                    isActive: true,
                    updatedAt: new Date()
                });
            }

            return true;
        } catch (error) {
            console.error('Verify institute error:', error);
            return false;
        }
    };

    const rejectInstitute = async (instituteId: number, reason: string): Promise<boolean> => {
        try {
            await db.institute.update(instituteId, {
                isVerified: false,
                isActive: false,
                rejectionReason: reason,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Reject institute error:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            ...state,
            login,
            studentLogin,
            sendOTP,
            verifyOTP,
            signupInstitute,
            logout,
            hasPermission,
            updateStudentPassword,
            updateStudentCredentials,
            blockUser,
            unblockUser,
            blockStudent,
            unblockStudent,
            verifyInstitute,
            rejectInstitute,
            recaptchaVerifier,
            initRecaptcha,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
