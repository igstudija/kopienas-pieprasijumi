"use client";

import { RequestForm } from "@/components/request-form";
import { useLanguage } from "@/components/language-provider";

export default function NewRequestPage() { const { messages } = useLanguage(); return <main className="app-main"><header className="app-heading"><div><span className="auth-step">{messages.newEntry}</span><h1>{messages.newTitleFirst}<br />{messages.newTitleSecond}</h1></div><p>{messages.newIntro}</p></header><RequestForm /></main>; }
