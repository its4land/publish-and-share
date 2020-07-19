/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 28-Mai-2019 18:39:19 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_ImageSetsContentItem CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_ImageSetsContentItem
(
	UID uuid NOT NULL,
	ImageSetUID uuid NOT NULL,
	ContentItemUID uuid NOT NULL,
	Description varchar(255) NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_ImageSetsContentItem ADD CONSTRAINT PK_Table1
	PRIMARY KEY (UID)
;

CREATE INDEX IXFK_t_ImageSetsContentItem_t_ImageSets ON i4ldata.t_ImageSetsContentItem (ImageSetUID ASC)
;

/* Create Foreign Key Constraints */

ALTER TABLE i4ldata.t_ImageSetsContentItem ADD CONSTRAINT FK_t_ImageSetsContentItem_t_ImageSets
	FOREIGN KEY (ImageSetUID) REFERENCES i4ldata.t_ImageSets (UID) ON DELETE No Action ON UPDATE No Action
;