import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizeIndianMobileDigits(val: string): string {
  let d = val.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

/** E.164 when valid IN mobile, otherwise the trimmed input. */
export function toE164IndianMobile(phone: string): string {
  const raw = phone.replace(/\s+/g, "");
  return parsePhoneNumberFromString(raw, "IN")?.number || raw;
}

export const addressSchema = z.object({
  name: z.string().min(2, "Full name is required").max(80, "Name is too long"),
  phone: z
    .string()
    .min(1, "Mobile number is required")
    .refine(
      (val) => normalizeIndianMobileDigits(val).length === 10,
      "Enter exactly 10 digits",
    )
    .refine((val) => {
      const raw = normalizeIndianMobileDigits(val);
      const pn = parsePhoneNumberFromString(raw, "IN");
      return !!pn && pn.isValid() && pn.country === "IN";
    }, "Enter a valid Indian mobile number"),
  house: z.string().max(120, "House / flat / building is too long").optional(),
  street: z.string().min(5, "Street / area is required"),
  landmark: z.string().max(160, "Landmark is too long").optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(1, "Please select state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode"),
  country: z.string().default("India"),
});

export type AddressForm = z.infer<typeof addressSchema>;

export const MONGO_OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/;

export function normalizeCheckoutMongoId(value: unknown): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return MONGO_OBJECT_ID_HEX.test(t) ? t : null;
  }
  if (
    value &&
    typeof value === "object" &&
    "$oid" in value &&
    typeof (value as { $oid: unknown }).$oid === "string"
  ) {
    const s = (value as { $oid: string }).$oid.trim();
    return MONGO_OBJECT_ID_HEX.test(s) ? s : null;
  }
  return null;
}

export const SHIPPING_THRESHOLD = 1099;
export const SHIPPING_CHARGE = 99;
export const COD_HANDLING_FEE = 99;
export const TAX_RATE = 0;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
];

export type ReviewAddressDisplay = {
  name: string;
  phone: string;
  house?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
};
