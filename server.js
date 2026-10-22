
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const root=__dirname,rooms=new Map(),PORT=process.env.PORT||3000;
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent((req.url||'/').split('?')[0]),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404);return res.end('Not found')}
 res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(file)]||'application/octet-stream');res.end(bytes)});
});
const wss=new WebSocketServer({server});
const send=(ws,data)=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(data))};
const emit=(r,data)=>r.clients.forEach(c=>send(c,data));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function create(){let code;do{code='GRID-'+Math.floor(1000+Math.random()*9000)}while(rooms.has(code));const r={code,clients:[],ready:[false,false],teams:[4,8],inputs:[{},{}],state:null};rooms.set(code,r);return r}
function start(r){r.state={phase:'huddle',off:0,score:[0,0],down:1,toGo:10,pos:25,clock:240,quarter:1,players:[{x:280,y:285},{x:780,y:285}],carrier:0,selected:[null,null],message:'Choose plays',live:0,ball:{x:280,y:285},loose:null};emit(r,{type:'started',teams:r.teams})}
function drive(s,off,pos,msg){s.off=off;s.pos=clamp(pos,1,99);s.toGo=Math.min(10,100-s.pos);s.down=1;s.phase='huddle';s.selected=[null,null];s.carrier=off;s.players=[{x:280,y:285},{x:780,y:285}];s.loose=null;s.message=msg}
function finish(r,reason){const s=r.state,runner=s.players[s.carrier],yards=Math.round((s.carrier===0?runner.x-280:780-runner.x)/9.6);s.pos=clamp(s.pos+yards,1,99);s.toGo-=yards;s.down++;s.phase='huddle';s.selected=[null,null];s.message=reason+' · '+yards+' yards';if(s.toGo<=0){s.down=1;s.toGo=Math.min(10,100-s.pos)}else if(s.down>4)drive(s,1-s.off,100-s.pos,'TURNOVER ON DOWNS')}
function tick(r,dt){
 const s=r.state;if(!s||s.phase!=='live')return;s.live+=dt;s.clock=Math.max(0,s.clock-dt);
 for(let i=0;i<2;i++){let p=s.players[i],k=r.inputs[i]||{},dx=Number(!!k.right)-Number(!!k.left),dy=Number(!!k.down)-Number(!!k.up),mag=Math.hypot(dx,dy)||1,spd=(i===s.carrier?95:118)*(k.sprint?1.2:1);p.x=clamp(p.x+dx/mag*spd*dt,70,1030);p.y=clamp(p.y+dy/mag*spd*dt,55,515)}
 const c=s.players[s.carrier];s.ball={x:c.x,y:c.y};
 if((s.carrier===0&&c.x>=1020)||(s.carrier===1&&c.x<=80)){
 if(s.twoAttempt){if(s.carrier===s.off)s.score[s.off]+=2;drive(s,1-s.off,25,'TWO-POINT TRY COMPLETE');s.twoAttempt=false}
 else{s.score[s.carrier]+=6;s.off=s.carrier;s.phase='conversion';s.message='TOUCHDOWN!! Choose extra point or two'}return}
 if(Math.hypot(s.players[0].x-s.players[1].x,s.players[0].y-s.players[1].y)<23){if(s.twoAttempt){s.twoAttempt=false;drive(s,1-s.off,25,'TWO-POINT TRY FAILED');return}
 if(Math.random()<.05){s.phase='loose';s.loose={x:c.x+10,y:c.y+12,age:0};s.message='FUMBLE!';return}
 finish(r,'TACKLED');return}
 if(s.live>14||s.clock<=0){if(s.twoAttempt){s.twoAttempt=false;drive(s,1-s.off,25,'TWO-POINT TRY FAILED')}else finish(r,'PLAY OVER')}
}
function tickLoose(r,dt){const s=r.state;if(s?.phase!=='loose')return;s.loose.age+=dt;const f=s.loose;s.ball={x:f.x,y:f.y};for(let i=0;i<2;i++){let p=s.players[i],k=r.inputs[i]||{},dx=Number(!!k.right)-Number(!!k.left),dy=Number(!!k.down)-Number(!!k.up),mag=Math.hypot(dx,dy)||1;p.x=clamp(p.x+dx/mag*110*dt,70,1030);p.y=clamp(p.y+dy/mag*110*dt,55,515)}
 if(f.age>.3){let d=s.players.map(p=>Math.hypot(p.x-f.x,p.y-f.y)),winner=d[0]<=d[1]?0:1;if(d[winner]<25||f.age>3){s.carrier=winner;s.phase='live';s.live=0;s.message='FUMBLE RECOVERED! RETURN LIVE';s.loose=null}}
}
wss.on('connection',ws=>{ws.room=null;ws.side=-1;
 ws.on('message',data=>{let m;try{m=JSON.parse(data)}catch{return}
 if(m.type==='create'||m.type==='join'){if(ws.room)return;const r=m.type==='create'?create():rooms.get(String(m.code||'').toUpperCase());if(!r||r.clients.length>=2){send(ws,{type:'error',message:'Room not found or full'});return}ws.room=r;ws.side=r.clients.length;r.clients.push(ws);send(ws,{type:'joined',code:r.code,side:ws.side});emit(r,{type:'lobby',count:r.clients.length,ready:r.ready,teams:r.teams});return}
 const r=ws.room;if(!r)return;
 if(m.type==='team'&&!r.state){r.teams[ws.side]=clamp(Number(m.team)||0,0,31);r.ready[ws.side]=false;emit(r,{type:'lobby',count:r.clients.length,ready:r.ready,teams:r.teams})}
 if(m.type==='ready'&&!r.state){r.ready[ws.side]=true;emit(r,{type:'lobby',count:r.clients.length,ready:r.ready,teams:r.teams});if(r.clients.length===2&&r.ready.every(Boolean))start(r)}
 if(m.type==='input'&&r.state){let k=m.keys||{};r.inputs[ws.side]={left:!!k.left,right:!!k.right,up:!!k.up,down:!!k.down,sprint:!!k.sprint}}
 if(m.type==='play'&&r.state?.phase==='huddle'){r.state.selected[ws.side]=String(m.play||'Run').slice(0,25);if(r.state.selected.every(Boolean)){r.state.phase='live';r.state.live=0;r.state.message='PLAY LIVE'}}
 if(m.type==='pass'&&r.state?.phase==='live'&&r.state.off===ws.side){let s=r.state,d=Math.hypot(s.players[0].x-s.players[1].x,s.players[0].y-s.players[1].y),risk=d<25?.65:d<65?.5:0;if(Math.random()<risk){s.carrier=1-ws.side;s.message='INTERCEPTION! RETURN LIVE'}else{s.players[ws.side].x+=ws.side===0?55:-55;s.message='PASS COMPLETE'}}
 if(m.type==='conversion'&&r.state?.phase==='conversion'&&r.state.off===ws.side){let s=r.state;if(m.choice==='kick'){s.score[s.off]+=1;drive(s,1-s.off,25,'EXTRA POINT GOOD')}else{s.phase='two';s.message='TWO POINT TRY: both players select plays';s.selected=[null,null]}}
 if(m.type==='play'&&r.state?.phase==='two'){r.state.selected[ws.side]=String(m.play||'Run');if(r.state.selected.every(Boolean)){r.state.phase='live';r.state.live=0;r.state.pos=98;r.state.twoAttempt=true;r.state.players=r.state.off===0?[{x:975,y:285},{x:995,y:285}]:[{x:105,y:285},{x:125,y:285}];r.state.carrier=r.state.off;r.state.message='TWO POINT TRY LIVE'}}
 });
 ws.on('close',()=>{const r=ws.room;if(!r)return;emit(r,{type:'disconnected',message:'Opponent disconnected'});rooms.delete(r.code);for(let c of r.clients)if(c!==ws){c.room=null;c.side=-1}})
});
setInterval(()=>{for(let r of rooms.values())if(r.state){tick(r,.05);tickLoose(r,.05);emit(r,{type:'state',state:r.state})}},50);
server.listen(PORT,()=>console.log('NFL GRIDIRON server listening on '+PORT));
