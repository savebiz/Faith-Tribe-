import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, fullName, role, scopedZone } = req.body;
    
    // Authenticate the requesting user from headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error: Supabase url/keys missing' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: currentStaff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('id', user.id)
      .single();

    if (staffError || !currentStaff) {
      return res.status(403).json({ error: 'Requesting staff profile not found' });
    }

    if (currentStaff.role !== 'super_admin') {
      return res.status(403).json({ error: 'Permission denied: Requires super_admin role' });
    }

    // Invite user via Supabase Auth
    const { data: authUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      return res.status(400).json({ error: inviteError.message });
    }

    // Insert staff profile
    const { error: insertError } = await supabaseAdmin
      .from('staff')
      .insert({
        id: authUser.user.id,
        email,
        full_name: fullName,
        role,
        scoped_zone: role === 'zone_manager' ? scopedZone : null,
        status: 'invited',
        invited_by: currentStaff.id
      });

    if (insertError) {
      return res.status(500).json({ error: `Failed to insert staff profile record: ${insertError.message}` });
    }

    // Log in audit log
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: currentStaff.id,
        action: 'staff.invited',
        target_type: 'staff',
        target_id: authUser.user.id,
        details: { email, role }
      });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Invite API handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
