import { SupabaseClient } from '@supabase/supabase-js';
import type { LowStockAlert } from '@/lib/types';

export async function getLowStockAlerts(
  supabase: SupabaseClient,
  orgId: string
): Promise<LowStockAlert[]> {
  try {
    const { data: materials, error } = await supabase
      .from('raw_materials')
      .select('id, name, current_quantity, reorder_level, unit_of_measurement')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('current_quantity', { ascending: true });

    if (error || !materials) return [];

    return materials
      .filter(m => m.current_quantity <= (m.reorder_level || 0))
      .map(m => ({
        materialId: m.id,
        materialName: m.name,
        currentQty: m.current_quantity,
        reorderLevel: m.reorder_level || 0,
        unit: m.unit_of_measurement,
        status: m.current_quantity === 0
          ? 'OUT_OF_STOCK' as const
          : m.current_quantity <= (m.reorder_level || 0) * 0.25
          ? 'CRITICAL' as const
          : 'LOW_STOCK' as const,
      }));
  } catch {
    return [];
  }
}
