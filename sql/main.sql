-- Tables of this resource: CREATE TABLE IF NOT EXISTS, names prefixed with the resource (ai_<name>_...),
-- every table ending with ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;".
-- Installed by createDatabaseTables on start: missing tables and columns are added, nothing is dropped,
-- keys are only created with a new table (plan indexes before the first release).

-- Vehicles listed at a lot. The vehicle itself stays in ai-vehicles (same id and plate), held by this resource while
-- listed. seller = ai_core_characters.id; seller_name is the contract's signature at listing time (shown while the
-- seller is offline). model and plate are copies for the list, so browsing never reads ai-vehicles per row.
CREATE TABLE IF NOT EXISTS `ai_vehiclesales_listings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `vehicle_id` BIGINT UNSIGNED NOT NULL,
  `lot` VARCHAR(48) NOT NULL,
  `seller` INT UNSIGNED NOT NULL,
  `seller_name` VARCHAR(64) NOT NULL,
  `model` VARCHAR(64) NOT NULL,
  `plate` VARCHAR(8) NOT NULL,
  `price` INT UNSIGNED NOT NULL,
  `description` VARCHAR(200) NOT NULL DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicle` (`vehicle_id`),
  KEY `seller` (`seller`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Money a seller earned and has not received yet (offline at the sale); paid at the seller's next character load.
CREATE TABLE IF NOT EXISTS `ai_vehiclesales_payouts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller` INT UNSIGNED NOT NULL,
  `amount` INT UNSIGNED NOT NULL,
  `model` VARCHAR(64) NOT NULL,
  `plate` VARCHAR(8) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `seller` (`seller`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
