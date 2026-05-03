export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const POPULAR_CURRENCIES: Currency[] = [
  { code: 'NGN', name: 'Nigerian Naira',     symbol: '₦',   flag: '🇳🇬' },
  { code: 'USD', name: 'US Dollar',          symbol: '$',   flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',               symbol: '€',   flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',      symbol: '£',   flag: '🇬🇧' },
  { code: 'GHS', name: 'Ghanaian Cedi',      symbol: '₵',   flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling',    symbol: 'KSh', flag: '🇰🇪' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R',   flag: '🇿🇦' },
  { code: 'EGP', name: 'Egyptian Pound',     symbol: 'E£',  flag: '🇪🇬' },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$',  flag: '🇦🇺' },
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹',   flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥',   flag: '🇯🇵' },
];

export const DEFAULT_BASE_CURRENCY = 'NGN';

export function getCurrencySymbol(code: string): string {
  return POPULAR_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
