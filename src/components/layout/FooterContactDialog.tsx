"use client";

import { useEffect, useRef } from "react";
import { Mail, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { footerContactIcon } from "@/lib/footerStyles";

type Props = {
  open: boolean;
  onClose: () => void;
  address: string;
  phone: string;
  email: string;
  whatsappHref?: string;
};

export default function FooterContactDialog({
  open,
  onClose,
  address,
  phone,
  email,
  whatsappHref,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    const timer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const telHref = `tel:${phone.replace(/\s+/g, "")}`;

  return (
    <div
      className='fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4'
      role='presentation'
    >
      <button
        type='button'
        className='absolute inset-0 bg-navy-950/70 backdrop-blur-[3px]'
        aria-label='Close contact dialog'
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='footer-contact-title'
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-md outline-none",
          "rounded-t-2xl border border-navy-700/80 bg-navy-950 shadow-2xl",
          "animate-in slide-in-from-bottom-4 duration-300 sm:rounded-2xl sm:slide-in-from-bottom-0 sm:zoom-in-95",
        )}
      >
        <div className='flex items-center justify-between border-b border-navy-800 px-5 py-4'>
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-200/80'>
              Concierge
            </p>
            <h2
              id='footer-contact-title'
              className='mt-1 font-serif text-lg font-medium text-white'
            >
              Contact us
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-navy-700 text-white/70 transition-colors hover:bg-navy-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35'
            aria-label='Close'
          >
            <X className='h-4 w-4' strokeWidth={1.75} />
          </button>
        </div>

        <ul className='space-y-4 px-5 py-5'>
          <li className='flex items-start gap-3'>
            <span className={footerContactIcon} aria-hidden='true'>
              <MapPin className='h-4 w-4' strokeWidth={1.75} />
            </span>
            <div className='min-w-0 pt-1'>
              <p className='text-[10px] font-medium uppercase tracking-[0.18em] text-white/45'>
                Visit
              </p>
              <p className='mt-1 text-sm leading-relaxed text-white/75'>
                {address}
              </p>
            </div>
          </li>
          <li className='flex items-start gap-3'>
            <span className={footerContactIcon} aria-hidden='true'>
              <Phone className='h-4 w-4' strokeWidth={1.75} />
            </span>
            <div className='min-w-0 pt-1'>
              <p className='text-[10px] font-medium uppercase tracking-[0.18em] text-white/45'>
                Call
              </p>
              <a
                href={telHref}
                className='mt-1 inline-block text-sm text-white/75 transition-colors hover:text-white'
              >
                {phone}
              </a>
            </div>
          </li>
          {whatsappHref ?
            <li className='flex items-start gap-3'>
              <span className={footerContactIcon} aria-hidden='true'>
                <MessageCircle className='h-4 w-4' strokeWidth={1.75} />
              </span>
              <div className='min-w-0 pt-1'>
                <p className='text-[10px] font-medium uppercase tracking-[0.18em] text-white/45'>
                  WhatsApp
                </p>
                <a
                  href={whatsappHref}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-1 inline-block text-sm text-white/75 transition-colors hover:text-white'
                >
                  Chat on WhatsApp · {phone}
                </a>
              </div>
            </li>
          : null}
          <li className='flex items-start gap-3'>
            <span className={footerContactIcon} aria-hidden='true'>
              <Mail className='h-4 w-4' strokeWidth={1.75} />
            </span>
            <div className='min-w-0 pt-1'>
              <p className='text-[10px] font-medium uppercase tracking-[0.18em] text-white/45'>
                Email
              </p>
              <a
                href={`mailto:${email}`}
                className='mt-1 inline-block break-all text-sm text-white/75 transition-colors hover:text-white'
              >
                {email}
              </a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
