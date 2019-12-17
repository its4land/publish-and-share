/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 17-Dec-2019 17:12:52 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_SpatialUnitConcepts CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_SpatialUnitConcepts
(
	UID uuid NOT NULL,
	Name varchar(255) NOT NULL,
	Description varchar(255) NULL,
	LongDescription text NULL,
	ExtDescriptionURL varchar(255) NULL,
	contentitem uuid NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_SpatialUnitConcepts ADD CONSTRAINT PK_t_SpatialUnitConcept
	PRIMARY KEY (UID)
;