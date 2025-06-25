-- Complete Schema Fix: Add ALL missing columns to prompt_templates table
-- This will add all columns that the application expects

-- First, let's see what columns exist (for reference)
-- You can run: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'prompt_templates';

-- Add all missing columns that the application expects
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS template_id TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS template_name TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS section TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS template_content TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS shortcut TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Copy data from 'category' to 'section' if category column exists and has data
UPDATE public.prompt_templates
SET section = category
WHERE section IS NULL AND category IS NOT NULL;

-- Set default values for required fields
UPDATE public.prompt_templates 
SET section = 'Uncategorized' 
WHERE section IS NULL OR section = '';

UPDATE public.prompt_templates 
SET name = template_name 
WHERE name IS NULL AND template_name IS NOT NULL;

UPDATE public.prompt_templates 
SET template_content = content 
WHERE template_content IS NULL AND content IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON public.prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_template_id ON public.prompt_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_section ON public.prompt_templates(section);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_section ON public.prompt_templates(user_id, section);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_system ON public.prompt_templates(is_system_template);

-- Add primary key if it doesn't exist (using template_id and user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'prompt_templates' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.prompt_templates 
    ADD CONSTRAINT pk_prompt_templates PRIMARY KEY (user_id, template_id);
  END IF;
EXCEPTION WHEN others THEN
  -- If adding primary key fails, just continue
  NULL;
END $$;

-- Note: This migration adds all possible columns the application might need