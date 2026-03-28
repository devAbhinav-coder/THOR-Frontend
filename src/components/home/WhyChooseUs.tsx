import { Truck, ShieldCheck, RotateCcw, Headphones, CreditCard, Award } from 'lucide-react';

const features = [
  { icon: Truck, title: 'Free Shipping', description: 'Free delivery on orders above ₹999 across India' },
  { icon: ShieldCheck, title: 'Authentic Products', description: '100% genuine handcrafted ethnic wear' },
  { icon: RotateCcw, title: 'Easy Returns', description: '7-day hassle-free return and exchange policy' },
  { icon: Headphones, title: '24/7 Support', description: 'Dedicated customer support whenever you need us' },
  { icon: CreditCard, title: 'Secure Payments', description: 'Encrypted payments via Razorpay — safe and fast' },
  { icon: Award, title: 'Premium Quality', description: 'Curated fabrics with strict quality standards' },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-brand-400 font-medium uppercase tracking-widest text-xs mb-3">Why Shop With Us</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            The House of Rani Promise
          </h2>
          <div className="mt-4 mx-auto w-16 h-0.5 bg-brand-600 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 p-6 rounded-2xl bg-navy-800 border border-navy-700 hover:border-brand-700 hover:bg-navy-800/80 transition-all duration-300 group"
            >
              <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-navy-700 border border-navy-600 group-hover:border-brand-600 flex items-center justify-center transition-colors">
                <Icon className="h-6 w-6 text-brand-500 group-hover:text-brand-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
