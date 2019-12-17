const pg = require('pg');
//const startParameterCheck = require('../../../../common/startParameterCheck');
const {DB} = require('../../config/config.js');

//let dbConnectionString = startParameterCheck('sdcPostgresDB');
//let separator = (dbConnectionString.charAt(dbConnectionString.length-1) === '/') ? '' : '/';
let dbConnectionString = `postgresql://${DB.user}:${DB.password}@${DB.host}:${DB.port}/${DB.name}`;
//dbConnectionString = dbConnectionString + separator + DB.name;

const pool = new pg.Pool({connectionString: dbConnectionString});
pool.on('error', (error, client) => {
    console.error('Unexpected error on idle client', error);
    process.exit(-1)
});
module.exports.pool = pool;

const TransactionState = {
    created: 0,   // just created
    started: 1,   // initiated
    busy: 2,      // executing a command
    ready: 3,     // at least 1 command executed
    finished: 4,  // successfully finished
    aborted: 5,   // aborted with rollback
    aborting: 6,  // while aborting
    error: -1     // an error occurred on executing a command
}
module.exports.TransactionState = TransactionState;


/**
 * function creates a new transaction context, which has to be used as parameter for all commands of a transaction
 * 
 * @method startTransaction
 * @returns transaction context in state "started"
 * @throws access error on creating or starting the transaction
 */
module.exports.startTransaction = async function () {
    try {
        let transaction = await pool.connect();
        transaction.state = TransactionState.created;
        await module.exports.executeCommand('BEGIN', transaction);
        transaction.state = TransactionState.started;
        return transaction;
    } catch (error) {
        throw error;
    }
}

/**
 * function executes a command in a transaction context
 * accepts transaction states "started" or "ready", sets state to "ready" on success
 * 
 * @method executeCommand
 * @param {Any} command to be executed
 * @param {Object} transaction context of a transaction
 * @returns result of the query
 * @throws access error on executing the command
 */
module.exports.executeCommand = async function (command, transaction) {
    let states = [TransactionState.created, TransactionState.started, TransactionState.ready];
    if (command != null && transaction != null && states.includes(transaction.state)) {
        let cmdText = command.constructor == String ? command : command.text;
        let cmdValues = command.constructor == String ? undefined : command.values;
        try {
            /*console.log('Executing command %s...', cmdText);
            if (Array.isArray(cmdValues))
                console.log('--- values = %s', cmdValues.length > 0 ? cmdValues.join() : "(empty)");
            */
            transaction.state = TransactionState.busy;
            let result = await transaction.query(command);
            transaction.state = TransactionState.ready;
            return result;
        }
        catch (error) {
            transaction.state = TransactionState.error;
            if (transaction.errors == null)
                transaction.errors = [];
            transaction.errors.push(error);
            console.log('An error occurred in command %s:', cmdText, error);
            if (Array.isArray(cmdValues))
                console.log('--- values = %s', cmdValues.length > 0 ? cmdValues.join() : "(empty)");
            throw error;
        }
    }
    return null;
}

/**
 * function commits and finishes a transaction
 * accepts transaction states "started" or "ready", sets state to "finished" on success
 * 
 * @method finishTransaction
 * @param {Object} transaction context of a transaction
 * @returns true on success, false on faulty transaction states
 * @throws access error on committing the changes
 */
module.exports.finishTransaction = async function (transaction) {
    if (transaction != null) {
        if (transaction.state == TransactionState.ready) {
            try {
                await module.exports.executeCommand('COMMIT', transaction);
            }
            catch (error) {
                await module.exports.cancelTransaction(transaction);    
                throw error;
            }
        }
        let states = [TransactionState.started, TransactionState.ready];
        if (states.includes(transaction.state)) {
            transaction.release();
            transaction.state = TransactionState.finished;
            return true;
        }
        return false;
    }
    return null;
}

/**
 * function cancels a transaction and starts a rollback to undo any commands
 * accepts transaction states "started", "ready", "busy" or "error", sets state to "aborted" on success
 * 
 * @method cancelTransaction
 * @param {Object} transaction context of a transaction
 * @returns true on success, null on faulty transaction states
 * @throws access error on executing the command
 */
module.exports.cancelTransaction = async function (transaction) {
    if (transaction != null) {
        let states = [TransactionState.started, TransactionState.ready, TransactionState.busy, TransactionState.error];
        if (states.includes(transaction.state)) {
            try {
                if (transaction.state != TransactionState.started) {
                    transaction.state = TransactionState.aborting;
                    await module.exports.executeCommand('ROLLBACK', transaction);
                }
            }
            catch (error) {}
            finally {
                transaction.state = TransactionState.aborted;
                try { transaction.release(); } catch (error) {}
            }
            return true;
        }
        return false;
    }
    return null;
}

/**
 * function executes a list of commands in a common transaction context
 * if any of the commands throws an error, the transaction will be aborted.
 * 
 * @method executeCommands
 * @param {Any} commands to be executed
 * @returns true on success
 * @throws access error on executing a command
 */
module.exports.executeCommands = async function (commands) {
    if (commands) {
        if (!Array.isArray(commands)) {
            commands = [commands];
        }
        let transaction = module.exports.startTransaction();
        try {
            for (let cmd of commands) {
                await module.exports.executeCommand(cmd, transaction);
            }
        }
        finally {
            if (module.exports.finishTransaction(transaction) != null) {
                return true;
            }
            module.exports.cancelTransaction(transaction);
        }
        return false;
    }
    return null;
}

/* a template for integrating a transaction into a complex db call function

let transaction = await dbconn.startTransaction();
try {
    ...
    await dbconn.finishTransaction(transaction);
} catch (error) { 
    console.log(error);
    dbconn.cancelTransaction(transaction);
    throw(error);
}

let ownTransaction = transaction == null;
try {
    if (ownTransaction) { transaction = await dbconn.startTransaction(); }
    ...
    if (ownTransaction) { await dbconn.finishTransaction(transaction); }
} catch (err) { 
    console.log(err);
    if (ownTransaction) { dbconn.cancelTransaction(transaction); }
    throw(err);
}
*/
