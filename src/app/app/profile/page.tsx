"use client";

import { ProfileForm } from "@/components/profile-form";
import { useLanguage } from "@/components/language-provider";

export default function ProfilePage() {
  const { messages } = useLanguage();
  return <main className="app-main"><header className="app-heading"><div><span className="auth-step">{messages.profileEyebrow}</span><h1>{messages.profileTitleFirst}<br />{messages.profileTitleSecond}</h1></div><p>{messages.profileIntro}</p></header><ProfileForm /></main>;
}
