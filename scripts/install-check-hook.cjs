// Run once per Git checkout; no dependencies or package installation required.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const result=spawnSync('git',['config','--local','core.hooksPath','.githooks'],{cwd:path.resolve(__dirname,'..'),stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
console.log('Pre-push check installed: every push must pass node scripts/check-all.cjs.');
