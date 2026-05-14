export type UserRole = 'Admin' | 'HR_Manager' | 'LD_Admin';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  email: string;
}

export interface Employee {
  id: string; // e.g. "M 057"
  slNo: number;
  unit: string;
  name: string;
  designation: string;
  department: string;
  dateOfJoining: string; // YYYY-MM-DD
  email?: string;
  employeeType?: 'Staff' | 'Shopfloor';
  status?: 'Active' | 'Resigned';
}

export type AttendanceStatus = 'Planned' | 'Attended' | 'Dropped';

export interface AttendeeRecord {
  employeeId: string;
  status: AttendanceStatus;
}

export interface TrainingRecord {
  id: string; // UUID
  code?: string;
  type?: string; // Classroom, Soft Skills, Compliance, etc.
  trainer?: string;
  title: string;
  date: string;
  duration: string; // e.g. "2 Hours"
  targetDepartments: string[];
  attendees: AttendeeRecord[];
  
  // Computed fields (can be re-calculated or stored)
  plannedAttendees: number;
  conducted: boolean;
  canceled: boolean;
  notes?: string;
}

export interface DepartmentStats {
  department: string;
  planned: number;
  attended: number;
  dropped: number;
  completionPercentage: number;
}
