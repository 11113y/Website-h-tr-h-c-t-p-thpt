-- Migration: remove difficulty and points_rewarded from exams table
ALTER TABLE exams DROP COLUMN difficulty;
ALTER TABLE exams DROP COLUMN points_rewarded;
