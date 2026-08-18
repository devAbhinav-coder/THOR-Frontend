'use client';

import { Search, Package } from 'lucide-react';
import { Category, Product, PromoScopeType, SubCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { AdminOfferField, AdminOfferSelect, hideScrollbarCls } from './AdminOfferFormUi';
import { cn } from '@/lib/utils';

interface PromoScopePickerProps {
  scopeType: PromoScopeType;
  onScopeTypeChange: (type: PromoScopeType) => void;
  categories: Category[];
  subcategories: SubCategory[];
  categoryIds: string[];
  subcategoryIds: string[];
  productIds: string[];
  onToggleCategory: (id: string) => void;
  onToggleSubcategory: (id: string) => void;
  onToggleProduct: (id: string) => void;
  productQuery: string;
  onProductQueryChange: (q: string) => void;
  productHits: Product[];
  selectedProducts?: Product[];
  onAddProduct?: (product: Product) => void;
  onRemoveProduct?: (id: string) => void;
  previewCount?: number | null;
  onPreview?: () => void;
  allLabel?: string;
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 text-sm rounded-lg px-2 py-1.5 cursor-pointer transition-colors',
        checked ? 'bg-brand-50/70 text-gray-900' : 'text-gray-700 hover:bg-gray-50',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500/30"
      />
      <span className="truncate">{label}</span>
    </label>
  );
}

export default function PromoScopePicker({
  scopeType,
  onScopeTypeChange,
  categories,
  subcategories,
  categoryIds,
  subcategoryIds,
  productIds,
  onToggleCategory,
  onToggleSubcategory,
  onToggleProduct,
  productQuery,
  onProductQueryChange,
  productHits,
  selectedProducts = [],
  onAddProduct,
  onRemoveProduct,
  previewCount,
  onPreview,
  allLabel = 'Entire catalog',
}: PromoScopePickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <AdminOfferField label="Scope">
          <AdminOfferSelect
            value={scopeType}
            onChange={(e) => onScopeTypeChange(e.target.value as PromoScopeType)}
          >
            <option value="all">{allLabel}</option>
            <option value="categories">Categories</option>
            <option value="subcategories">Subcategories</option>
            <option value="products">Specific products</option>
          </AdminOfferSelect>
        </AdminOfferField>
        {onPreview ? (
          <button
            type="button"
            onClick={onPreview}
            className="shrink-0 mt-5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100/80 px-3 py-1.5 rounded-lg border border-brand-200/60 transition-colors"
          >
            {previewCount != null ? `${previewCount} products` : 'Preview count'}
          </button>
        ) : null}
      </div>

      {scopeType === 'categories' ? (
        <div className={cn('max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-2 space-y-0.5', hideScrollbarCls)}>
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-3 text-center">No categories found</p>
          ) : (
            categories.map((c) => (
              <CheckboxRow
                key={c._id}
                checked={categoryIds.includes(c._id)}
                onChange={() => onToggleCategory(c._id)}
                label={c.name}
              />
            ))
          )}
        </div>
      ) : null}

      {scopeType === 'subcategories' ? (
        <div className={cn('max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-2 space-y-0.5', hideScrollbarCls)}>
          {subcategories.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-3 text-center">No subcategories found</p>
          ) : (
            subcategories.map((s) => (
              <CheckboxRow
                key={s._id}
                checked={subcategoryIds.includes(s._id)}
                onChange={() => onToggleSubcategory(s._id)}
                label={s.name}
              />
            ))
          )}
        </div>
      ) : null}

      {scopeType === 'products' ? (
        <div className="space-y-2.5">
          {productIds.length > 0 ? (
            <div className="rounded-xl bg-brand-50/50 border border-brand-100 px-3 py-2.5 space-y-1">
              <p className="text-xs font-semibold text-brand-800 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Selected ({productIds.length})
              </p>
              <div className={cn('max-h-28 overflow-y-auto space-y-0.5', hideScrollbarCls)}>
                {selectedProducts.map((p) => (
                  <CheckboxRow
                    key={p._id}
                    checked={productIds.includes(p._id)}
                    onChange={() => {
                      onToggleProduct(p._id);
                      onRemoveProduct?.(p._id);
                    }}
                    label={p.name}
                  />
                ))}
                {selectedProducts.length < productIds.length ? (
                  <p className="text-xs text-gray-400 pl-2 py-1">
                    {productIds.length - selectedProducts.length} product(s) loading…
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="relative">
            <Search className="absolute left-3 top-[2.15rem] h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              label="Search products"
              value={productQuery}
              onChange={(e) => onProductQueryChange(e.target.value)}
              placeholder="Type at least 2 characters…"
              className="pl-9"
            />
          </div>

          <div className={cn('max-h-36 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-2 space-y-0.5', hideScrollbarCls)}>
            {productQuery.trim().length < 2 ? (
              <p className="text-xs text-gray-400 px-2 py-3 text-center">Start typing to search products</p>
            ) : productHits.filter((p) => !productIds.includes(p._id)).length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-3 text-center">No matching products</p>
            ) : (
              productHits
                .filter((p) => !productIds.includes(p._id))
                .map((p) => (
                  <CheckboxRow
                    key={p._id}
                    checked={false}
                    onChange={() => {
                      onToggleProduct(p._id);
                      onAddProduct?.(p);
                    }}
                    label={p.name}
                  />
                ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
