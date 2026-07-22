"use client";

import { RequestForm } from "@/components/request-form";
import { useLanguage } from "@/components/language-provider";

export default function NewRequestPage() { const { messages } = useLanguage(); return <main className="app-main"><p className="app-page-intro">{messages.newIntro}</p><RequestForm /></main>; }
