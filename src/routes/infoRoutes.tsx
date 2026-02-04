import React from 'react';
import { Route } from 'react-router-dom';

// Info Pages (Lazy)
const ServicesPage = React.lazy(() => import('@/pages/ServicesPage'));
const HowItWorksPage = React.lazy(() => import('@/pages/HowItWorksPage'));
const FAQPage = React.lazy(() => import('@/pages/FAQPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
const PricingPage = React.lazy(() => import('@/pages/PricingPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));

/**
 * Info Routes
 * Public informational pages - services, about, FAQ, contact, pricing
 */
export const infoRoutes = [
    <Route key="services" path="/services" element={<ServicesPage />} />,
    <Route key="how" path="/how-it-works" element={<HowItWorksPage />} />,
    <Route key="faq" path="/faq" element={<FAQPage />} />,
    <Route key="contact" path="/contact" element={<ContactPage />} />,
    <Route key="pricing" path="/pricing" element={<PricingPage />} />,
    <Route key="about" path="/about" element={<AboutPage />} />,
];
