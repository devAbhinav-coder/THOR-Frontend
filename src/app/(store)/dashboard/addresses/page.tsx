'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, MapPin, Home, Briefcase } from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

const addressSchema = z.object({
  name: z.string().min(2, 'Full name is required').max(80, 'Name is too long'),
  phone: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => {
      const raw = val.replace(/\s+/g, '');
      const pn = parsePhoneNumberFromString(raw, 'IN');
      return !!pn && pn.isValid() && pn.country === 'IN';
    }, 'Enter a valid Indian mobile number'),
  label: z.string().default('Home'),
  /** House / flat / building */
  house: z.string().max(120, 'House / flat / building is too long').optional(),
  street: z.string().min(5, 'Street / area is required'),
  /** Nearby landmark, optional */
  landmark: z.string().max(160, 'Landmark is too long').optional(),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  isDefault: z.boolean().default(false),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const { user, setUser } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '', label: 'Home', isDefault: false },
  });

  const onSubmit = async (data: AddressForm) => {
    setIsSaving(true);
    try {
          const normalizedPhone =
        parsePhoneNumberFromString(data.phone.replace(/\s+/g, ''), 'IN')?.number || data.phone;
      const res = await authApi.addAddress({ ...data, phone: normalizedPhone });
      setUser({ ...user!, addresses: res.data.addresses });
      toast.success('Address added');
      setIsAdding(false);
      reset({
        name: user?.name || '',
        phone: user?.phone || '',
        label: 'Home',
        house: '',
        street: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to add address');
    } finally {
      setIsSaving(false);
    }
  };

  const removeAddress = async (addressId: string) => {
    if (!confirm('Remove this address?')) return;
    try {
      const res = await authApi.removeAddress(addressId);
      setUser({ ...user!, addresses: res.data.addresses });
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900 text-lg">My Addresses</h2>
        <Button variant="brand" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Address
        </Button>
      </div>

      {user?.addresses.length === 0 && !isAdding && (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No saved addresses yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {user?.addresses.map((addr) => (
          <div key={addr._id} className={`bg-white rounded-2xl border p-4 relative shadow-sm ${addr.isDefault ? 'border-brand-300' : 'border-gray-100'}`}>
            {addr.isDefault && (
              <span className="absolute top-3 right-3 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Default</span>
            )}
            <p className="font-medium text-gray-900 text-sm mb-1 inline-flex items-center gap-1.5">
              {addr.label.toLowerCase().includes('office') ? <Briefcase className="h-3.5 w-3.5 text-gray-500" /> : <Home className="h-3.5 w-3.5 text-gray-500" />}
              {addr.label}
            </p>
            <p className="text-sm text-gray-700">{addr.name} · {addr.phone}</p>
            {addr.house && <p className="text-sm text-gray-600">{addr.house}</p>}
            <p className="text-sm text-gray-600">{addr.street}</p>
            {addr.landmark && <p className="text-sm text-gray-500">Landmark: {addr.landmark}</p>}
            <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
            <p className="text-sm text-gray-500">{addr.country}</p>
            <button
              onClick={() => removeAddress(addr._id!)}
              className="mt-3 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Address</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                {...register('name')}
                label="Full Name"
                placeholder="e.g. Rani Sharma"
                error={errors.name?.message}
              />
              <Input
                {...register('phone')}
                label="Mobile Number"
                placeholder="e.g. 9876543210"
                error={errors.phone?.message}
                inputMode="tel"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                {...register('label')}
                label="Label"
                placeholder="Home / Office"
                error={errors.label?.message}
              />
              <Input
                {...register('house')}
                label="House / Flat / Building"
                placeholder="e.g. B-203, Tower 4"
                error={errors.house?.message}
              />
              <Input
                {...register('landmark')}
                label="Landmark (optional)"
                placeholder="e.g. Near City Mall"
                error={errors.landmark?.message}
              />
            </div>
            <Input
              {...register('street')}
              label="Street & Area"
              placeholder="Street name, locality / sector"
              error={errors.street?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input {...register('city')} label="City" error={errors.city?.message} />
              <Input {...register('state')} label="State" error={errors.state?.message} />
            </div>
            <Input {...register('pincode')} label="Pincode" maxLength={6} error={errors.pincode?.message} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isDefault')} className="rounded text-brand-600" />
              <span className="text-sm text-gray-700">Set as default address</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" variant="brand" loading={isSaving} className="w-full sm:w-auto">Save Address</Button>
              <Button type="button" variant="outline" onClick={() => { setIsAdding(false); reset(); }} className="w-full sm:w-auto">Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
