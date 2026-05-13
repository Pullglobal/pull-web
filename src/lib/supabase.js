import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function fetchActiveNodes() {
  const now = Date.now()
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .in('status', ['live', 'scheduled'])

  if (error) {
    console.error('fetchActiveNodes error:', error)
    return []
  }
  return data ?? []
}
