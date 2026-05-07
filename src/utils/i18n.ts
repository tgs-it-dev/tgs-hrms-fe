/**
 * Centralised i18n utility for TGS HRMS.
 *
 * ⚠️  SINGLE SOURCE OF TRUTH for all UI strings.
 * Do NOT add inline translation strings elsewhere in the codebase.
 * All new string pairs must be added here first, then consumed via
 * `useGetText` (src/hooks/useGetText.ts) or the standalone `getText` helper.
 *
 * Pattern used throughout the project:
 *   getText(en, ar) → returns `ar` when language === 'ar', otherwise `en`
 *
 * Sidebar menu labels are an exception — they live in `menuLabelAr` inside
 * Sidebar.tsx because they are keyed by the English label string at render
 * time. Any new menu entries must be added there AND here for audit parity.
 */

// ---------------------------------------------------------------------------
// Core helper — language-agnostic, accepts raw strings
// ---------------------------------------------------------------------------
export function getText(lang: 'en' | 'ar', en: string, ar: string): string {
  return lang === 'ar' ? ar : en;
}

// ---------------------------------------------------------------------------
// Shared translation catalogue
// Keys are grouped by feature / component so it is easy to find gaps.
// ---------------------------------------------------------------------------
export const translations = {
  // ── Common ──────────────────────────────────────────────────────────────
  common: {
    save: { en: 'Save', ar: 'حفظ' },
    cancel: { en: 'Cancel', ar: 'إلغاء' },
    delete: { en: 'Delete', ar: 'حذف' },
    edit: { en: 'Edit', ar: 'تعديل' },
    create: { en: 'Create', ar: 'إنشاء' },
    update: { en: 'Update', ar: 'تحديث' },
    search: { en: 'Search', ar: 'بحث' },
    loading: { en: 'Loading…', ar: 'جارٍ التحميل…' },
    noResults: { en: 'No results found', ar: 'لا توجد نتائج' },
    actions: { en: 'Actions', ar: 'الإجراءات' },
    name: { en: 'Name', ar: 'الاسم' },
    description: { en: 'Description', ar: 'الوصف' },
    status: { en: 'Status', ar: 'الحالة' },
    date: { en: 'Date', ar: 'التاريخ' },
    all: { en: 'All', ar: 'الكل' },
    yes: { en: 'Yes', ar: 'نعم' },
    no: { en: 'No', ar: 'لا' },
    close: { en: 'Close', ar: 'إغلاق' },
    confirm: { en: 'Confirm', ar: 'تأكيد' },
    back: { en: 'Back', ar: 'رجوع' },
    next: { en: 'Next', ar: 'التالي' },
    submit: { en: 'Submit', ar: 'إرسال' },
    reset: { en: 'Reset', ar: 'إعادة تعيين' },
    view: { en: 'View', ar: 'عرض' },
    download: { en: 'Download', ar: 'تنزيل' },
    upload: { en: 'Upload', ar: 'رفع' },
    active: { en: 'Active', ar: 'نشط' },
    inactive: { en: 'Inactive', ar: 'غير نشط' },
    showingPage: { en: 'Showing page', ar: 'عرض الصفحة' },
    of: { en: 'of', ar: 'من' },
    records: { en: 'records', ar: 'سجل' },
    required: { en: 'Required', ar: 'مطلوب' },
  },

  // ── Navbar ───────────────────────────────────────────────────────────────
  navbar: {
    search: { en: 'Search', ar: 'بحث' },
    notifications: { en: 'Notifications', ar: 'الإشعارات' },
    markAllRead: { en: 'Mark all read', ar: 'تعليم الكل كمقروء' },
    clear: { en: 'Clear', ar: 'مسح' },
    noNotifications: { en: 'No notifications', ar: 'لا توجد إشعارات' },
    noResults: { en: 'No results found', ar: 'لا توجد نتائج' },
    members: { en: 'Members', ar: 'الأعضاء' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
    signout: { en: 'Log out', ar: 'تسجيل الخروج' },
    profile: { en: 'Profile', ar: 'الملف الشخصي' },
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebar: {
    dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
    announcements: { en: 'Announcements', ar: 'الإعلانات' },
    projects: { en: 'Projects', ar: 'المشاريع' },
    projectList: { en: 'Project List', ar: 'قائمة المشاريع' },
    addProject: { en: 'Add Project', ar: 'إضافة مشروع' },
    tenant: { en: 'Tenant', ar: 'المستأجر' },
    addTenant: { en: 'Add Tenant', ar: 'إضافة مستأجر' },
    department: { en: 'Department', ar: 'القسم' },
    departmentList: { en: 'Department List', ar: 'قائمة الأقسام' },
    designation: { en: 'Designation', ar: 'المسمى الوظيفي' },
    userList: { en: 'User List', ar: 'قائمة المستخدمين' },
    policies: { en: 'Policies', ar: 'السياسات' },
    holidays: { en: 'Holidays', ar: 'الإجازات الرسمية' },
    employees: { en: 'Employees', ar: 'الموظفون' },
    employeeList: { en: 'Employee List', ar: 'قائمة الموظفين' },
    tenantEmployees: { en: 'Tenant Employees', ar: 'موظفو المستأجر' },
    teams: { en: 'Teams', ar: 'الفرق' },
    teamManagement: { en: 'Team Management', ar: 'إدارة الفرق' },
    managerTasks: { en: 'Manager Tasks', ar: 'مهام المدير' },
    myTasks: { en: 'My Tasks', ar: 'مهامي' },
    attendance: { en: 'Attendance', ar: 'الحضور' },
    geofencing: { en: 'Geofencing', ar: 'الجيوفنسينج' },
    dailyAttendance: { en: 'Daily Attendance', ar: 'الحضور اليومي' },
    report: { en: 'Report', ar: 'التقرير' },
    leaveRequest: { en: 'Leave Request', ar: 'طلب إجازة' },
    leaveAnalytics: { en: 'Leave Analytics', ar: 'تحليلات الإجازات' },
    reports: { en: 'Reports', ar: 'التقارير' },
    crossTenantLeaves: { en: 'Cross Tenant Leaves', ar: 'إجازات المستأجرين' },
    performance: { en: 'Performance', ar: 'الأداء' },
    employeePerformance: { en: 'Employee Performance', ar: 'أداء الموظف' },
    accounts: { en: 'Accounts', ar: 'الحسابات' },
    invoice: { en: 'Invoice', ar: 'الفاتورة' },
    payments: { en: 'Payments', ar: 'المدفوعات' },
    auditLogs: { en: 'Audit Logs', ar: 'سجلات التدقيق' },
    app: { en: 'App', ar: 'التطبيق' },
    chat: { en: 'Chat', ar: 'المحادثة' },
    calendar: { en: 'Calendar', ar: 'التقويم' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
    logout: { en: 'Log Out', ar: 'تسجيل الخروج' },
    otherPages: { en: 'Other Pages', ar: 'صفحات أخرى' },
    login: { en: 'Login', ar: 'تسجيل الدخول' },
    register: { en: 'Register', ar: 'تسجيل' },
    error: { en: 'Error', ar: 'خطأ' },
    uiComponents: { en: 'UI Components', ar: 'مكونات الواجهة' },
    buttons: { en: 'Buttons', ar: 'الأزرار' },
    cards: { en: 'Cards', ar: 'البطاقات' },
    modals: { en: 'Modals', ar: 'النوافذ المنبثقة' },
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboard: {
    title: { en: 'Dashboard', ar: 'لوحة التحكم' },
    totalEmployees: { en: 'Total Employees', ar: 'إجمالي الموظفين' },
    totalTenants: { en: 'Total Tenants', ar: 'إجمالي المستأجرين' },
    totalRevenue: { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
    totalExpenses: { en: 'Total Expenses', ar: 'إجمالي المصروفات' },
    activeTenants: { en: 'Active Tenants', ar: 'المستأجرون النشطون' },
    recentActivity: { en: 'Recent Activity', ar: 'النشاط الأخير' },
    systemUptime: { en: 'System Uptime', ar: 'وقت تشغيل النظام' },
  },

  // ── Departments ──────────────────────────────────────────────────────────
  departments: {
    title: { en: 'Departments', ar: 'إدارة الأقسام' },
    create: { en: 'Create Department', ar: 'إنشاء قسم' },
    createShort: { en: 'Create', ar: 'إنشاء' },
    createFirst: { en: 'Create First Department', ar: 'إنشاء قسم جديد' },
    noDepartments: { en: 'No Departments Found', ar: 'لا توجد أقسام' },
    description: {
      en: 'Get started by creating your first department',
      ar: 'ابدأ بإنشاء قسم جديد لإدارة مؤسستك',
    },
    allDepartments: { en: 'All Departments', ar: 'كل الأقسام' },
    filterByDepartment: { en: 'Filter by department', ar: 'تصفية حسب القسم' },
  },

  // ── Designations ─────────────────────────────────────────────────────────
  designations: {
    title: { en: 'Designation', ar: 'المسمى الوظيفي' },
    createNew: { en: 'Create New Designation', ar: 'إنشاء مسمى وظيفي جديد' },
    create: { en: 'Create Designation', ar: 'إنشاء مسمى وظيفي' },
    edit: { en: 'Edit Designation', ar: 'تعديل المسمى الوظيفي' },
    titleField: {
      en: 'Designation Title',
      ar: 'عنوان المسمى الوظيفي (بالإنجليزية)',
    },
    titleRequired: {
      en: 'Designation title is required',
      ar: 'عنوان المسمى الوظيفي مطلوب',
    },
    positions: { en: 'positions', ar: 'منصب' },
    noDesignations: {
      en: 'No designations found',
      ar: 'لا توجد مسميات وظيفية',
    },
    noDesignationsForDept: {
      en: 'No designations found for this department',
      ar: 'لا توجد مسميات وظيفية لهذا القسم',
    },
  },

  // ── Announcements ────────────────────────────────────────────────────────
  announcements: {
    title: { en: 'Announcements', ar: 'الإعلانات' },
    create: { en: 'Create Announcement', ar: 'إنشاء إعلان' },
    edit: { en: 'Edit Announcement', ar: 'تعديل الإعلان' },
    noAnnouncements: { en: 'No announcements yet', ar: 'لا توجد إعلانات بعد' },
    titleField: { en: 'Title', ar: 'العنوان' },
    content: { en: 'Content', ar: 'المحتوى' },
    createdAt: { en: 'Created At', ar: 'تاريخ الإنشاء' },
    expiresAt: { en: 'Expires At', ar: 'تاريخ الانتهاء' },
    audience: { en: 'Audience', ar: 'الجمهور' },
    confirmDelete: {
      en: 'Are you sure you want to delete this announcement?',
      ar: 'هل أنت متأكد أنك تريد حذف هذا الإعلان؟',
    },
  },

  // ── Attendance ───────────────────────────────────────────────────────────
  attendance: {
    title: { en: 'Attendance', ar: 'الحضور' },
    checkIn: { en: 'Check In', ar: 'تسجيل الحضور' },
    checkOut: { en: 'Check Out', ar: 'تسجيل الانصراف' },
    present: { en: 'Present', ar: 'حاضر' },
    absent: { en: 'Absent', ar: 'غائب' },
    late: { en: 'Late', ar: 'متأخر' },
    leave: { en: 'On Leave', ar: 'في إجازة' },
    employee: { en: 'Employee', ar: 'الموظف' },
    department: { en: 'Department', ar: 'القسم' },
    noRecords: { en: 'No attendance records found', ar: 'لا توجد سجلات حضور' },
    dailyReport: { en: 'Daily Attendance Report', ar: 'تقرير الحضور اليومي' },
    summary: { en: 'Attendance Summary', ar: 'ملخص الحضور' },
  },

  // ── Leave ────────────────────────────────────────────────────────────────
  leave: {
    title: { en: 'Leave Request', ar: 'طلب إجازة' },
    apply: { en: 'Apply for Leave', ar: 'تقديم طلب إجازة' },
    type: { en: 'Leave Type', ar: 'نوع الإجازة' },
    from: { en: 'From', ar: 'من' },
    to: { en: 'To', ar: 'إلى' },
    reason: { en: 'Reason', ar: 'السبب' },
    status: { en: 'Status', ar: 'الحالة' },
    pending: { en: 'Pending', ar: 'قيد الانتظار' },
    approved: { en: 'Approved', ar: 'تمت الموافقة' },
    rejected: { en: 'Rejected', ar: 'مرفوض' },
    noLeaves: { en: 'No leave requests found', ar: 'لا توجد طلبات إجازة' },
    history: { en: 'Leave History', ar: 'تاريخ الإجازات' },
  },

  // ── Employees ────────────────────────────────────────────────────────────
  employees: {
    title: { en: 'Employee List', ar: 'قائمة الموظفين' },
    invite: { en: 'Invite Employee', ar: 'دعوة موظف' },
    noEmployees: { en: 'No employees found', ar: 'لا يوجد موظفون' },
    firstName: { en: 'First Name', ar: 'الاسم الأول' },
    lastName: { en: 'Last Name', ar: 'اسم العائلة' },
    email: { en: 'Email', ar: 'البريد الإلكتروني' },
    role: { en: 'Role', ar: 'الدور' },
    department: { en: 'Department', ar: 'القسم' },
    designation: { en: 'Designation', ar: 'المسمى الوظيفي' },
    joinDate: { en: 'Join Date', ar: 'تاريخ الالتحاق' },
  },

  // ── Teams ────────────────────────────────────────────────────────────────
  teams: {
    title: { en: 'Team Management', ar: 'إدارة الفرق' },
    create: { en: 'Create Team', ar: 'إنشاء فريق' },
    edit: { en: 'Edit Team', ar: 'تعديل الفريق' },
    delete: { en: 'Delete Team', ar: 'حذف الفريق' },
    members: { en: 'Members', ar: 'الأعضاء' },
    noTeams: { en: 'No teams found', ar: 'لا توجد فرق' },
    teamName: { en: 'Team Name', ar: 'اسم الفريق' },
    addMember: { en: 'Add Member', ar: 'إضافة عضو' },
    removeMember: { en: 'Remove Member', ar: 'إزالة عضو' },
  },

  // ── Settings ─────────────────────────────────────────────────────────────
  settings: {
    title: { en: 'Settings', ar: 'الإعدادات' },
    language: { en: 'Language', ar: 'اللغة' },
    theme: { en: 'Theme', ar: 'المظهر' },
    darkMode: { en: 'Dark Mode', ar: 'الوضع الداكن' },
    lightMode: { en: 'Light Mode', ar: 'الوضع الفاتح' },
    notifications: { en: 'Notifications', ar: 'الإشعارات' },
    account: { en: 'Account', ar: 'الحساب' },
    security: { en: 'Security', ar: 'الأمان' },
    features: { en: 'Feature Management', ar: 'إدارة الميزات' },
  },

  // ── Tenants ──────────────────────────────────────────────────────────────
  tenants: {
    title: { en: 'Tenants', ar: 'المستأجرون' },
    allTenants: { en: 'All Tenants', ar: 'جميع المستأجرين' },
    selectTenant: { en: 'Select Tenant', ar: 'اختر المستأجر' },
    loadingTenants: { en: 'Loading tenants…', ar: 'جارٍ تحميل المستأجرين…' },
    noTenants: { en: 'No tenants found', ar: 'لا يوجد مستأجرون' },
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: { en: 'Login', ar: 'تسجيل الدخول' },
    loginSubtitle: {
      en: 'Enter your details to continue',
      ar: 'أدخل بياناتك للمتابعة',
    },
    email: { en: 'Email', ar: 'البريد الإلكتروني' },
    emailPlaceholder: { en: 'Enter your email', ar: 'أدخل بريدك الإلكتروني' },
    password: { en: 'Password', ar: 'كلمة المرور' },
    rememberMe: { en: 'Remember me', ar: 'تذكرني' },
    forgotPassword: { en: 'Forgot Password?', ar: 'نسيت كلمة المرور؟' },
    signingIn: { en: 'Signing in…', ar: 'جاري تسجيل الدخول...' },
    continueWithGoogle: {
      en: 'Continue with Google',
      ar: 'تسجيل الدخول باستخدام جوجل',
    },
    noAccount: { en: "Don't have an account? ", ar: 'ليس لديك حساب؟ ' },
    signUp: { en: 'Sign Up', ar: 'سجل' },
    or: { en: 'OR', ar: 'أو' },
    emailRequired: {
      en: 'Please enter your email',
      ar: 'يرجى إدخال البريد الإلكتروني',
    },
    emailInvalid: {
      en: 'Please enter a valid email',
      ar: 'يرجى إدخال بريد إلكتروني صحيح',
    },
    passwordRequired: {
      en: 'Please enter your password',
      ar: 'يرجى إدخال كلمة المرور',
    },
    networkError: {
      en: 'Network error. Please check your connection and try again.',
      ar: 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك ثم حاول مرة أخرى.',
    },
  },

  // ── Delete Confirmation ──────────────────────────────────────────────────
  deleteConfirmation: {
    title: { en: 'Confirm Delete', ar: 'تأكيد الحذف' },
    cannotUndo: {
      en: 'This action cannot be undone.',
      ar: 'لا يمكن التراجع عن هذا الإجراء.',
    },
  },

  // ── Performance ──────────────────────────────────────────────────────────
  performance: {
    title: { en: 'Performance', ar: 'الأداء' },
    employeePerformance: { en: 'Employee Performance', ar: 'أداء الموظف' },
    kpi: { en: 'KPI', ar: 'مؤشر الأداء الرئيسي' },
    score: { en: 'Score', ar: 'النتيجة' },
    trend: { en: 'Trend', ar: 'الاتجاه' },
  },

  // ── HR Policies ──────────────────────────────────────────────────────────
  policies: {
    title: { en: 'HR Policies', ar: 'سياسات الموارد البشرية' },
    create: { en: 'Create Policy', ar: 'إنشاء سياسة' },
    edit: { en: 'Edit Policy', ar: 'تعديل السياسة' },
    noPolicies: { en: 'No policies found', ar: 'لا توجد سياسات' },
    policyName: { en: 'Policy Name', ar: 'اسم السياسة' },
    policyType: { en: 'Policy Type', ar: 'نوع السياسة' },
  },

  // ── Holidays ────────────────────────────────────────────────────────────
  holidays: {
    title: { en: 'Holiday Calendar', ar: 'تقويم الإجازات الرسمية' },
    addHoliday: { en: 'Add Holiday', ar: 'إضافة إجازة رسمية' },
    noHolidays: { en: 'No holidays found', ar: 'لا توجد إجازات رسمية' },
    holidayName: { en: 'Holiday Name', ar: 'اسم الإجازة' },
    holidayDate: { en: 'Date', ar: 'التاريخ' },
    upcoming: { en: 'Upcoming Holidays', ar: 'الإجازات الرسمية القادمة' },
  },
} as const;

export type TranslationCatalogue = typeof translations;
