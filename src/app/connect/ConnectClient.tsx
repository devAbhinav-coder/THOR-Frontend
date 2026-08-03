'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Facebook, Youtube, Globe, ArrowRight, MessageCircle, Mail } from 'lucide-react';
import { gsap } from 'gsap';

const links = [
  {
    name: 'Instagram',
    icon: Instagram,
    url: 'https://www.instagram.com/thehouseofrani_',
    color: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    url: 'https://www.facebook.com/people/HouseofRani/61580570102572/',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    name: 'YouTube',
    icon: Youtube,
    url: 'https://youtube.com/@TheHouseOfRani',
    color: 'from-red-500 to-rose-600',
  },
];

const supportLinks = [
  {
    name: 'WhatsApp Support',
    icon: MessageCircle,
    url: 'https://wa.me/918340311033',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Email Support',
    icon: Mail,
    url: 'mailto:support@thehouseofrani.com',
    color: 'from-gray-600 to-slate-700',
  },
];

export default function ConnectClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Main staggered entrance
      gsap.fromTo('.stagger-item', 
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.1,
        }
      );
      
      // Floating logo animation
      gsap.to('.floating-logo', {
        y: -10,
        yoyo: true,
        repeat: -1,
        duration: 3,
        ease: 'sine.inOut',
        delay: 1,
      });

      // Background mesh pulsing
      gsap.fromTo('.stagger-bg', 
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 2,
          ease: 'power2.out',
        }
      );
      gsap.to('.orb-1', {
        x: 'random(-50, 50)',
        y: 'random(-50, 50)',
        repeat: -1,
        yoyo: true,
        duration: 8,
        ease: 'sine.inOut',
      });
      gsap.to('.orb-2', {
        x: 'random(-60, 60)',
        y: 'random(-60, 60)',
        repeat: -1,
        yoyo: true,
        duration: 10,
        ease: 'sine.inOut',
      });
      
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#060c18] flex flex-col items-center justify-center overflow-hidden py-12 px-5 sm:px-6">
      {/* Dynamic Background Mesh Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="stagger-bg orb-1 absolute top-[-10%] left-[-10%] w-[80vw] sm:w-[60vw] h-[80vw] sm:h-[60vw] rounded-full bg-brand-800/20 blur-[120px] mix-blend-screen" />
        <div className="stagger-bg orb-2 absolute bottom-[-10%] right-[-10%] w-[90vw] sm:w-[70vw] h-[90vw] sm:h-[70vw] rounded-full bg-amber-600/15 blur-[130px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-auto flex flex-col items-center">
        {/* Logo */}
        <div className="stagger-item floating-logo mb-6 md:mb-8 relative rounded-[2rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl flex items-center justify-center py-5 px-8 shadow-[0_8px_40px_rgba(197,160,89,0.12)]">
          <Image
            src="/logo.png"
            alt="The House of Rani"
            width={180}
            height={60}
            priority
            className="w-full max-w-[160px] md:max-w-[170px] h-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Header */}
        <h1 className="stagger-item text-3xl md:text-[2rem] font-serif font-bold text-white text-center mb-1.5 tracking-wide drop-shadow-sm">
          THE HOUSE OF RANI
        </h1>
        <p className="stagger-item text-brand-300/90 text-sm md:text-[15px] mb-10 text-center font-medium tracking-[0.2em] uppercase">
          Handcrafted Luxury
        </p>

        {/* Primary CTA */}
        <div className="w-full space-y-5">
          <Link
            href="/"
            className="stagger-item group relative flex items-center justify-between w-full p-4 md:p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/40 backdrop-blur-xl transition-all duration-300 overflow-hidden shadow-xl shadow-black/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600/0 via-brand-600/10 to-brand-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-600/20 border border-brand-500/20 flex items-center justify-center text-brand-300 group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(197,160,89,0.4)] transition-all duration-300">
                <Globe className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white tracking-wider text-[15px]">VISIT OUR STORE</span>
                <span className="text-xs text-white/50 font-medium">Explore our collection</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-brand-300 transition-transform duration-300 group-hover:translate-x-1.5 relative z-10" />
          </Link>

          {/* Social Connect Divider */}
          <div className="stagger-item w-full flex items-center justify-center py-3">
            <span className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <span className="px-4 text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] whitespace-nowrap">Connect With Us</span>
            <span className="h-[1px] w-full bg-gradient-to-r from-white/15 via-white/15 to-transparent" />
          </div>

          {/* Social Links List */}
          <div className="grid grid-cols-1 gap-3.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stagger-item group flex items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 backdrop-blur-md transition-all duration-300 shadow-sm"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="ml-4 font-semibold text-white/90 group-hover:text-white transition-colors tracking-wide text-[15px]">
                    {link.name}
                  </span>
                  <div className="ml-auto opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-white/40">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Support Divider */}
          <div className="stagger-item w-full flex items-center justify-center py-3 pt-5">
            <span className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <span className="px-4 text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] whitespace-nowrap">Need Help?</span>
            <span className="h-[1px] w-full bg-gradient-to-r from-white/15 via-white/15 to-transparent" />
          </div>

          {/* Support Links Grid */}
          <div className="grid grid-cols-2 gap-3 pb-8">
            {supportLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stagger-item group flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 backdrop-blur-md transition-all duration-300 shadow-sm"
                >
                  <div className={`w-10 h-10 mb-3 rounded-full bg-gradient-to-br ${link.color} flex items-center justify-center text-white shadow-md group-hover:-translate-y-1 transition-transform duration-300`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="font-semibold text-white/80 group-hover:text-white text-[13px] text-center">
                    {link.name.split(' ')[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
