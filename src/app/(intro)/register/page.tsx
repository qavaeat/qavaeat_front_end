"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingStepper } from "@/components/chef-onboarding/onboardingStepper";
import { Step1Profile } from "@/components/chef-onboarding/Step1Profile";
import { Step2Kitchen } from "@/components/chef-onboarding/Step2Kitchen";
import { Step3Verifications } from "@/components/chef-onboarding/Step3Verifications";
import { Step4Payments } from "@/components/chef-onboarding/Step4Payments";
import { StepComplete } from "@/components/chef-onboarding/StepComplete";
import { toast } from "sonner";
import { buildBusinessPayload, submitBusiness } from "@/lib/submit-business";
import type {
  OnboardingStep,
  OnboardingData,
  ProfileData,
  KitchenData,
  VerificationData,
  PaymentData,
} from "@/types/types";

const INITIAL_DATA: OnboardingData = {
  profile: {
    profilePhotoUrl: null,
    businessName: "",
    phoneNumber: "",
    shortBio: "",
    email: "",     
    firstName: "",    
    lastName: "",
    password:""
  },
  kitchen: {
    kitchenPhotoUrl: null,
    menuPhotoUrl: null,
    location: "",
    latitude: null,
    longitude: null,
    areasOfService: "",
    foodSpecialty: "",
    availability: "",
    yearsOfExperience: 0,
  },
  verification: {
    idFrontUrl: null,
    idBackUrl: null,
    businessPermitUrl: null,
  },
  payment: {
    method: "mpesa",
    mpesaPhone: "",
    mpesaName: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
  },
};

export default function ChefRegisterPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [maxStep, setMaxStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const goToStep = (next: OnboardingStep) => {
    setStep(next);
    if (next > maxStep) setMaxStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (clicked: OnboardingStep) => {
    if (clicked <= maxStep) {
      setStep(clicked);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProfile = (profile: ProfileData) => {
    setData((d) => ({ ...d, profile }));
    goToStep(2);
  };

  const handleKitchen = (kitchen: KitchenData) => {
    setData((d) => ({ ...d, kitchen }));
    goToStep(3);
  };

  const handleVerification = (verification: VerificationData) => {
    setData((d) => ({ ...d, verification }));
    goToStep(4);
  };

  const handlePayment = async (payment: PaymentData) => {
    const finalData: OnboardingData = { ...data, payment };
    setData(finalData);
    setSubmitting(true);

    try {
      const payload = buildBusinessPayload(finalData);
      await submitBusiness(payload);
      setComplete(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-muted/30">

      <div className="fixed left-0 top-0 bottom-0 w-[22%] pointer-events-none hidden lg:block">
        <Image src="/chef-left.png" alt="" fill className="object-cover object-top opacity-60" sizes="22vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-muted/30" />
      </div>

      <div className="fixed right-0 top-0 bottom-0 w-[22%] pointer-events-none hidden lg:block">
        <Image src="/chef-right.png" alt="" fill className="object-cover object-top opacity-60" sizes="22vw" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-muted/30" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12">

        <div className="mb-8">
          <OnboardingStepper
            currentStep={complete ? 4 : step}
            maxStep={complete ? 4 : maxStep}
            onStepClick={complete ? () => {} : handleStepClick}
          />
        </div>

        <AnimatePresence mode="wait">
          {complete ? (
            <motion.div key="complete" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              <StepComplete chefName={data.profile.businessName || "Chef"} />
            </motion.div>
          ) : step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <Step1Profile data={data.profile} onComplete={handleProfile} />
            </motion.div>
          ) : step === 2 ? (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <Step2Kitchen data={data.kitchen} onComplete={handleKitchen} />
            </motion.div>
          ) : step === 3 ? (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <Step3Verifications data={data.verification} onComplete={handleVerification} />
            </motion.div>
          ) : (
            <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <Step4Payments data={data.payment} onComplete={handlePayment} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-4 bg-background rounded-2xl px-8 py-6 shadow-xl border border-border">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-semibold text-foreground">Submitting your application...</p>
                <p className="text-xs text-muted-foreground">This will only take a moment</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}