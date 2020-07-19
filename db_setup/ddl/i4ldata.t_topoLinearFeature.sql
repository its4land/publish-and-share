/* ---------------------------------------------------- */
/*  Generated by Enterprise Architect Version 12.1 		*/
/*  Created On : 06-Sep-2018 14:36:05 				*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Tables */

DROP TABLE IF EXISTS i4ldata.t_topoLinearFeature CASCADE
;

/* Create Tables */

CREATE TABLE i4ldata.t_topoLinearFeature
(
	UID uuid NOT NULL,
	fgroup varchar(50) NOT NULL,
	ftype varchar(50) NOT NULL,
	fsubtype varchar(50) NULL,
	fname varchar(100) NULL,
	fURI varchar(150) NULL,
	geom geometry(LINESTRING,4326) NULL
)
;

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE i4ldata.t_topoLinearFeature ADD CONSTRAINT PK_t_topoLinearFeature
	PRIMARY KEY (UID)
;

CREATE INDEX IXFK_t_topoLinearFeature_t_fgroup ON i4ldata.t_topoLinearFeature (fgroup ASC)
;

CREATE INDEX IXFK_t_topoLinearFeature_t_fsubtype ON i4ldata.t_topoLinearFeature (fgroup ASC,ftype ASC,fsubtype ASC)
;

CREATE INDEX IXFK_t_topoLinearFeature_t_ftype ON i4ldata.t_topoLinearFeature (fgroup ASC,ftype ASC)
;

CREATE INDEX spidx_topoLinearFeature ON i4ldata.t_topoLinearFeature using GIST(geom)
;

/* Create Foreign Key Constraints */

ALTER TABLE i4ldata.t_topoLinearFeature ADD CONSTRAINT FK_t_topoLinearFeature_t_fgroup
	FOREIGN KEY (fgroup) REFERENCES i4ldata.t_fgroup (fgroup) ON DELETE No Action ON UPDATE No Action
;

ALTER TABLE i4ldata.t_topoLinearFeature ADD CONSTRAINT FK_t_topoLinearFeature_t_fsubtype
	FOREIGN KEY (fgroup,ftype,fsubtype) REFERENCES i4ldata.t_fsubtype (fgroup,ftype,fsubtype) ON DELETE No Action ON UPDATE No Action
;

ALTER TABLE i4ldata.t_topoLinearFeature ADD CONSTRAINT FK_t_topoLinearFeature_t_ftype
	FOREIGN KEY (fgroup,ftype) REFERENCES i4ldata.t_ftype (fgroup,ftype) ON DELETE No Action ON UPDATE No Action
;