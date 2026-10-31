import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BillReminder, InsertBillReminder, UpdateBillReminder, BillReminderWithStatus } from '@/types';
import { useAuth } from './useAuth';
import { parseLocalDate, toLocalDateString } from '@/lib/utils';

const BILLS_QUERY_KEY = ['bill_reminders'];

export function useBillReminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all bill reminders
  const {
    data: bills,
    isLoading,
    error,
  } = useQuery({
    queryKey: BILLS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bill_reminders')
        .select(`
          *,
          account:accounts(name, type, currency)
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as BillReminder[];
    },
    enabled: !!user,
  });

  // Create bill reminder
  const createBill = useMutation({
    mutationFn: async (input: InsertBillReminder) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bill_reminders')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as BillReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  // Update bill reminder
  const updateBill = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateBillReminder }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bill_reminders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as BillReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  // Mark bill as paid
  const markAsPaid = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bill_reminders')
        .update({
          is_paid: true,
          paid_date: toLocalDateString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as BillReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  // Delete bill reminder
  const deleteBill = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('bill_reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  // Get bills with status (upcoming, overdue, paid)
  const billsWithStatus: BillReminderWithStatus[] = (bills || []).map(bill => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = parseLocalDate(bill.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const days_until_due = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const is_overdue = days_until_due < 0 && !bill.is_paid;
    const is_upcoming = days_until_due >= 0 && days_until_due <= bill.reminder_days_before && !bill.is_paid;

    return {
      ...bill,
      days_until_due,
      is_overdue,
      is_upcoming,
    };
  });

  // Filter unpaid bills
  const unpaidBills = billsWithStatus.filter(b => !b.is_paid);

  // Filter upcoming bills (due within reminder days)
  const upcomingBills = billsWithStatus.filter(b => b.is_upcoming);

  // Filter overdue bills
  const overdueBills = billsWithStatus.filter(b => b.is_overdue);

  return {
    bills: billsWithStatus,
    unpaidBills,
    upcomingBills,
    overdueBills,
    isLoading,
    error,
    createBill: createBill.mutate,
    createBillAsync: createBill.mutateAsync,
    updateBill: updateBill.mutate,
    updateBillAsync: updateBill.mutateAsync,
    markAsPaid: markAsPaid.mutate,
    markAsPaidAsync: markAsPaid.mutateAsync,
    deleteBill: deleteBill.mutate,
    deleteBillAsync: deleteBill.mutateAsync,
    isCreating: createBill.isPending,
    isUpdating: updateBill.isPending,
    isDeleting: deleteBill.isPending,
  };
}
