ALTER TABLE formulas
ADD COLUMN reward_granted TINYINT(1) NOT NULL DEFAULT 0;

-- Existing pending formulas may already have received the old submit-time reward.
UPDATE formulas SET reward_granted = 1 WHERE status = 'pending';
