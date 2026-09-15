import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ghost-package-'));
const app=await electron.launch({executablePath:path.resolve('release/mac-arm64/Ghost.app/Contents/MacOS/Ghost'),args:[],env:{...process.env,GHOST_DATA_DIR:dir,OPENAI_API_KEY:''}});
try{
 const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.getByRole('button',{name:'Try Demo'}).click();await page.getByRole('button',{name:'Analyze patterns'}).first().click();await expect(page.getByRole('heading',{name:'Weekly reporting',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Explore',exact:true}).first().click();await page.getByRole('button',{name:'Automate this'}).click();await page.getByRole('button',{name:'Activate workflow'}).click();await expect(page.getByText('WORKFLOW ACTIVATED',{exact:true})).toBeVisible();
 expect(errors).toEqual([]);console.log('Packaged Ghost.app: launch, demo analysis, workflow activation and console checks passed.');
}finally{await app.close();fs.rmSync(dir,{recursive:true,force:true});}
