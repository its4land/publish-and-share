-- Create a read only group and grant corresponding privileges
DROP ROLE IF EXISTS i4l_readonly;
CREATE ROLE i4l_readonly;
GRANT USAGE ON SCHEMA i4ldata TO i4l_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA i4ldata TO i4l_readonly;

-- Create a read write group and grant corresponding privileges
DROP ROLE IF EXISTS i4l_readwrite;
CREATE ROLE i4l_readwrite;
GRANT USAGE ON SCHEMA i4ldata TO i4l_readwrite;
GRANT CREATE ON SCHEMA i4ldata TO i4l_readwrite;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA i4ldata TO i4l_readwrite;


-- Create a user able to login and inherit read-write permissions
DROP ROLE IF EXISTS i4luser;
CREATE ROLE i4luser WITH LOGIN IN ROLE i4l_readwrite PASSWORD '';
REVOKE CREATE ON SCHEMA public FROM i4luser;
GRANT CONNECT ON DATABASE i4l TO i4luser;
