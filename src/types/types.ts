export type OnboardingStep = 1 | 2 | 3 | 4;

export interface ProfileData {
  profilePhotoUrl: string | null;
  businessName: string;
  phoneNumber: string;
  shortBio: string;
  email: string;        // ← new: required for backend User creation
  firstName?: string;   // ← new: optional
  lastName?: string;
  password:string// ← new: optional
}

export interface KitchenData {
  kitchenPhotoUrl: string | null;
  menuPhotoUrl: string | null;
  location: string;
  latitude: number | null;      
  longitude: number | null;     
  areasOfService: string;       
  foodSpecialty: string;        
  availability: string;         
  yearsOfExperience: number;    
}

export interface VerificationData {
  idFrontUrl: string | null;
  idBackUrl: string | null;
  businessPermitUrl: string | null;
}

export interface PaymentData {
  method: "mpesa" | "bank";
  mpesaPhone: string;
  mpesaName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface OnboardingData {
  profile: ProfileData;
  kitchen: KitchenData;
  verification: VerificationData;
  payment: PaymentData;
}