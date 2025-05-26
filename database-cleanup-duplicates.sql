-- Database Cleanup - Remove Duplicate Messages
-- Run this in your Supabase SQL editor to remove duplicate conversations based on lovable_message_id

-- STEP 1: Identify duplicates (for review before deletion)
-- This query shows duplicate lovable_message_ids and their details
WITH duplicate_analysis AS (
  SELECT 
    COALESCE(lovable_message_id, project_context->>'lovableId') as lovable_id,
    project_id,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY timestamp ASC) as all_ids,
    array_agg(auto_capture ORDER BY timestamp ASC) as capture_methods,
    array_agg(timestamp ORDER BY timestamp ASC) as timestamps
  FROM conversations 
  WHERE COALESCE(lovable_message_id, project_context->>'lovableId') IS NOT NULL
  GROUP BY COALESCE(lovable_message_id, project_context->>'lovableId'), project_id
  HAVING COUNT(*) > 1
)
SELECT 
  lovable_id,
  project_id,
  duplicate_count,
  all_ids,
  capture_methods,
  timestamps,
  -- Keep the first one (oldest), mark others for deletion
  all_ids[2:array_length(all_ids, 1)] as ids_to_delete
FROM duplicate_analysis
ORDER BY duplicate_count DESC, lovable_id;

-- STEP 2: Delete duplicates (keeping the oldest/first occurrence)
-- IMPORTANT: Review the results from STEP 1 before running this!
-- This will permanently delete duplicate conversations

/*
-- Uncomment this section after reviewing STEP 1 results:

WITH duplicate_cleanup AS (
  SELECT 
    COALESCE(lovable_message_id, project_context->>'lovableId') as lovable_id,
    project_id,
    array_agg(id ORDER BY timestamp ASC) as all_ids
  FROM conversations 
  WHERE COALESCE(lovable_message_id, project_context->>'lovableId') IS NOT NULL
  GROUP BY COALESCE(lovable_message_id, project_context->>'lovableId'), project_id
  HAVING COUNT(*) > 1
),
ids_to_delete AS (
  SELECT unnest(all_ids[2:array_length(all_ids, 1)]) as id_to_delete
  FROM duplicate_cleanup
)
DELETE FROM conversations 
WHERE id IN (SELECT id_to_delete FROM ids_to_delete);

-- Get count of deleted records
SELECT 
  COUNT(*) as deleted_duplicates,
  'Duplicates removed successfully' as status
FROM conversations 
WHERE FALSE; -- This is just for the message

*/

-- STEP 3: Verify cleanup (run after STEP 2)
-- This should return 0 rows if cleanup was successful
SELECT 
  COALESCE(lovable_message_id, project_context->>'lovableId') as lovable_id,
  project_id,
  COUNT(*) as remaining_count
FROM conversations 
WHERE COALESCE(lovable_message_id, project_context->>'lovableId') IS NOT NULL
GROUP BY COALESCE(lovable_message_id, project_context->>'lovableId'), project_id
HAVING COUNT(*) > 1
ORDER BY remaining_count DESC;

-- STEP 4: Add unique constraint to prevent future duplicates (optional)
-- Only run this after cleanup is complete and you're confident it won't cause issues

/*
-- This will prevent duplicate lovable_message_id within the same project
-- Uncomment after cleanup:

ALTER TABLE conversations 
ADD CONSTRAINT unique_lovable_message_per_project 
UNIQUE (project_id, lovable_message_id) 
DEFERRABLE INITIALLY DEFERRED;

-- Note: This constraint only applies to the new lovable_message_id column
-- Records using the old project_context method can still have duplicates
-- Consider migrating all old records to use the new column structure
*/
