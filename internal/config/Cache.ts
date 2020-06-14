export namespace CachedFS{
    const cache:{[fileName:string]:{ expiryDate:Date, content:any }} = {};

    export function readFile(path:string, options:{encoding:string}, callback){
        if (cache.hasOwnProperty(path) && cache[path].expiryDate.getTime() > Date.now()){
            callback(null, cache[path].content);
            return;
        }
        let thisDate = new Date();
        require("fs").readFile(path, options, (err, data) => {
            if (!err){
                cache[path] = {
                    expiryDate: (new Date(thisDate.setTime(thisDate.getTime() + 30_000))),
                    content: data
                };
            }
            callback(err, data);
        });
    }
}