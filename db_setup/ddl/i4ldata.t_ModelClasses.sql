/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 28-Sep-2018 16:16:16 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_ModelClasses CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_ModelClasses
(
	UID uuid NOT NULL,
	ModelUID uuid NOT NULL,
	NameInModel varchar(50) NULL,
	ConceptName varchar(50) NULL,
	ConceptImage uuid NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_ModelClasses ADD CONSTRAINT PK_t_ModelClass
	PRIMARY KEY (UID)
;

/* Create Foreign Key Constraints */

ALTER TABLE i4ldata.t_ModelClasses ADD CONSTRAINT FK_t_ModelClass_t_Model
	FOREIGN KEY (ModelUID) REFERENCES i4ldata.t_Models (UID) ON DELETE No Action ON UPDATE No Action
;