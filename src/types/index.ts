// Consolidated Type Exports - Single Source of Truth
export * from './availability';
export * from './chart';
export * from './context';
export * from './interview';
export * from './stat';
export * from './user';

// Employee types (exported explicitly to avoid conflicts with mock data)
export type { Department, Designation, FormData, FormErrors } from './employee';

// Additional consolidated types
export * from './leave';
export * from './holiday';
export * from './policy';

// Mock Data for Designation Management System
import type {
  Department as MockDepartment,
  Designation as MockDesignation,
} from '../Data/mockData';
export const mockDepartments: MockDepartment[] = [
  {
    id: 1,
    name: 'Human Resources',
    nameAr: 'الموارد البشرية',
    color: '#FFB300',
    icon: 'people',
  },
  {
    id: 2,
    name: 'Information Technology',
    nameAr: 'تكنولوجيا المعلومات',
    color: '#1976D2',
    icon: 'computer',
  },
  {
    id: 3,
    name: 'Finance & Accounting',
    nameAr: 'المالية والمحاسبة',
    color: '#388E3C',
    icon: 'account_balance',
  },
  {
    id: 4,
    name: 'Marketing & Sales',
    nameAr: 'التسويق والمبيعات',
    color: '#E64A19',
    icon: 'trending_up',
  },
  {
    id: 5,
    name: 'Operations & Logistics',
    nameAr: 'العمليات واللوجستيات',
    color: '#7B1FA2',
    icon: 'local_shipping',
  },
  {
    id: 6,
    name: 'Legal & Compliance',
    nameAr: 'القانونية والامتثال',
    color: '#455A64',
    icon: 'gavel',
  },
  {
    id: 7,
    name: 'Research & Development',
    nameAr: 'البحث والتطوير',
    color: '#0288D1',
    icon: 'science',
  },
  {
    id: 8,
    name: 'Customer Service',
    nameAr: 'خدمة العملاء',
    color: '#FBC02D',
    icon: 'support_agent',
  },
  {
    id: 9,
    name: 'Quality Assurance',
    nameAr: 'ضمان الجودة',
    color: '#C62828',
    icon: 'verified',
  },
  {
    id: 10,
    name: 'Administration',
    nameAr: 'الإدارة العامة',
    color: '#6D4C41',
    icon: 'admin_panel_settings',
  },
  {
    id: 11,
    name: 'Security & Safety',
    nameAr: 'الأمن والسلامة',
    color: '#2E7D32',
    icon: 'security',
  },
  {
    id: 12,
    name: 'Training & Development',
    nameAr: 'التدريب والتطوير',
    color: '#512DA8',
    icon: 'school',
  },
];

// Designations Mock Data
export const mockDesignations: MockDesignation[] = [
  // Human Resources Department (ID: 1)
  {
    id: 1,
    title: 'HR Director',
    titleAr: 'مدير الموارد البشرية',
    departmentId: 1,
  },
  {
    id: 2,
    title: 'HR Manager',
    titleAr: 'مدير الموارد البشرية',
    departmentId: 1,
  },
  {
    id: 3,
    title: 'Senior HR Specialist',
    titleAr: 'أخصائي موارد بشرية أول',
    departmentId: 1,
  },
  {
    id: 4,
    title: 'HR Specialist',
    titleAr: 'أخصائي موارد بشرية',
    departmentId: 1,
  },
  {
    id: 5,
    title: 'Recruitment Manager',
    titleAr: 'مدير التوظيف',
    departmentId: 1,
  },
  {
    id: 6,
    title: 'Recruitment Officer',
    titleAr: 'موظف التوظيف',
    departmentId: 1,
  },
  {
    id: 7,
    title: 'Training Coordinator',
    titleAr: 'منسق التدريب',
    departmentId: 1,
  },
  {
    id: 9,
    title: 'Employee Relations Manager',
    titleAr: 'مدير علاقات الموظفين',
    departmentId: 1,
  },
  {
    id: 10,
    title: 'HR Assistant',
    titleAr: 'مساعد موارد بشرية',
    departmentId: 1,
  },

  // Information Technology Department (ID: 2)
  {
    id: 11,
    title: 'IT Director',
    titleAr: 'مدير تكنولوجيا المعلومات',
    departmentId: 2,
  },
  {
    id: 12,
    title: 'IT Manager',
    titleAr: 'مدير تكنولوجيا المعلومات',
    departmentId: 2,
  },
  {
    id: 13,
    title: 'Senior Software Engineer',
    titleAr: 'مهندس برمجيات أول',
    departmentId: 2,
  },
  {
    id: 14,
    title: 'Software Engineer',
    titleAr: 'مهندس برمجيات',
    departmentId: 2,
  },
  {
    id: 15,
    title: 'Junior Software Engineer',
    titleAr: 'مهندس برمجيات مبتدئ',
    departmentId: 2,
  },
  {
    id: 16,
    title: 'Frontend Developer',
    titleAr: 'مطور واجهات أمامية',
    departmentId: 2,
  },
  { id: 17, title: 'Backend Developer', titleAr: 'مطور خلفي', departmentId: 2 },
  {
    id: 18,
    title: 'Full Stack Developer',
    titleAr: 'مطور متكامل',
    departmentId: 2,
  },
  {
    id: 19,
    title: 'Mobile App Developer',
    titleAr: 'مطور تطبيقات الجوال',
    departmentId: 2,
  },
  {
    id: 20,
    title: 'System Administrator',
    titleAr: 'مدير النظام',
    departmentId: 2,
  },
  {
    id: 21,
    title: 'Network Administrator',
    titleAr: 'مدير الشبكة',
    departmentId: 2,
  },
  {
    id: 22,
    title: 'Database Administrator',
    titleAr: 'مدير قاعدة البيانات',
    departmentId: 2,
  },
  {
    id: 23,
    title: 'DevOps Engineer',
    titleAr: 'مهندس DevOps',
    departmentId: 2,
  },
  {
    id: 24,
    title: 'Cloud Engineer',
    titleAr: 'مهندس السحابة',
    departmentId: 2,
  },
  {
    id: 25,
    title: 'Cybersecurity Specialist',
    titleAr: 'أخصائي الأمن السيبراني',
    departmentId: 2,
  },
  {
    id: 26,
    title: 'IT Support Specialist',
    titleAr: 'أخصائي الدعم الفني',
    departmentId: 2,
  },
  {
    id: 27,
    title: 'IT Technician',
    titleAr: 'فني تكنولوجيا المعلومات',
    departmentId: 2,
  },

  // Finance & Accounting Department (ID: 3)
  {
    id: 28,
    title: 'Chief Financial Officer',
    titleAr: 'المدير المالي التنفيذي',
    departmentId: 3,
  },
  {
    id: 29,
    title: 'Finance Director',
    titleAr: 'مدير المالية',
    departmentId: 3,
  },
  {
    id: 30,
    title: 'Finance Manager',
    titleAr: 'مدير المالية',
    departmentId: 3,
  },
  { id: 31, title: 'Senior Accountant', titleAr: 'محاسب أول', departmentId: 3 },
  { id: 32, title: 'Accountant', titleAr: 'محاسب', departmentId: 3 },
  {
    id: 33,
    title: 'Junior Accountant',
    titleAr: 'محاسب مبتدئ',
    departmentId: 3,
  },
  { id: 34, title: 'Financial Analyst', titleAr: 'محلل مالي', departmentId: 3 },
  {
    id: 35,
    title: 'Budget Analyst',
    titleAr: 'محلل الميزانية',
    departmentId: 3,
  },
  { id: 36, title: 'Tax Specialist', titleAr: 'أخصائي ضرائب', departmentId: 3 },
  { id: 37, title: 'Internal Auditor', titleAr: 'مدقق داخلي', departmentId: 3 },
  { id: 38, title: 'External Auditor', titleAr: 'مدقق خارجي', departmentId: 3 },
  {
    id: 39,
    title: 'Accounts Payable Specialist',
    titleAr: 'أخصائي حسابات دائنة',
    departmentId: 3,
  },
  {
    id: 40,
    title: 'Accounts Receivable Specialist',
    titleAr: 'أخصائي حسابات مدينة',
    departmentId: 3,
  },
  { id: 41, title: 'Bookkeeper', titleAr: 'مسك الدفاتر', departmentId: 3 },

  // Marketing & Sales Department (ID: 4)
  {
    id: 42,
    title: 'Chief Marketing Officer',
    titleAr: 'المدير التنفيذي للتسويق',
    departmentId: 4,
  },
  {
    id: 43,
    title: 'Marketing Director',
    titleAr: 'مدير التسويق',
    departmentId: 4,
  },
  {
    id: 44,
    title: 'Marketing Manager',
    titleAr: 'مدير التسويق',
    departmentId: 4,
  },
  {
    id: 45,
    title: 'Digital Marketing Manager',
    titleAr: 'مدير التسويق الرقمي',
    departmentId: 4,
  },
  {
    id: 46,
    title: 'Digital Marketing Specialist',
    titleAr: 'أخصائي التسويق الرقمي',
    departmentId: 4,
  },
  {
    id: 47,
    title: 'Social Media Manager',
    titleAr: 'مدير وسائل التواصل الاجتماعي',
    departmentId: 4,
  },
  {
    id: 48,
    title: 'Content Marketing Specialist',
    titleAr: 'أخصائي تسويق المحتوى',
    departmentId: 4,
  },
  {
    id: 49,
    title: 'SEO Specialist',
    titleAr: 'أخصائي تحسين محركات البحث',
    departmentId: 4,
  },
  {
    id: 50,
    title: 'PPC Specialist',
    titleAr: 'أخصائي الإعلانات المدفوعة',
    departmentId: 4,
  },
  {
    id: 51,
    title: 'Sales Director',
    titleAr: 'مدير المبيعات',
    departmentId: 4,
  },
  { id: 52, title: 'Sales Manager', titleAr: 'مدير المبيعات', departmentId: 4 },
  {
    id: 53,
    title: 'Senior Sales Representative',
    titleAr: 'مندوب مبيعات أول',
    departmentId: 4,
  },
  {
    id: 54,
    title: 'Sales Representative',
    titleAr: 'مندوب مبيعات',
    departmentId: 4,
  },
  {
    id: 55,
    title: 'Business Development Manager',
    titleAr: 'مدير تطوير الأعمال',
    departmentId: 4,
  },
  {
    id: 56,
    title: 'Brand Manager',
    titleAr: 'مدير العلامة التجارية',
    departmentId: 4,
  },
  {
    id: 57,
    title: 'Product Marketing Manager',
    titleAr: 'مدير تسويق المنتجات',
    departmentId: 4,
  },

  // Operations & Logistics Department (ID: 5)
  {
    id: 58,
    title: 'Chief Operations Officer',
    titleAr: 'المدير التنفيذي للعمليات',
    departmentId: 5,
  },
  {
    id: 59,
    title: 'Operations Director',
    titleAr: 'مدير العمليات',
    departmentId: 5,
  },
  {
    id: 60,
    title: 'Operations Manager',
    titleAr: 'مدير العمليات',
    departmentId: 5,
  },
  {
    id: 61,
    title: 'Operations Coordinator',
    titleAr: 'منسق العمليات',
    departmentId: 5,
  },
  {
    id: 62,
    title: 'Logistics Manager',
    titleAr: 'مدير اللوجستيات',
    departmentId: 5,
  },
  {
    id: 63,
    title: 'Supply Chain Manager',
    titleAr: 'مدير سلسلة التوريد',
    departmentId: 5,
  },
  {
    id: 64,
    title: 'Warehouse Manager',
    titleAr: 'مدير المستودع',
    departmentId: 5,
  },
  {
    id: 65,
    title: 'Inventory Manager',
    titleAr: 'مدير المخزون',
    departmentId: 5,
  },
  {
    id: 66,
    title: 'Inventory Specialist',
    titleAr: 'أخصائي المخزون',
    departmentId: 5,
  },
  {
    id: 67,
    title: 'Procurement Manager',
    titleAr: 'مدير المشتريات',
    departmentId: 5,
  },
  {
    id: 68,
    title: 'Procurement Officer',
    titleAr: 'موظف المشتريات',
    departmentId: 5,
  },
  {
    id: 69,
    title: 'Shipping Coordinator',
    titleAr: 'منسق الشحن',
    departmentId: 5,
  },

  // Legal & Compliance Department (ID: 6)
  {
    id: 70,
    title: 'General Counsel',
    titleAr: 'المستشار العام',
    departmentId: 6,
  },
  {
    id: 71,
    title: 'Legal Counsel',
    titleAr: 'المستشار القانوني',
    departmentId: 6,
  },
  {
    id: 72,
    title: 'Senior Legal Advisor',
    titleAr: 'مستشار قانوني أول',
    departmentId: 6,
  },
  { id: 73, title: 'Legal Advisor', titleAr: 'مستشار قانوني', departmentId: 6 },
  {
    id: 74,
    title: 'Compliance Manager',
    titleAr: 'مدير الامتثال',
    departmentId: 6,
  },
  {
    id: 75,
    title: 'Compliance Officer',
    titleAr: 'موظف الامتثال',
    departmentId: 6,
  },
  {
    id: 76,
    title: 'Legal Assistant',
    titleAr: 'مساعد قانوني',
    departmentId: 6,
  },
  {
    id: 77,
    title: 'Contract Manager',
    titleAr: 'مدير العقود',
    departmentId: 6,
  },
  { id: 78, title: 'Paralegal', titleAr: 'مساعد قانوني', departmentId: 6 },

  // Research & Development Department (ID: 7)
  {
    id: 79,
    title: 'R&D Director',
    titleAr: 'مدير البحث والتطوير',
    departmentId: 7,
  },
  {
    id: 80,
    title: 'R&D Manager',
    titleAr: 'مدير البحث والتطوير',
    departmentId: 7,
  },
  {
    id: 81,
    title: 'Senior Research Scientist',
    titleAr: 'عالم أبحاث أول',
    departmentId: 7,
  },
  {
    id: 82,
    title: 'Research Scientist',
    titleAr: 'عالم أبحاث',
    departmentId: 7,
  },
  {
    id: 83,
    title: 'Research Associate',
    titleAr: 'مساعد أبحاث',
    departmentId: 7,
  },
  {
    id: 84,
    title: 'Product Development Manager',
    titleAr: 'مدير تطوير المنتجات',
    departmentId: 7,
  },
  {
    id: 85,
    title: 'Product Development Engineer',
    titleAr: 'مهندس تطوير المنتجات',
    departmentId: 7,
  },
  {
    id: 86,
    title: 'Innovation Manager',
    titleAr: 'مدير الابتكار',
    departmentId: 7,
  },
  {
    id: 87,
    title: 'Innovation Specialist',
    titleAr: 'أخصائي الابتكار',
    departmentId: 7,
  },
  { id: 88, title: 'Technical Writer', titleAr: 'كاتب تقني', departmentId: 7 },
  { id: 89, title: 'Lab Technician', titleAr: 'فني مختبر', departmentId: 7 },

  // Customer Service Department (ID: 8)
  {
    id: 90,
    title: 'Customer Service Director',
    titleAr: 'مدير خدمة العملاء',
    departmentId: 8,
  },
  {
    id: 91,
    title: 'Customer Service Manager',
    titleAr: 'مدير خدمة العملاء',
    departmentId: 8,
  },
  {
    id: 92,
    title: 'Senior Customer Service Representative',
    titleAr: 'ممثل خدمة عملاء أول',
    departmentId: 8,
  },
  {
    id: 93,
    title: 'Customer Service Representative',
    titleAr: 'ممثل خدمة العملاء',
    departmentId: 8,
  },
  {
    id: 94,
    title: 'Call Center Manager',
    titleAr: 'مدير مركز الاتصال',
    departmentId: 8,
  },
  {
    id: 95,
    title: 'Call Center Supervisor',
    titleAr: 'مشرف مركز الاتصال',
    departmentId: 8,
  },
  {
    id: 96,
    title: 'Technical Support Manager',
    titleAr: 'مدير الدعم الفني',
    departmentId: 8,
  },
  {
    id: 97,
    title: 'Technical Support Specialist',
    titleAr: 'أخصائي الدعم الفني',
    departmentId: 8,
  },
  {
    id: 98,
    title: 'Customer Success Manager',
    titleAr: 'مدير نجاح العملاء',
    departmentId: 8,
  },
  {
    id: 99,
    title: 'Customer Experience Specialist',
    titleAr: 'أخصائي تجربة العملاء',
    departmentId: 8,
  },

  // Quality Assurance Department (ID: 9)
  {
    id: 100,
    title: 'QA Director',
    titleAr: 'مدير ضمان الجودة',
    departmentId: 9,
  },
  {
    id: 101,
    title: 'QA Manager',
    titleAr: 'مدير ضمان الجودة',
    departmentId: 9,
  },
  {
    id: 102,
    title: 'Senior QA Engineer',
    titleAr: 'مهندس ضمان جودة ��ول',
    departmentId: 9,
  },
  {
    id: 103,
    title: 'QA Engineer',
    titleAr: 'مهندس ضمان الجودة',
    departmentId: 9,
  },
  {
    id: 104,
    title: 'Quality Control Manager',
    titleAr: 'مدير مراقبة الجودة',
    departmentId: 9,
  },
  {
    id: 105,
    title: 'Quality Control Inspector',
    titleAr: 'مفتش مراقبة الجودة',
    departmentId: 9,
  },
  {
    id: 106,
    title: 'QA Analyst',
    titleAr: 'محلل ضمان الجودة',
    departmentId: 9,
  },
  { id: 107, title: 'Test Engineer', titleAr: 'مهندس اختبار', departmentId: 9 },
  {
    id: 108,
    title: 'Automation Test Engineer',
    titleAr: 'مهندس اختبار آلي',
    departmentId: 9,
  },

  // Administration Department (ID: 10)
  {
    id: 109,
    title: 'Administrative Director',
    titleAr: 'مدير إداري',
    departmentId: 10,
  },
  {
    id: 110,
    title: 'Administrative Manager',
    titleAr: 'مدير إداري',
    departmentId: 10,
  },
  {
    id: 111,
    title: 'Executive Assistant',
    titleAr: 'مساعد تنفيذي',
    departmentId: 10,
  },
  {
    id: 112,
    title: 'Senior Administrative Assistant',
    titleAr: 'مساعد إداري أول',
    departmentId: 10,
  },
  {
    id: 113,
    title: 'Administrative Assistant',
    titleAr: 'مساعد إداري',
    departmentId: 10,
  },
  {
    id: 114,
    title: 'Office Manager',
    titleAr: 'مدير المكتب',
    departmentId: 10,
  },
  {
    id: 115,
    title: 'Receptionist',
    titleAr: 'موظف الاستقبال',
    departmentId: 10,
  },
  {
    id: 116,
    title: 'Data Entry Specialist',
    titleAr: 'أخصائي إدخال البيانات',
    departmentId: 10,
  },
  {
    id: 117,
    title: 'Records Manager',
    titleAr: 'مدير السجلات',
    departmentId: 10,
  },
  {
    id: 118,
    title: 'Document Controller',
    titleAr: 'مراقب الوثائق',
    departmentId: 10,
  },

  // Security & Safety Department (ID: 11)
  {
    id: 119,
    title: 'Security Director',
    titleAr: 'مدير الأمن',
    departmentId: 11,
  },
  {
    id: 120,
    title: 'Security Manager',
    titleAr: 'مدير الأمن',
    departmentId: 11,
  },
  {
    id: 121,
    title: 'Security Supervisor',
    titleAr: 'مشرف الأمن',
    departmentId: 11,
  },
  { id: 122, title: 'Security Officer', titleAr: 'ضابط أمن', departmentId: 11 },
  { id: 123, title: 'Security Guard', titleAr: 'حارس أمن', departmentId: 11 },
  {
    id: 124,
    title: 'Safety Manager',
    titleAr: 'مدير السلامة',
    departmentId: 11,
  },
  {
    id: 125,
    title: 'Safety Officer',
    titleAr: 'ضابط السلامة',
    departmentId: 11,
  },
  {
    id: 126,
    title: 'Emergency Response Coordinator',
    titleAr: 'منسق الاستجابة للطوارئ',
    departmentId: 11,
  },

  // Training & Development Department (ID: 12)
  {
    id: 127,
    title: 'Training Director',
    titleAr: 'مدير التدريب',
    departmentId: 12,
  },
  {
    id: 128,
    title: 'Training Manager',
    titleAr: 'مدير التدريب',
    departmentId: 12,
  },
  {
    id: 129,
    title: 'Senior Training Specialist',
    titleAr: 'أخصائي تدريب أول',
    departmentId: 12,
  },
  {
    id: 130,
    title: 'Training Specialist',
    titleAr: 'أخصائي التدريب',
    departmentId: 12,
  },
  {
    id: 131,
    title: 'Learning & Development Manager',
    titleAr: 'مدير التعلم والتطوير',
    departmentId: 12,
  },
  {
    id: 132,
    title: 'Instructional Designer',
    titleAr: 'مصمم تعليمي',
    departmentId: 12,
  },
  {
    id: 133,
    title: 'Corporate Trainer',
    titleAr: 'مدرب مؤسسي',
    departmentId: 12,
  },
  {
    id: 134,
    title: 'Training Coordinator',
    titleAr: 'منسق التدريب',
    departmentId: 12,
  },
];

// DataStatistics type definition
export type DataStatistics = {
  totalDepartments: number;
  totalDesignations: number;
  averageDesignationsPerDepartment: number;
  departmentWithMostDesignations: MockDepartment;
  departmentWithLeastDesignations: MockDepartment;
};

// Helper functions for data manipulation
export const getDepartmentById = (id: number): MockDepartment | undefined => {
  return mockDepartments.find(dept => dept.id === id);
};

export const getDesignationsByDepartmentId = (
  departmentId: number
): MockDesignation[] => {
  return mockDesignations.filter(
    designation => designation.departmentId === departmentId
  );
};

export const getDepartmentDesignationCount = (departmentId: number): number => {
  return mockDesignations.filter(
    designation => designation.departmentId === departmentId
  ).length;
};

export const getAllDepartmentsWithCounts = () => {
  return mockDepartments.map(dept => ({
    ...dept,
    designationCount: getDepartmentDesignationCount(dept.id),
  }));
};

// Statistics
export const getDataStatistics = (): DataStatistics => {
  return {
    totalDepartments: mockDepartments.length,
    totalDesignations: mockDesignations.length,
    averageDesignationsPerDepartment: Math.round(
      mockDesignations.length / mockDepartments.length
    ),
    departmentWithMostDesignations: mockDepartments.reduce((prev, current) => {
      const prevCount = getDepartmentDesignationCount(prev.id);
      const currentCount = getDepartmentDesignationCount(current.id);
      return currentCount > prevCount ? current : prev;
    }),
    departmentWithLeastDesignations: mockDepartments.reduce((prev, current) => {
      const prevCount = getDepartmentDesignationCount(prev.id);
      const currentCount = getDepartmentDesignationCount(current.id);
      return currentCount < prevCount ? current : prev;
    }),
  };
};
