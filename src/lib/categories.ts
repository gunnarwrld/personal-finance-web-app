import type { TransactionCategory } from '@/types';
import {
  Utensils,
  Car,
  ShoppingBag,
  FileText,
  Film,
  Heart,
  BookOpen,
  DollarSign,
  Briefcase,
  TrendingUp,
  Package,
  type LucideIcon,
} from 'lucide-react';

/**
 * Category configuration with colors and icon components
 */
export const CATEGORIES: Record<TransactionCategory, { color: string; icon: LucideIcon }> = {
  'Food & Dining': { color: '#EF4444', icon: Utensils },
  'Transportation': { color: '#3B82F6', icon: Car },
  'Shopping': { color: '#8B5CF6', icon: ShoppingBag },
  'Bills & Utilities': { color: '#F59E0B', icon: FileText },
  'Entertainment': { color: '#EC4899', icon: Film },
  'Health & Fitness': { color: '#10B981', icon: Heart },
  'Education': { color: '#6366F1', icon: BookOpen },
  'Salary': { color: '#10B981', icon: DollarSign },
  'Freelance': { color: '#8B5CF6', icon: Briefcase },
  'Investment': { color: '#3B82F6', icon: TrendingUp },
  'Other': { color: '#6B7280', icon: Package },
};

/**
 * Get category color
 */
export function getCategoryColor(category: TransactionCategory): string {
  return CATEGORIES[category]?.color || '#6B7280';
}

/**
 * Get category icon component
 */
export function getCategoryIcon(category: TransactionCategory): LucideIcon {
  return CATEGORIES[category]?.icon || Package;
}

/**
 * Get all category names
 */
export function getCategoryNames(): TransactionCategory[] {
  return Object.keys(CATEGORIES) as TransactionCategory[];
}

/**
 * Get income categories
 */
export function getIncomeCategories(): TransactionCategory[] {
  return ['Salary', 'Freelance', 'Investment', 'Other'];
}

/**
 * Get expense categories
 */
export function getExpenseCategories(): TransactionCategory[] {
  return [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Bills & Utilities',
    'Entertainment',
    'Health & Fitness',
    'Education',
    'Other',
  ];
}
