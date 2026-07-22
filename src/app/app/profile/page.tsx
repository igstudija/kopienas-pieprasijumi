"use client";

import { ProfileForm } from "@/components/profile-form";
import { useLanguage } from "@/components/language-provider";

export default function ProfilePage() {
  const { messages } = useLanguage();
  return <main className="app-main"><p className="app-page-intro">{messages.profileIntro}</p><ProfileForm /></main>;
}
