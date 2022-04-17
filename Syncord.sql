-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.27 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for syncord
CREATE DATABASE IF NOT EXISTS `syncord` /*!40100 DEFAULT CHARACTER SET utf8 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `syncord`;

-- Dumping structure for table syncord.authentications
CREATE TABLE IF NOT EXISTS `authentications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` int NOT NULL DEFAULT '0',
  `accessToken` varchar(510) NOT NULL DEFAULT '0',
  `refreshToken` varchar(510) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `AuthenticatedUser` (`user`),
  CONSTRAINT `AuthenticatedUser` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

-- Dumping structure for table syncord.backups
CREATE TABLE IF NOT EXISTS `backups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link` int NOT NULL DEFAULT '0',
  `authentication` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `BackupAuthentication` (`authentication`),
  KEY `BackupLink` (`link`),
  CONSTRAINT `BackupAuthentication` FOREIGN KEY (`authentication`) REFERENCES `authentications` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `BackupLink` FOREIGN KEY (`link`) REFERENCES `links` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

-- Dumping structure for table syncord.guilds
CREATE TABLE IF NOT EXISTS `guilds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guild` varchar(255) NOT NULL DEFAULT 'Unknown',
  `prefix` varchar(255) NOT NULL DEFAULT 's.',
  `syncEnabled` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

-- Dumping structure for table syncord.links
CREATE TABLE IF NOT EXISTS `links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` int NOT NULL DEFAULT '0',
  `guild` int NOT NULL DEFAULT '0',
  `linkedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `alreadyLoaded` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `LinkUser` (`user`),
  KEY `LinkGuilds` (`guild`),
  CONSTRAINT `LinkGuilds` FOREIGN KEY (`guild`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `LinkUser` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

-- Dumping structure for table syncord.messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guild` int NOT NULL DEFAULT '0',
  `message` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `MessageGuild` (`guild`),
  CONSTRAINT `MessageGuild` FOREIGN KEY (`guild`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

-- Dumping structure for table syncord.plans
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT 'PLAN_NAME',
  `costs` int DEFAULT NULL,
  `limitedServers` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PlanName` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

-- Dumping structure for table syncord.subscriptions
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` int NOT NULL DEFAULT '0',
  `plan` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'FREE',
  `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` timestamp NULL DEFAULT ((now() + interval 31 day)),
  PRIMARY KEY (`id`),
  KEY `SubscriptionUser` (`user`),
  KEY `SubscriptionPlan` (`plan`),
  CONSTRAINT `SubscriptionPlan` FOREIGN KEY (`plan`) REFERENCES `plans` (`name`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `SubscriptionUser` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

-- Dumping structure for table syncord.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` varchar(255) NOT NULL DEFAULT 'Unknown',
  `isAdministrator` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Data exporting was unselected.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
