'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, CreditCard, Shield, Globe, Bell, FileText, DollarSign, Users } from 'lucide-react'

const faqs = [
  {
    category: 'Getting Started',
    icon: Users,
    color: 'text-blue-600 bg-blue-100',
    questions: [
      {
        question: 'How do I create a sikaremit account?',
        answer: 'Click the "Sign Up" button and follow the registration process. You\'ll need to provide your email, create a password, and verify your identity through our KYC process.'
      },
      {
        question: 'What documents do I need for verification?',
        answer: 'For basic verification, you need a government-issued ID (passport, driver\'s license, or national ID card). Some services may require additional documents like proof of address.'
      },
      {
        question: 'How long does verification take?',
        answer: 'Basic verification typically takes 1-3 business days. Premium services may require additional review time.'
      }
    ]
  },
  {
    category: 'Payments & Transfers',
    icon: DollarSign,
    color: 'text-green-600 bg-green-100',
    questions: [
      {
        question: 'How do I send money to someone?',
        answer: 'Go to the "Send Money" section, enter the recipient\'s details, specify the amount, and choose your payment method. You can send money via email, phone number, or sikaremit username.'
      },
      {
        question: 'What payment methods are supported?',
        answer: 'We support bank transfers, credit/debit cards, mobile money, and cryptocurrency. Available options depend on your location and the recipient\'s location.'
      },
      {
        question: 'Are there fees for sending money?',
        answer: 'Fees vary by payment method and destination. Domestic transfers are typically free or low-cost, while international transfers may have higher fees. Check our pricing page for current rates.'
      },
      {
        question: 'How do I receive money?',
        answer: 'Use the "Receive Money" feature to generate a payment link or QR code. Share this with anyone who wants to send you money. Funds appear in your account instantly.'
      }
    ]
  },
  {
    category: 'Security & Privacy',
    icon: Shield,
    color: 'text-red-600 bg-red-100',
    questions: [
      {
        question: 'How secure is my money?',
        answer: 'We use bank-level encryption, multi-factor authentication, and fraud detection systems. Your funds are protected by FDIC insurance up to $250,000.'
      },
      {
        question: 'What is two-factor authentication?',
        answer: '2FA adds an extra layer of security by requiring a code from your phone in addition to your password. Enable it in your security settings.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your email. For security, this link expires in 24 hours.'
      },
      {
        question: 'What should I do if I suspect fraud?',
        answer: 'Immediately contact our support team and freeze your account. We\'ll investigate and help recover any lost funds.'
      }
    ]
  },
  {
    category: 'Bills & Services',
    icon: FileText,
    color: 'text-purple-600 bg-purple-100',
    questions: [
      {
        question: 'How do I pay bills?',
        answer: 'Navigate to "Pay Bills" and select your bill type (utilities, rent, taxes, etc.). Enter the bill details and make payment securely.'
      },
      {
        question: 'Can I set up automatic bill payments?',
        answer: 'Yes, you can set up recurring payments for regular bills. Go to your payment methods and enable auto-pay for supported billers.'
      },
      {
        question: 'What bills can I pay through sikaremit?',
        answer: 'We support utility bills, rent payments, taxes, loan payments, insurance, and many other recurring expenses.'
      }
    ]
  },
  {
    category: 'International Transfers',
    icon: Globe,
    color: 'text-indigo-600 bg-indigo-100',
    questions: [
      {
        question: 'How do I send money internationally?',
        answer: 'Use our cross-border transfer feature. Enter the recipient\'s details, select their country, and choose the best transfer option for speed and cost.'
      },
      {
        question: 'What countries do you support?',
        answer: 'We support transfers to over 200 countries worldwide. Check our coverage map for specific country availability.'
      },
      {
        question: 'How long do international transfers take?',
        answer: 'Transfer times vary: instant digital transfers (1-5 minutes), bank transfers (1-3 business days), cash pickup (same day in most locations).'
      },
      {
        question: 'What exchange rates do you offer?',
        answer: 'We offer competitive exchange rates with no hidden fees. Rates are updated in real-time and shown before you confirm the transfer.'
      }
    ]
  },
  {
    category: 'Account & Settings',
    icon: Bell,
    color: 'text-orange-600 bg-orange-100',
    questions: [
      {
        question: 'How do I update my profile information?',
        answer: 'Go to your account settings and click on "Profile" to update your personal information, contact details, and preferences.'
      },
      {
        question: 'How do I manage notification preferences?',
        answer: 'In your settings, go to the "Notifications" tab to customize email, SMS, and push notification preferences for different account activities.'
      },
      {
        question: 'How do I add a payment method?',
        answer: 'Navigate to "Payment Methods" in your account and click "Add Payment Method". We support cards, bank accounts, and mobile money.'
      },
      {
        question: 'How do I view my transaction history?',
        answer: 'Your transaction history is available in your account dashboard. You can filter, search, and download statements.'
      }
    ]
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen space-y-6 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-sikaremit-foreground mb-4">Frequently Asked Questions</h1>
          <p className="text-sikaremit-muted text-lg">
            Find answers to common questions about using sikaremit
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${category.color}`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  {category.category}
                  <Badge variant="secondary" className="ml-auto">
                    {category.questions.length} questions
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Common questions about {category.category.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
          <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="mailto:support@sikaremit.com"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Email Support
            </a>
            <a
              href="tel:+1-800-sikaremit"
              className="inline-flex items-center px-4 py-2 border border-input bg-background rounded-md hover:bg-accent"
            >
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
