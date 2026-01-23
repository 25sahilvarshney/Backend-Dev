const os = require("os");
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "system-info.log");

console.log("System Logger started...");

setInterval(() => {
  const info = `
Platform: ${os.platform()}
CPU Cores: ${os.cpus().length}
Total Memory: ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB
------------------------------------
`;

  fs.appendFile(logFile, info, (err) => {
    if (err) console.error(err);
  });
}, 5000);
