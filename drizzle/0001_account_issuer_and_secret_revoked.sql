ALTER TABLE `account` ADD `issuer` text DEFAULT 'local:credential' NOT NULL;
CREATE UNIQUE INDEX `account_issuer_account_id_uq` ON `account` (`issuer`,`account_id`);
ALTER TABLE `secret` ADD `revoked_at` integer;
CREATE INDEX `secret_owner_created_idx` ON `secret` (`owner_user_id`,`created_at`);
