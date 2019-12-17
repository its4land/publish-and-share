/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 28-Mai-2019 18:39:19 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_ImageSetsMetaData CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_ImageSetsMetaData
(
	UID uuid NOT NULL,
	ImageSetUID uuid NOT NULL,
	MetaDataKey varchar(255) NOT NULL,
	MetaDataValue text NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_ImageSetsMetaData ADD CONSTRAINT PK_t_ImageSetsMetaData
	PRIMARY KEY (UID)
;

CREATE INDEX IXFK_t_ImageSetsMetaData_t_ImageSets ON i4ldata.t_ImageSetsMetaData (ImageSetUID ASC)
;

/* Create Foreign Key Constraints */

ALTER TABLE i4ldata.t_ImageSetsMetaData ADD CONSTRAINT FK_t_ImageSetsMetaData_t_ImageSets
	FOREIGN KEY (ImageSetUID) REFERENCES i4ldata.t_ImageSets (UID) ON DELETE No Action ON UPDATE No Action
;