-- Fix user registration by adding INSERT policy for user_profiles table
-- This allows new users to create their own profile during registration

-- Drop existing policies if needed (optional, for clean slate)
-- DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

-- Also ensure the service role can insert profiles (for backend operations)
CREATE POLICY "Service role can manage profiles" ON user_profiles
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Verify policies are set correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';