import { SupabaseClient } from '@supabase/supabase-js';

interface BOMBackflushResult {
  success: boolean;
  deductions: Array<{
    materialId: string;
    materialName: string;
    qtyDeducted: number;
    remainingQty: number;
  }>;
  warnings: string[];
}

export async function processBOMBackflush(
  supabase: SupabaseClient,
  saleId: string,
  finishedGoodId: string,
  quantitySold: number,
  orgId: string
): Promise<BOMBackflushResult> {
  const deductions: BOMBackflushResult['deductions'] = [];
  const warnings: string[] = [];

  try {
    // Fetch BOM for this product
    const { data: bomLines, error: bomError } = await supabase
      .from('bill_of_materials')
      .select(`
        id,
        raw_material_id,
        quantity_per_unit,
        waste_percentage,
        raw_materials (id, name, current_quantity, unit_of_measurement)
      `)
      .eq('finished_good_id', finishedGoodId);

    if (bomError || !bomLines?.length) {
      return { success: true, deductions: [], warnings: ['No BOM found — no materials deducted'] };
    }

    for (const line of bomLines) {
      const material = (line as any).raw_materials;
      const qtyToDeduct = quantitySold * line.quantity_per_unit * (1 + line.waste_percentage / 100);

      if (material.current_quantity < qtyToDeduct) {
        warnings.push(`Insufficient ${material.name}: need ${qtyToDeduct.toFixed(2)}, have ${material.current_quantity.toFixed(2)} ${material.unit_of_measurement}`);
      }

      // Deduct (allow negative for tracking)
      const newQty = Math.max(material.current_quantity - qtyToDeduct, 0);

      await supabase
        .from('raw_materials')
        .update({ current_quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', line.raw_material_id);

      // Log transaction
      await supabase.from('inventory_transactions').insert({
        org_id: orgId,
        raw_material_id: line.raw_material_id,
        transaction_type: 'SALE_DEDUCTION',
        quantity_change: -qtyToDeduct,
        transaction_date: new Date().toISOString().split('T')[0],
        reference_type: 'sales',
        reference_id: saleId,
        notes: `Auto-deducted: ${quantitySold} units sold`,
      });

      deductions.push({
        materialId: line.raw_material_id,
        materialName: material.name,
        qtyDeducted: qtyToDeduct,
        remainingQty: newQty,
      });
    }

    // Mark sale as backflushed
    await supabase.from('sales').update({ is_backflushed: true }).eq('id', saleId);

    return { success: true, deductions, warnings };
  } catch (error) {
    return { success: false, deductions: [], warnings: [`Error: ${(error as Error).message}`] };
  }
}
