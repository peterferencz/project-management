
export type ServerModule = 
    "Generic" |
    "Express" |
    "Database" |
    "Redis" |
    "Authentication";


function log(module: ServerModule, message: any) {
    console.log(`[${module}] [Info] ${message}`)
}

function warn(module: ServerModule, message: any) {
    console.warn(`[${module}] [Warn] ${message}`)
}

function error(module: ServerModule, message: any) {
    console.error(`[${module}] [Error] ${message}`)
}

function fatal(module: ServerModule, message: any) {
    console.error(`[${module}] [Fatal] ${message}`)
    process.exit(1)
}

export {log, warn, error, fatal}