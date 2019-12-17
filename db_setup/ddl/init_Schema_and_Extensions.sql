/* ---------------------------------------------------- */
/*  Created Manually						 		*/
/*  Created On : 26-Sep-2018						*/
/*  DBMS       : PostgreSQL 						*/
/* ---------------------------------------------------- */

/* Drop Schema */

DROP SCHEMA IF EXISTS i4ldata CASCADE;


/* Create Schema */

CREATE SCHEMA i4ldata;

/* Create Extensions for PostGIS and UUID */

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";