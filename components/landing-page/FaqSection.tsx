'use client';

import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0); // First item open by default

  const handleToggle = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs: FaqItem[] = [
    {
      question: "Is it really like talking to a real interviewer?",
      answer: "Yes. Clutchly uses advanced low-latency voice synthesis and LLMs trained on thousands of technical and behavioral interview rubrics to simulate the nuance, follow-up questions, and pressure of a live conversation."
    },
    {
      question: "How does Clutchly personalize interviews?",
      answer: "We analyze your target job description and your specific resume to generate custom question sets. The AI adapts its follow-up questions based on the depth of your initial answers, just like a human would."
    },
    {
      question: "What kind of feedback do I receive?",
      answer: "You get a detailed breakdown of your technical accuracy, communication clarity, and sentiment analysis. We provide actionable suggestions on how to rephrase weak points and highlight missing keywords."
    },
    {
      question: "Is my data and voice recording private?",
      answer: "Absolutely. We encrypt all voice data and never share your recordings with third parties. You have full control over your data and can delete your interview history at any time."
    },
    {
      question: "Does it support coding and technical assessments?",
      answer: "Yes, our technical mode includes a split-screen IDE. The AI interviewer can see your code in real-time, ask you to explain your logic, and suggest edge cases you might have missed."
    },
    {
      question: "Which languages are supported?",
      answer: "Currently, we fully support English, Spanish, French, and German. We are rolling out support for Japanese and Mandarin in the coming months to help global candidates."
    },
    {
      question: "Can I practice for non-tech roles?",
      answer: "While we specialize in tech and product roles, Clutchly is highly effective for Sales, Marketing, and Operations interviews. Simply upload your JD and the AI will adapt accordingly."
    },
    {
      question: "Do you offer a free trial?",
      answer: "Yes, your first 20-minute interview session is on us. No credit card required. You'll get a full feedback report to see the value of the platform immediately."
    }
  ];

  return (
    <main className="w-full flex flex-col items-center py-xl px-margin-mobile md:px-margin-desktop bg-surface text-on-surface">
      {/* Header Section */}
      <header className="w-full max-w-[850px] text-center mb-xl">
        <span className="inline-block px-md py-xs bg-primary/10 text-primary font-label-md text-label-md rounded-full mb-sm">
          FAQ
        </span>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight mb-md">
          Frequently asked questions
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Everything you need to know before starting your first AI interview.
        </p>
      </header>

      {/* FAQ Accordion */}
      <section className="w-full max-w-[850px]">
        <div className="flex flex-col">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`border-t border-outline-variant py-md group cursor-pointer ${
                index === faqs.length - 1 ? 'border-b' : ''
              }`}
              onClick={() => handleToggle(index)}
            >
              <div className="flex justify-between items-center gap-md">
                <h3 className="font-headline-sm text-[20px] md:text-headline-sm text-on-surface group-hover:text-primary transition-colors duration-200">
                  {faq.question}
                </h3>
                <span className={`material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-transform duration-300 ${
                  activeFaq === index ? 'rotate-45' : ''
                }`}>
                  add
                </span>
              </div>
              <div className={`accordion-content mt-sm ${
                activeFaq === index ? 'accordion-content-active' : ''
              }`}>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Contact Section */}
      <footer className="w-full max-w-[850px] mt-xl pt-lg border-t border-outline-variant/30 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant mb-xs">
          Still have questions? We'd love to help.
        </p>
        <a className="inline-flex items-center gap-xs font-label-md text-label-md text-primary hover:underline transition-all" href="#">
          Contact Support <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </a>
      </footer>
    </main>
  );
}
