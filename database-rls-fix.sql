-- Check and fix RLS settings for project_manager table

-- Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'project_manager';

-- Disable RLS (Row Level Security) if it's enabled
ALTER TABLE project_manager DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated users
GRANT ALL ON project_manager TO anon;
GRANT ALL ON project_manager TO authenticated;
GRANT ALL ON project_manager TO service_role;

-- Grant sequence permissions for the UUID generation
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the table exists and show its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_manager'
ORDER BY ordinal_position;

-- Test insert/select permissions by trying a simple query
SELECT COUNT(*) as total_rows FROM project_manager;