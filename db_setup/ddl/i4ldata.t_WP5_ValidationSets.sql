/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 06-Sep-2018 14:36:05 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_WP5_ValdidationSets CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_WP5_ValdidationSets
(
	UID uuid NOT NULL,
	Name varchar(50) NULL,
	Description varchar(255) NULL,
	Status integer NULL,
	ContentItem varchar(255) NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_WP5_ValdidationSets ADD CONSTRAINT PK_t_WP5_ValdidationSets
	PRIMARY KEY (UID)
;