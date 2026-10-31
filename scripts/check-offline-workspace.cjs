const assert = require('node:assert/strict');
require('./register-typescript.cjs');
const mock = (file, exports) => { const name = require.resolve(file); require.cache[name] = { id: name, filename: name, loaded: true, exports }; };
const books = [{id:'linux',fileSizeMb:1},{id:'ml',fileSizeMb:1},{id:'code',fileSizeMb:1}];
let python=false, ready={}, calls=[], failPython=false, failLibrary=false, gate=null;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true,storage:{estimate:async()=>({quota:1e10,usage:0})}}});
mock('../src/lib/offlineCoding.ts',{isCodingPrepared:async()=>python,requireOfflineApp:async()=>{},prepareCoding:async()=>{calls.push('python');if(gate) await gate;if(failPython) throw Error('runtime failed');python=true;}});
mock('../src/lib/offlineLibrary.ts',{eligibleLibraryBooks:()=>books,libraryReadiness:async()=>({...ready}),subscribePreparation:()=>()=>{},getPreparationState:()=>({finished:3,error:failLibrary?'book failed':'',message:''}),cancelLibraryPreparation:()=>{},prepareLibrary:async ids=>{calls.push(ids);for(const id of ids) if(!failLibrary||id!=='ml') ready[id]='ready';}});
const workspace=require('../src/lib/offlineWorkspace.ts');
(async()=>{
 const first=workspace.prepareOfflineWorkspace();assert.equal(first,workspace.prepareOfflineWorkspace(),'Concurrent buttons share one preparation');await first;
 assert.deepEqual(calls,['python',books.map(b=>b.id)]);assert.equal(workspace.getOfflineWorkspaceState().phase,'ready');
 calls=[];await workspace.prepareOfflineWorkspace();assert.deepEqual(calls,[books.map(b=>b.id)],'Ready Python is reused');
 python=false;ready={};failPython=true;calls=[];await workspace.prepareOfflineWorkspace();assert.equal(workspace.getOfflineWorkspaceState().phase,'partial');assert.equal(workspace.getOfflineWorkspaceState().readyBooks,3);assert.equal(calls.length,2,'Library still prepares after runtime failure');
 python=false;ready={};failPython=false;failLibrary=true;await workspace.prepareOfflineWorkspace();assert.equal(workspace.getOfflineWorkspaceState().phase,'partial');assert.equal(workspace.getOfflineWorkspaceState().python,true);assert.equal(workspace.getOfflineWorkspaceState().readyBooks,2);
 python=false;ready={};failLibrary=false;calls=[];navigator.storage.estimate=async()=>({quota:1,usage:0});await workspace.prepareOfflineWorkspace();assert.equal(calls.length,0,'Storage failure prevents downloads');assert.equal(workspace.getOfflineWorkspaceState().phase,'error');
 navigator.storage.estimate=async()=>({quota:1e10,usage:0});let release;gate=new Promise(resolve=>release=resolve);calls=[];const stopped=workspace.prepareOfflineWorkspace();while(!calls.length)await new Promise(resolve=>setTimeout(resolve,0));workspace.cancelOfflineWorkspace();release();await stopped;gate=null;assert.deepEqual(calls,['python']);assert.equal(workspace.getOfflineWorkspaceState().phase,'cancelled');assert.equal(workspace.getOfflineWorkspaceState().python,true);
 console.log('Unified preparation passed: all subjects, concurrent callers, reuse, partial failures, quota and cancellation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
