/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 28-Mai-2019 18:39:19 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_PuSConfig CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_PuSConfig
(
	configKey varchar(255) NOT NULL,
	configValue text NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_PuSConfig ADD CONSTRAINT PK_t_PuSConfig
	PRIMARY KEY (configKey)
;