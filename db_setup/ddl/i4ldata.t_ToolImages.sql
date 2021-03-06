/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 04-Okt-2018 12:14:00 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_ToolImages CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_ToolImages
(
	UID uuid NOT NULL,
	ToolUID uuid NOT NULL,
	Version varchar(50) NOT NULL,
	ReleaseDate timestamp NOT NULL,
	Image varchar(50) NOT NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_ToolImages ADD CONSTRAINT PK_t_ToolImage
	PRIMARY KEY (UID)
;

ALTER TABLE i4ldata.t_ToolImages ADD CONSTRAINT idx_unq_ToolVersion UNIQUE (ToolUID,Version)
;

/* Create Foreign Key Constraints */

ALTER TABLE i4ldata.t_ToolImages ADD CONSTRAINT FK_t_ToolImage_t_Tools
	FOREIGN KEY (ToolUID) REFERENCES i4ldata.t_Tools (UID) ON DELETE Cascade ON UPDATE Cascade
;