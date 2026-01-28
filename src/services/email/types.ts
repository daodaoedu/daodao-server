export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface WelcomeEmailData {
  name: string;
}

export interface VerificationEmailData {
  name?: string;
  verifyLink: string;
}

export interface ContactEmailData {
  name: string;
  message: string;
  userInfo?: string | string[];
  activityTitle?: string;
  url?: string;
  userId?: string;
  roleList?: string[];
  photoUrl?: string;
}

export interface MarathonEmailData {
  name: string;
  marathonTitle: string;
  marathonDate?: string;
  marathonDescription?: string;
}

export interface PasswordResetEmailData {
  name?: string;
  resetLink: string;
}

export interface CustomEmailData {
  subject: string;
  content: string;
}