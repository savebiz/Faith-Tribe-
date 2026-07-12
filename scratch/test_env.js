import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

console.log("Keys in process.env:", Object.keys(process.env).filter(k => k.includes('BIBLE') || k.includes('SUPABASE')));
console.log("BIBLE_BRAIN_API_KEY length:", process.env.BIBLE_BRAIN_API_KEY ? process.env.BIBLE_BRAIN_API_KEY.length : 0);
