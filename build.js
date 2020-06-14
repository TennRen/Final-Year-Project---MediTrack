

const lessc = require("less");
const fs = require("fs");
const path = require("path");

const FORCE_DELETE_BUILT_ITEM = false;

function version(v){
    let parts = v.split(".");
    let major = parts[0];
    let minor = parts[1];
    let build = parts[2];

    return {
        major,
        minor,
        build
    }
}

function incrementVersion(v){
    return `${v.major}.${v.minor}.${ parseInt(v.build) + 1 }`;
}

function fixGitIgnore(filesToIgnore){
    let fileContent = fs.readFileSync( path.join(__dirname,".gitignore") , 'utf-8');
    let lines = fileContent.split("\n");
    let overwrite = false;

    let newFileLines = [];

    lines.forEach(line => {
        if (line.trim() === "### BEGIN clean"){
            newFileLines.push(line);
            overwrite = true;
        }
        else if (line.trim() === "### END"){
            newFileLines.push(line);
            overwrite = false;
        }
        else if (overwrite === true){
            newFileLines.push( ...(filesToIgnore.map(k => k.replace(`${__dirname}/`,""))) );
            overwrite = false;
        }
        else{
            newFileLines.push(line);
        }
    });

    fs.writeFileSync( path.join(__dirname,".gitignore"), newFileLines.join("\n") , 'utf-8');

    console.log("Updated gitignore");
}

function ignoreBuiltFiles(ref) {

    let toIgnore = [];

    function rm(thePath, ext) {
        let removedItems = [];

        ref[ext].forEach(k => {
            let p = path.join( path.dirname(thePath) , path.basename(thePath,`.${ext}`) + k);
            removedItems.push(p);
        });

        if (FORCE_DELETE_BUILT_ITEM){
            removedItems.forEach(item => {
                if (fs.existsSync(item)){
                    fs.unlinkSync(item);
                }
            })
        }

        if (removedItems.length > 0){
            toIgnore = [...toIgnore, ...removedItems];
        }
    }

    function walk(thePath){
        let filesInRoot = fs.readdirSync(thePath);

        filesInRoot.forEach(item => {
            item = path.join(thePath, item);
            if ( path.basename(item) === "node_modules" ) return;
            if ( path.basename(item) === ".github" ) return;
            if ( path.basename(item) === ".vscode" ) return;
            if ( path.basename(item) === ".git" ) return;

            let stat = fs.statSync(item);
            if (stat.isDirectory()) return walk(item);

            Object.keys(ref).forEach(k => {
                if ( item.endsWith(k) ) rm( item , k);
            });

        });
    }

    walk(__dirname);

    fixGitIgnore(toIgnore)
}

function buildLess(cb){
    let tasksRemaining = 0;

    function decrementTaskCount(){
        tasksRemaining --;
        if (tasksRemaining === 0 && cb) cb();
    }

    const STYLES_FOLDER = path.resolve("./public/styles");

    if (fs.existsSync(STYLES_FOLDER)){
        let entries = fs.readdirSync( STYLES_FOLDER );

        entries.forEach(entry => {

            let entryPath = path.join(STYLES_FOLDER,entry);
            let outputPath = path.join(STYLES_FOLDER, entry.replace(".less",".css") );
            let sourceMapPath = path.join(STYLES_FOLDER, entry.replace(".less", ".css.map"));

            if ( fs.statSync( entryPath ).isFile() ){

                if ( entry.startsWith("__") === false && entry.endsWith(".less") ){

                    tasksRemaining ++;

                    lessc.render( fs.readFileSync(entryPath, {encoding:"utf8"}) , {
                        env: "development",
                        sourceMap: { sourceMapFileInline: false },
                        paths: [STYLES_FOLDER]
                    }).then(function(out){
                        fs.writeFileSync(outputPath,out.css,{encoding:"utf8"});
                        fs.writeFileSync(sourceMapPath,out.map,{encoding:"utf8"});
                        decrementTaskCount();
                    }).catch(function(err){
                        console.error(err);
                        decrementTaskCount();
                    });

                }

            }

        });
    }
    else{
        if (cb) cb();
    }

}

function info(){
    const BUILD_INFO_FILE = path.resolve("./public/build_info.json");

    let c = fs.readFileSync(BUILD_INFO_FILE,"utf-8");
    let o = JSON.parse(c);
    let d = new Date();

    o.last_build = `${d.getFullYear()}-${ (d.getMonth()+1).toString().padStart(2,"0") }-${d.getDate()}`;
    o.version = incrementVersion( version(o.version) );

    fs.writeFileSync(
        BUILD_INFO_FILE,
        JSON.stringify(o,null, "\t"),
        "utf-8"
    );
}

buildLess(()=>{

    ignoreBuiltFiles({
        ts:[".js.map",".d.ts", ".js"],
        less:[".css",".css.map"]
    });

    info();

});


