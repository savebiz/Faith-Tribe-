-- Fix: Allow everyone to read the parishes table
create policy "Parishes are viewable by everyone" on parishes for select using (true);

-- Optional: Allow admins to update (if we had an admin check, for now just read-only for public)
-- create policy "Admins can update parishes" on parishes for all using ( ... );
