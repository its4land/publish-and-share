/**
* Run this script in 'psql' after connecting to the database as admin.
* WARNING! This script will delete the database 'i4l' and reset roles
**/

/* Drop database, create it anew and connect */
\cd ddl

\c postgres
DROP DATABASE IF EXISTS i4l;
CREATE DATABASE i4l;

/* Switch to freshly created DB and create Schema + Extensions + Roles*/
\c i4l 
\i init_Schema_and_Extensions.sql
\i init_Roles.sql

/* Switch role*/
\c i4l i4luser

/* Create tables */

\i i4ldata.t_PuSConfig.sql

\i i4ldata.t_fgroup.sql
\i i4ldata.t_ftype.sql
\i i4ldata.t_fsubtype.sql

\i i4ldata.t_topoAreaFeature.sql
\i i4ldata.t_topoLinearFeature.sql
\i i4ldata.t_topoPointFeature.sql

\i i4ldata.t_Models.sql
\i i4ldata.t_ModelClasses.sql

\i i4ldata.t_Tags.sql

\i i4ldata.t_SpatialSources.sql
\i i4ldata.t_AddSpatialSourceDocuments.sql
\i i4ldata.t_AdminSource.sql
\i i4ldata.t_boundaryFaceString.sql
\i i4ldata.t_SpatialUnit.sql
\i i4ldata.t_SpatialUnitConcepts.sql

\i i4ldata.t_Tools.sql
\i i4ldata.t_ToolImages.sql
\i i4ldata.t_EntryPoint.sql

\i i4ldata.t_ContentIndex.sql
\i i4ldata.t_Item2Item.sql
\i i4ldata.t_itemLookUp.sql

\i i4ldata.t_ProjectComputationResults.sql
\i i4ldata.t_Projects.sql

\i i4ldata.t_TrainingSets.sql
\i i4ldata.t_WP5_ValidationSets.sql

\i i4ldata.t_Images.sql
\i i4ldata.t_ImageSets.sql
\i i4ldata.t_ImageSetsMetaData.sql
\i i4ldata.t_ImageSetsContentItem.sql

\i i4ldata.t_Processes.sql
\i i4ldata.t_ProcessParameters.sql

\i i4ldata.t_Logs.sql

\i i4ldata.t_Classifier.sql

\i i4ldata.t_DDILayers.sql
\i i4ldata.t_DDILayersImages.sql

\cd ..

\cd testdata
\i mmtestdata.sql

\cd ..
