const os=require("os");
const fs=require("fs");

function getSystemInfo(){
    const totalMemory=('input.txt',utf-8);
    const cpu=('input.txt','utf-8');
    const platform=('input.txt','utf-8');
    fs.readFileSync('input.txt',err);
    os.writefileSysnc('output.txt',err)
    const cacheMemory={ };
    try{
        platform: os.platform() / (1024**3);
        cpu:os.cpus().length;
        totalMemory:os.totalMemmory() / (1024**3);
        console.log(`os fully successfully chraged: $(index.js)`);
    }
    catch (error){
        console.log("error is comming");
    }

}

export default getSystemInfo