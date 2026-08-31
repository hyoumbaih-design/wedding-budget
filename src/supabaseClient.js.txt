import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rrianocdxoewvxsypfwy.supabase.co';
const supabaseAnonKey = 'sb_publishable_6VjeNlQHQ4uDTIBxQGBduw_i8vA-g2d';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);