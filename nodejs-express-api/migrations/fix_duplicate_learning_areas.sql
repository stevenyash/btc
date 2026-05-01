-- Fix duplicate learning areas
-- This script identifies duplicate learning areas by name and removes them,
-- updating any associated lessons to point to the retained learning area.

START TRANSACTION;

-- Step 1: Identify duplicate learning areas
-- Create a temporary table to store the learning areas we want to keep (one per name)
CREATE TEMPORARY TABLE IF NOT EXISTS temp_learning_areas_to_keep AS
SELECT MIN(id) as id, name
FROM learning_areas
WHERE is_active = 1
GROUP BY name
HAVING COUNT(*) > 1;

-- Step 2: Update lessons to point to the retained learning area for duplicates
UPDATE lessons l
JOIN learning_areas la_old ON l.area_id = la_old.id
JOIN temp_learning_areas_to_keep la_keep ON la_old.name = la_keep.name AND la_old.id != la_keep.id
SET l.area_id = la_keep.id
WHERE la_old.is_active = 1 AND la_keep.is_active = 1;

-- Step 3: Deactivate duplicate learning areas (keep the one with minimum id)
UPDATE learning_areas la
SET is_active = 0
WHERE la.id NOT IN (
    SELECT id FROM temp_learning_areas_to_keep
) AND la.is_active = 1 AND EXISTS (
    SELECT 1 FROM temp_learning_areas_to_keep tak WHERE tak.name = la.name
);

-- Step 4: Verify the changes
SELECT 'Duplicate learning areas fixed' as message;
SELECT la.name as learning_area_name, COUNT(*) as count
FROM learning_areas la
WHERE la.is_active = 1
GROUP BY la.name
HAVING COUNT(*) > 1;

-- Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS temp_learning_areas_to_keep;

COMMIT;