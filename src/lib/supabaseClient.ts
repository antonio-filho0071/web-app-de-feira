import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true quando as variáveis de ambiente do Supabase foram configuradas. */
export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase = supabaseConfigurado ? createClient(url!, anonKey!) : null
