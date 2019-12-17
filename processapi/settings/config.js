// Configurable parameters for the its4land process API

/**
 * Defines default settings for job scheduling and execution
 * 
 * @param maxConcurrentTasks - Maximum number of tasks that can be run concurrently
 * @param maxRunningTime - Number of minutes should a process be allowed to run before it is killed
 * @param maxJobQueueSize - Maximum number of jobs that can be queued for execution
 */
module.exports.executionPolicy = {
    maxConcurrentTasks: 5,
    maxRunningTime: 100,
    maxJobQueueSize: 50
}

/**
 * Docker API parameters
 * 
 * @param host Hostname where Docker daemon is running
 * @param port Port on which Docker daemon is running
 * @param protocol Protocol to access Docker engine API
 * @param version Docker engine API version
 */
module.exports.dockerCfg = {
    host: 'localhost',
    port: 2375,
    protocol: 'http',
    version: 'v1.37'
}

/**
 * Redis client connections options
 * @param host Hostname of redis server
 * @param port Port to access redis server
 * @param password Redis authorization password
 * @param db Database to connect to
 */
module.exports.redisCfg = {
    host: 'localhost',
    port: 6379,
//    password: null,
//    db: null
}