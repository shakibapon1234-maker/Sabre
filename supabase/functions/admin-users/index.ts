import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
  'Content-Type': 'application/json',
}

const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), { status, headers: cors })

function text(value: unknown, max = 150) {
  return String(value ?? '').trim().slice(0, max)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return fail('Method not allowed.', 405)

  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || ''
    const url = Deno.env.get('SUPABASE_URL')!
    const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: auth } = await service.auth.getUser(token)
    if (!auth.user) return fail('Authentication required.', 401)

    const { data: supervisor } = await service
      .from('profiles')
      .select('id,role,is_active')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (!supervisor?.is_active || supervisor.role !== 'supervisor') {
      return fail('Supervisor access is required.', 403)
    }

    const body = await req.json().catch(() => ({}))
    const action = text(body.action, 30)

    if (action === 'list') {
      const { data: profiles, error } = await service
        .from('profiles')
        .select('id,username,office_id,email,role,device_limit,is_active,created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      const { data: devices, error: deviceError } = await service
        .from('devices')
        .select('id,user_id,device_name,app_type,activated_at,last_seen_at,revoked_at')
        .order('last_seen_at', { ascending: false })
      if (deviceError) throw deviceError
      return Response.json({ profiles, devices }, { headers: cors })
    }

    if (action === 'create') {
      const username = text(body.username, 40).toUpperCase()
      const officeId = text(body.office_id, 40).toUpperCase()
      const email = text(body.email, 254).toLowerCase()
      const password = String(body.password ?? '')
      const role = body.role === 'supervisor' ? 'supervisor' : 'student'
      const deviceLimit = Number(body.device_limit)
      if (!/^[A-Z0-9_.-]{3,40}$/.test(username)) return fail('Username must be 3–40 letters, numbers, dots, underscores, or hyphens.')
      if (!/^[A-Z0-9_.-]{2,40}$/.test(officeId)) return fail('Office ID is invalid.')
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail('A valid email address is required.')
      if (password.length < 10) return fail('Password must contain at least 10 characters.')
      if (!Number.isInteger(deviceLimit) || deviceLimit < 1 || deviceLimit > 5) return fail('Device limit must be between 1 and 5.')

      const { data: created, error: createError } = await service.auth.admin.createUser({
        email, password, email_confirm: true,
      })
      if (createError || !created.user) return fail(createError?.message || 'Could not create the authentication user.')
      const { error: profileError } = await service.from('profiles').insert({
        id: created.user.id, username, office_id: officeId, email, role, device_limit: deviceLimit,
      })
      if (profileError) {
        await service.auth.admin.deleteUser(created.user.id)
        return fail(profileError.message)
      }
      await service.from('license_events').insert({
        user_id: created.user.id, event_type: 'admin_created',
        detail: { by: auth.user.id, role, device_limit: deviceLimit },
      })
      return Response.json({ ok: true, id: created.user.id }, { headers: cors })
    }

    if (action === 'update') {
      const userId = text(body.user_id, 36)
      const deviceLimit = Number(body.device_limit)
      const isActive = body.is_active === true
      if (!userId || !Number.isInteger(deviceLimit) || deviceLimit < 1 || deviceLimit > 5) {
        return fail('Invalid user or device limit.')
      }
      if (userId === auth.user.id && !isActive) return fail('You cannot disable your own supervisor account.')
      const { error } = await service.from('profiles')
        .update({ device_limit: deviceLimit, is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
      await service.from('license_events').insert({
        user_id: userId, event_type: 'admin_updated', detail: { by: auth.user.id, device_limit: deviceLimit, is_active: isActive },
      })
      return Response.json({ ok: true }, { headers: cors })
    }

    if (action === 'revoke_device') {
      const deviceId = text(body.device_id, 36)
      const { data: device, error: lookupError } = await service
        .from('devices').select('id,user_id').eq('id', deviceId).maybeSingle()
      if (lookupError || !device) return fail('Device not found.', 404)
      const { error } = await service.from('devices').update({
        revoked_at: new Date().toISOString(), revoked_by: auth.user.id,
      }).eq('id', device.id)
      if (error) throw error
      await service.from('license_events').insert({
        user_id: device.user_id, event_type: 'device_revoked', detail: { by: auth.user.id, device_id: device.id },
      })
      return Response.json({ ok: true }, { headers: cors })
    }

    return fail('Unknown action.')
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Admin request failed.', 500)
  }
})
