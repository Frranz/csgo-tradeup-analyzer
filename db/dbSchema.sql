-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.12-MariaDB-1:10.4.12+maria~bionic - mariadb.org binary distribution
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             10.2.0.5599
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for csgo
DROP DATABASE IF EXISTS `csgo`;
CREATE DATABASE IF NOT EXISTS `csgo` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `csgo`;

-- Dumping structure for table csgo.collections
DROP TABLE IF EXISTS `collections`;
CREATE TABLE IF NOT EXISTS `collections` (
  `key` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Data exporting was unselected.

-- Dumping structure for table csgo.conditions
DROP TABLE IF EXISTS `conditions`;
CREATE TABLE IF NOT EXISTS `conditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Data exporting was unselected.

-- Dumping structure for table csgo.skins
DROP TABLE IF EXISTS `skins`;
CREATE TABLE IF NOT EXISTS `skins` (
  `name` varchar(50) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `weapon` varchar(20) NOT NULL,
  `collection_key` varchar(50) NOT NULL,
  `rarity` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_weapon_collection_key` (`name`,`weapon`,`collection_key`),
  KEY `collection_key` (`collection_key`),
  CONSTRAINT `collection_key` FOREIGN KEY (`collection_key`) REFERENCES `collections` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=1705 DEFAULT CHARSET=latin1;

-- Data exporting was unselected.

-- Dumping structure for table csgo.skin_conditions
DROP TABLE IF EXISTS `skin_conditions`;
CREATE TABLE IF NOT EXISTS `skin_conditions` (
  `skin_id` int(11) NOT NULL,
  `condition_id` int(11) unsigned NOT NULL,
  `price` float NOT NULL,
  `last_checked` datetime NOT NULL DEFAULT current_timestamp(),
  `amount` int(10) unsigned NOT NULL,
  UNIQUE KEY `skin_id_condition_id` (`skin_id`,`condition_id`),
  CONSTRAINT `skin_id` FOREIGN KEY (`skin_id`) REFERENCES `skins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Data exporting was unselected.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
