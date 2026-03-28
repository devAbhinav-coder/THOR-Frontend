import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export default function LegalPageLayout({ title, description, lastUpdated, children }: Props) {
  return (
    <div className="bg-[#faf9f7] min-h-[60vh]">
      <div className="border-b border-gray-200 bg-gradient-to-b from-white to-[#faf9f7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-brand-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">{title}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl">
            {description}
          </p>
          <p className="mt-4 text-xs text-gray-400 uppercase tracking-wider font-medium">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 max-w-none text-[15px] sm:text-base leading-relaxed text-gray-600
          [&_h2]:font-serif [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy-900 [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:first:mt-0
          [&_p]:mb-4 [&_p]:last:mb-0
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4 [&_li]:pl-0.5
          [&_strong]:font-semibold [&_strong]:text-gray-900
          [&_a]:text-brand-600 [&_a]:underline-offset-2 hover:[&_a]:underline"
        >
          {children}
        </div>
      </article>
    </div>
  );
}
