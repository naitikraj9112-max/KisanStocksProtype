import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign up a new user with email and password
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in an existing user
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Upload a PDF file to the soil-pdfs bucket
 */
export async function uploadPdf(file, userId) {
  const fileName = `${userId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('soil-pdfs')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('soil-pdfs')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Save a soil report to the database
 */
export async function saveSoilReport(report) {
  const { data, error } = await supabase
    .from('soil_reports')
    .insert([report])
    .select();
  if (error) throw error;
  return data;
}
