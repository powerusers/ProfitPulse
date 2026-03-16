import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/setup-org — create organization for the logged-in user
// Called right after signup once the session is established
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user from the server-side session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const businessName = body.business_name?.trim();

    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    // Check if org already exists for this user
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingOrg) {
      // Org already exists, just return success
      return NextResponse.json({ success: true, org_id: existingOrg.id });
    }

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        user_id: user.id,
        business_name: businessName,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Org creation error:', orgError);
      return NextResponse.json({ error: 'Failed to create organization: ' + orgError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, org_id: org.id }, { status: 201 });
  } catch (err) {
    console.error('Setup org error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
