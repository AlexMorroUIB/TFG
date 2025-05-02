-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Apr 27, 2025 at 03:42 PM
-- Server version: 11.7.2-MariaDB-ubu2404
-- PHP Version: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

SET PASSWORD FOR 'root'@'localhost' = PASSWORD('pass');

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bellver`
--
CREATE DATABASE IF NOT EXISTS `bellver` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
USE `bellver`;

-- --------------------------------------------------------

--
-- Table structure for table `puntuacions`
--

CREATE TABLE `puntuacions` (
  `nom` varchar(25) NOT NULL,
  `edat` tinyint(4) NOT NULL,
  `experiencia` tinyint(1) DEFAULT NULL,
  `sexe` char(1) DEFAULT NULL,
  `dispars` mediumint(11) DEFAULT NULL,
  `encerts` mediumint(11) DEFAULT NULL,
  `puntuacio` int(11) DEFAULT NULL,
  `ronda` smallint(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `puntuacions`
--

INSERT INTO `puntuacions` (`nom`, `edat`, `experiencia`, `sexe`, `dispars`, `encerts`, `puntuacio`, `ronda`) VALUES
('a', 0, NULL, NULL, 1, 1, 0, 1),
('b', 0, 0, 'D', 2, 2, 0, 1),
('v', 0, NULL, NULL, NULL, NULL, 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `puntuacions`
--
ALTER TABLE `puntuacions`
  ADD PRIMARY KEY (`nom`,`edat`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
