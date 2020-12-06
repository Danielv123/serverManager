var exec = require('child_process').exec;

function getSensors(config) {
    return new Promise(resolve => {
        let command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P ${config.password} sensor`
        exec(command, (error, out, err) => {
            if(error) console.error(error)
            if(err) console.error(err)
            let data = out.split("\n")
            .map(x => x.split("|")
            .map(y => y.trim()))
            .filter(x => x[1] !== "na" && x[0])
            // console.log(data)
            resolve(data)
        })
    })
}

module.exports = {
    getSensors
}