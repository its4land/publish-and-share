/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 06-Sep-2018 14:36:05 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_TrainingSets CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_TrainingSets
(
	UID uuid NOT NULL,
	Name varchar(50) NULL,
	Description varchar(255) NULL,
	TrainingSetType varchar(50) NULL,
	TrainingSetStatus integer NULL,
	ContentItem varchar(255) NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_TrainingSets ADD CONSTRAINT PK_t_TrainingSets
	PRIMARY KEY (UID)
;