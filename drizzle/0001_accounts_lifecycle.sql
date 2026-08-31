ALTER TABLE `secret` ADD `revoked_at` integer;
CREATE INDEX `secret_owner_created_idx` ON `secret` (`owner_user_id`, `created_at`);

ALTER TABLE `account` ADD `issuer` text NOT NULL DEFAULT 'local:credential';
DROP INDEX `account_provider_account_id_uq`;
CREATE UNIQUE INDEX `account_issuer_account_id_uq` ON `account` (`issuer`, `account_id`);

CREATE TABLE `rate_limit` (
  `id` text PRIMARY KEY NOT NULL,
  `key` text NOT NULL,
  `count` integer NOT NULL,
  `last_request` integer NOT NULL
);
CREATE UNIQUE INDEX `rate_limit_key_uq` ON `rate_limit` (`key`);
