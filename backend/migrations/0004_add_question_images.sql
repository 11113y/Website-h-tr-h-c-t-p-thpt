-- Migration: add images and sol_images to questions table
ALTER TABLE questions ADD COLUMN images JSON;
ALTER TABLE questions ADD COLUMN sol_images JSON;
