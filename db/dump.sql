DROP DATABASE IF EXISTS soccr;

CREATE DATABASE soccr;

USE soccr;

CREATE TABLE `teams`(
    `id` int AUTO_INCREMENT NOT NULL,
    `codename` varchar(16) NOT NULL,
    `name` varchar(64) NOT NULL,
    `countrycode` varchar(16) NOT NULL,
    `fifa_json` text NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`codename`)
);

CREATE TABLE `players`(
    `id` int AUTO_INCREMENT NOT NULL,
    `team_id` int NOT NULL,
    `name` varchar(128) NOT NULL,
    `countrycode` varchar(16) NOT NULL,
    `fifa_json` text NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`team_id`, `name`)
);

CREATE TABLE matches(
    `id` int AUTO_INCREMENT NOT NULL,
    `venue_id` int NOT NULL,
    `start_time` timestamp NOT NULL,
    `end_time` timestamp NOT NULL,
    `home_team_id` int NOT NULL,
    `away_team_id` int NOT NULL,
    `fifa_json` text NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`venue_id`, `start_time`, `end_time`)
);

CREATE TABLE venues(
    `id` int AUTO_INCREMENT NOT NULL,
    `name` varchar(128),
    `countrycode` varchar(16) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`name`)
);

CREATE TABLE player_match_stats(
    `id` int AUTO_INCREMENT NOT NULL,
    `player_id` int NOT NULL,
    `match_id` int NOT NULL,
    `json_stats` text,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`player_id`, `match_id`)
);

CREATE TABLE computed_team_match_stats(
    `id` int AUTO_INCREMENT NOT NULL,
    `team_id` int NOT NULL,
    `match_id` int NOT NULL,
    `json_stats` text,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`team_id`, `match_id`)
);

CREATE TABLE users(
    `id` int AUTO_INCREMENT NOT NULL,
    `username` varchar(16) NOT NULL,
    `name` varchar(64) NOT NULL,
    `countrycode` varchar(16) NOT NULL,
    `preferred_lang` varchar(16) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`username`)
);

CREATE TABLE user_match_squad(
    `id` int AUTO_INCREMENT NOT NULL,
    `user_id` int NOT NULL,
    `match_id` int NOT NULL,
    `json_squad` text NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`user_id`, `match_id`)
);

CREATE TABLE synopsiae(
    `id` int AUTO_INCREMENT NOT NULL,
    `table_name` varchar(32) NOT NULL,
    `foreign_id` int NOT NULL,
    `lang` varchar(16) NOT NULL,
    contents text NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`table_name`, `foreign_id`, `lang`)
);

CREATE TABLE computed_user_scores(
    `id` int AUTO_INCREMENT NOT NULL,
    `user_id` int NOT NULL,
    `json_score` text NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX (`user_id`)
);
