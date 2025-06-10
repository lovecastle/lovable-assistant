-- Project Manager Database Schema
-- Add this table to your Supabase database for storing Project Manager settings

-- Project Manager table for storing project settings and knowledge
CREATE TABLE IF NOT EXISTS project_manager (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL UNIQUE, -- Lovable project ID from URL
  project_name TEXT NOT NULL,
  project_url TEXT NOT NULL,
  description TEXT DEFAULT '', -- Project short description (max 150 chars)
  knowledge TEXT DEFAULT '', -- Project knowledge base and instructions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT project_manager_description_length CHECK (char_length(description) <= 150)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_manager_project_id ON project_manager(project_id);
CREATE INDEX IF NOT EXISTS idx_project_manager_updated_at ON project_manager(updated_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_manager_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_project_manager_updated_at
  BEFORE UPDATE ON project_manager
  FOR EACH ROW
  EXECUTE FUNCTION update_project_manager_updated_at();

-- Comments for documentation
COMMENT ON TABLE project_manager IS 'Stores project settings and knowledge base for Lovable Assistant Project Manager';
COMMENT ON COLUMN project_manager.project_id IS 'Unique identifier from Lovable.dev project URL';
COMMENT ON COLUMN project_manager.description IS 'Short project description (max 150 characters)';
COMMENT ON COLUMN project_manager.knowledge IS 'Project-specific documentation, guidelines, and instructions';