-- Add points and experience columns to profiles table
ALTER TABLE profiles 
ADD COLUMN points INTEGER DEFAULT 0,
ADD COLUMN experience INTEGER DEFAULT 0;
