import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://blaffcuzlzuigfzdplav.supabase.co';
const supabaseAnonKey = 'sb_publishable_4hTHXfPrx1c4ZQNG_oFTkA_JpYuWHCK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);