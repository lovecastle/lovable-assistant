-- Create table for Project Assistant conversations
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_project_id ON assistant_conversations (project_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at ON assistant_conversations (created_at DESC);

-- Create RLS policies
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on assistant_conversations" ON assistant_conversations
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_assistant_conversations_updated_at ON assistant_conversations;
CREATE TRIGGER update_assistant_conversations_updated_at
  BEFORE UPDATE ON assistant_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add a view for easier querying with project information
-- Note: This view depends on the project_manager table existing
-- If you haven't created the project_manager table yet, you can skip this view
DO $$
BEGIN
  -- Check if project_manager table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_manager') THEN
    CREATE OR REPLACE VIEW assistant_conversations_with_project AS
    SELECT 
      ac.*,
      pm.project_name,
      pm.project_url
    FROM assistant_conversations ac
    LEFT JOIN project_manager pm ON ac.project_id = pm.project_id
    ORDER BY ac.created_at DESC;
    
    RAISE NOTICE 'View assistant_conversations_with_project created successfully';
  ELSE
    RAISE NOTICE 'Skipping view creation: project_manager table does not exist';
  END IF;
END $$;