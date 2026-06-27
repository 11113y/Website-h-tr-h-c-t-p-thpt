-- =============================================================================
-- Migration 0002: Thêm ràng buộc UNIQUE cho cột grade trong bảng subjects
-- =============================================================================

ALTER TABLE subjects ADD CONSTRAINT unique_grade UNIQUE (grade);
