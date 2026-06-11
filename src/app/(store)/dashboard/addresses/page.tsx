'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Home, Briefcase, MapPin } from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AccountFormField } from '@/components/dashboard/account/AccountFormField';
import { Address } from '@/types';

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
  house: z.string().max(120, 'House / flat / building is too long').optional(),
  street: z.string().min(5, 'Street / area is required'),
  landmark: z.string().max(160, 'Landmark is too long').optional(),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  isDefault: z.boolean().default(false),
});

type AddressForm = z.infer<typeof addressSchema>;

function formatAddressLine(addr: Address): string {
  const parts = [
    addr.house,
    addr.street,
    addr.landmark ? `Near ${addr.landmark}` : null,
    `${addr.city}, ${addr.state} — ${addr.pincode}`,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function AddressesPage() {
  const { user, setUser } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      label: 'Home',
      isDefault: false,
    },
  });

  const openAddForm = () => {
    setEditingId(null);
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
    setIsAdding(true);
  };

  const openEditForm = (addr: Address) => {
    setEditingId(addr._id || null);
    reset({
      name: addr.name,
      phone: addr.phone.replace(/^\+91/, ''),
      label: addr.label,
      house: addr.house || '',
      street: addr.street,
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setIsAdding(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: AddressForm) => {
    setIsSaving(true);
    try {
      const normalizedPhone =
        parsePhoneNumberFromString(data.phone.replace(/\s+/g, ''), 'IN')?.number || data.phone;

      if (editingId) {
        await authApi.removeAddress(editingId);
      }

      const res = await authApi.addAddress({ ...data, phone: normalizedPhone });
      setUser({ ...user!, addresses: res.data.addresses });
      toast.success(editingId ? 'Address updated' : 'Address saved');
      cancelForm();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to save address');
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
      if (editingId === addressId) cancelForm();
    } catch {
      toast.error('Failed to remove address');
    }
  };

  return (
    <div className="flex flex-col gap-account-stack-lg pb-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-account-primary">Shipping Addresses</h1>
          <p className="text-sm text-account-on-surface-variant mt-2 max-w-xl">
            Manage your preferred delivery destinations for your bespoke collections and seasonal pieces.
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 bg-account-primary text-white px-5 py-3 text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Address
          </button>
        )}
      </header>

      {user?.addresses.length === 0 && !isAdding && (
        <div className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-12 text-center">
          <MapPin className="h-10 w-10 text-account-outline-variant mx-auto mb-3" />
          <p className="text-account-on-surface-variant">No saved addresses yet.</p>
        </div>
      )}

      {!!user?.addresses.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-account-gutter">
          {user.addresses.map((addr) => {
            const isOffice = addr.label.toLowerCase().includes('office');
            return (
              <article
                key={addr._id}
                className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 shadow-account-paper relative"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    {isOffice ? (
                      <Briefcase className="h-4 w-4 text-account-secondary shrink-0" />
                    ) : (
                      <Home className="h-4 w-4 text-account-secondary shrink-0" />
                    )}
                    <h3 className="font-serif text-lg text-account-primary truncate">{addr.name}</h3>
                  </div>
                  {addr.isDefault && (
                    <span className="shrink-0 bg-account-secondary-container text-account-on-secondary-container px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-account-on-surface-variant leading-relaxed mb-3">
                  {formatAddressLine(addr)}
                </p>
                <p className="text-sm text-account-primary font-medium mb-6">{addr.phone}</p>
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => openEditForm(addr)}
                    className="text-[11px] font-semibold uppercase tracking-widest text-account-secondary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAddress(addr._id!)}
                    className="text-[11px] font-semibold uppercase tracking-widest text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isAdding && (
        <section className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8">
          <div className="mb-8">
            <h2 className="font-serif text-2xl text-account-primary">
              {editingId ? 'Edit Destination' : 'New Destination'}
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mt-1">
              Specify atelier delivery coordinates
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              <AccountFormField label="Full Name" error={errors.name?.message} {...register('name')} />
              <AccountFormField
                label="Mobile Number"
                inputMode="tel"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <AccountFormField
                label="Apt / House / Villa No."
                error={errors.house?.message}
                {...register('house')}
              />
              <AccountFormField
                label="Landmark (optional)"
                error={errors.landmark?.message}
                {...register('landmark')}
              />
            </div>
            <AccountFormField
              label="Street & Locality"
              error={errors.street?.message}
              {...register('street')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              <AccountFormField label="City" error={errors.city?.message} {...register('city')} />
              <AccountFormField label="State" error={errors.state?.message} {...register('state')} />
              <AccountFormField
                label="Pincode"
                maxLength={6}
                error={errors.pincode?.message}
                className="sm:col-span-2 lg:col-span-1"
                {...register('pincode')}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isDefault')}
                className="h-4 w-4 rounded border-account-outline-variant text-account-primary focus:ring-account-secondary"
              />
              <span className="text-sm text-account-on-surface-variant">Set as default shipping address</span>
            </label>

            <input type="hidden" {...register('label')} />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-account-primary text-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="border border-account-outline-variant text-account-primary px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-account-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
