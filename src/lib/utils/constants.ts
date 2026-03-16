export const APP_NAME = 'ProfitPulse';

export const EXPENSE_CATEGORIES = [
  { value: 'RENT', label: 'Rent' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const UNITS_OF_MEASUREMENT = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'l', label: 'Litres (l)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box', label: 'Box' },
  { value: 'm', label: 'Metres (m)' },
  { value: 'ft', label: 'Feet (ft)' },
] as const;

export const GST_RATES = [
  { value: 0, label: '0%' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
] as const;

export const STOCK_STATUS = {
  IN_STOCK: { label: 'In Stock', color: 'bg-accent-100 text-accent-700' },
  LOW_STOCK: { label: 'Low Stock', color: 'bg-amber-100 text-amber-700' },
  CRITICAL: { label: 'Critical', color: 'bg-danger-100 text-danger-700' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'bg-danger-100 text-danger-700' },
} as const;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/sales', label: 'Sales', icon: 'shopping-cart' },
  { href: '/stock', label: 'Stock', icon: 'package' },
  { href: '/products', label: 'Menu', icon: 'clipboard' },
  { href: '/settings/profile', label: 'Settings', icon: 'settings' },
] as const;
