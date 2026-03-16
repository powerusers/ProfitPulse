import { SupabaseClient } from '@supabase/supabase-js';

interface WeightedAvgResult {
  success: boolean;
  previousCost: number;
  newCost: number;
  newQuantity: number;
  error?: string;
}

export async function updateWeightedAvgCost(
  supabase: SupabaseClient,
  materialId: string,
  purchaseQty: number,
  purchaseUnitCost: number
): Promise<WeightedAvgResult> {
  try {
    const { data: material, error } = await supabase
      .from('raw_materials')
      .select('current_quantity, weighted_avg_cost')
      .eq('id', materialId)
      .single();

    if (error || !material) {
      return { success: false, previousCost: 0, newCost: 0, newQuantity: 0, error: 'Material not found' };
    }

    const oldQty = material.current_quantity;
    const oldCost = material.weighted_avg_cost;
    const newTotalQty = oldQty + purchaseQty;

    // Weighted Average Cost formula
    const newAvgCost = newTotalQty > 0
      ? ((oldQty * oldCost) + (purchaseQty * purchaseUnitCost)) / newTotalQty
      : purchaseUnitCost;

    // Update material
    await supabase
      .from('raw_materials')
      .update({
        current_quantity: newTotalQty,
        weighted_avg_cost: newAvgCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId);

    return {
      success: true,
      previousCost: oldCost,
      newCost: newAvgCost,
      newQuantity: newTotalQty,
    };
  } catch (error) {
    return { success: false, previousCost: 0, newCost: 0, newQuantity: 0, error: (error as Error).message };
  }
}
