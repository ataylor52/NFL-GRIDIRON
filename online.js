
(()=>{
const $=id=>document.getElementById(id),screen=$('onlineScreen'),canvas=$('onlineField'),g=canvas.getContext('2d');
const names='Arizona Cardinals,Atlanta Falcons,Baltimore Ravens,Buffalo Bills,Carolina Panthers,Chicago Bears,Cincinnati Bengals,Cleveland Browns,Dallas Cowboys,Denver Broncos,Detroit Lions,Green Bay Packers,Houston Texans,Indianapolis Colts,Jacksonville Jaguars,Kansas City Chiefs,Las Vegas Raiders,Los Angeles Chargers,Los Angeles Rams,Miami Dolphins,Minnesota Vikings,New England Patriots,New Orleans Saints,New York Giants,New York Jets,Philadelphia Eagles,Pittsburgh Steelers,San Francisco 49ers,Seattle Seahawks,Tampa Bay Buccaneers,Tennessee Titans,Washington Commanders'.split(',');
names.forEach((name,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=name;$('onlineTeam').append(opt)});
let ws=null,side=-1,code='',state=null,keys={},teams=[4,8],count=0,connected=false;
const send=m=>{if(ws?.readyState===1)ws.send(JSON.stringify(m))};
const status=m=>$('onlineStatus').textContent=m;
function connect(type){
 if(ws){ws.close();ws=null}
 const url=(location.protocol==='https:'?'wss:':'ws:')+'//'+location.host;
 if(location.protocol==='file:'){status('Online mode needs a hosted Node.js server. Run npm install && npm start, then open http://localhost:3000');return}
 ws=new WebSocket(url);ws.onopen=()=>send({type,code:$('onlineCode').value.trim().toUpperCase()});
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
 if(m.type==='error')status(m.message);
 if(m.type==='joined'){side=m.side;code=m.code;connected=true;$('onlineRoom').hidden=false;$('onlineRoomCode').textContent='ROOM: '+code;$('onlineReady').disabled=false;status('Share the website URL and room code with your friend.');send({type:'team',team:Number($('onlineTeam').value)})}
 if(m.type==='lobby'){count=m.count;teams=m.teams;$('onlineLobby').textContent=`Players: ${count}/2 · Ready: ${m.ready.filter(Boolean).length}/2`}
 if(m.type==='started'){teams=m.teams;status('MATCH STARTED — Select your play with Enter')}
 if(m.type==='state'){state=m.state;draw()}
 if(m.type==='disconnected'){status('Opponent disconnected. Return to menu and create another room.');connected=false}
 };
 ws.onerror=()=>status('Unable to connect. Check that the game server is running.');
 ws.onclose=()=>{connected=false;status('Connection closed. Refresh or create a new room.')};
}
$('menuOnline').onclick=()=>{document.getElementById('retroMenu').hidden=true;screen.hidden=false};
$('onlineBack').onclick=()=>{screen.hidden=true;document.getElementById('retroMenu').hidden=false;if(ws)ws.close();ws=null;state=null};
$('onlineCreate').onclick=()=>connect('create');$('onlineJoin').onclick=()=>connect('join');
$('onlineReady').onclick=()=>{send({type:'ready'});$('onlineReady').disabled=true};
$('onlineTeam').onchange=()=>send({type:'team',team:Number($('onlineTeam').value)});
function draw(){
 if(!state)return;
 g.fillStyle='#165e3c';g.fillRect(0,0,1100,570);
 for(let i=0;i<=10;i++){let x=70+i*96;g.strokeStyle='#ffffff88';g.lineWidth=2;g.beginPath();g.moveTo(x,55);g.lineTo(x,515);g.stroke();if(i<10){g.fillStyle=i%2?'#ffffff0a':'#00000012';g.fillRect(x,55,96,460)}}
 g.fillStyle='#ae273c';g.fillRect(0,55,70,460);g.fillStyle='#285cbd';g.fillRect(1030,55,70,460);
 if(state.loose){g.fillStyle='#dba255';g.beginPath();g.arc(state.loose.x,state.loose.y,9,0,7);g.fill()}
 state.players.forEach((p,i)=>{g.fillStyle=i===0?'#e84455':'#5298ff';g.beginPath();g.arc(p.x,p.y,18,0,7);g.fill();g.lineWidth=4;g.strokeStyle=i===side?'#fff35a':'#fff';g.stroke();g.fillStyle='white';g.font='bold 14px Arial';g.textAlign='center';g.fillText(i===0?'P1':'P2',p.x,p.y+5);if(i===state.carrier){g.fillStyle='#c88138';g.fillRect(p.x+17,p.y-9,15,9)}});
 g.fillStyle='#061b2bd9';g.fillRect(200,5,700,47);g.fillStyle='#fff';g.textAlign='center';g.font='bold 22px Arial';g.fillText(state.message,550,36);
 $('onlineScore').textContent=`${names[teams[0]]} ${state.score[0]} — ${state.score[1]} ${names[teams[1]]} · ${state.phase.toUpperCase()} · ${state.down} & ${state.toGo} · ${Math.ceil(state.clock)}s`;
}
window.addEventListener('keydown',e=>{if(screen.hidden||!connected||!state)return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 keys[e.code]=true;
 if(e.repeat)return;
 if(e.code==='Enter'&&(state.phase==='huddle'||state.phase==='two'))send({type:'play',play:side===state.off?'Run':'Man Coverage'});
 if(e.code==='Digit1'&&state.phase==='live'&&side===state.off)send({type:'pass'});
 if(state.phase==='conversion'&&side===state.off){if(e.code==='Digit1')send({type:'conversion',choice:'kick'});if(e.code==='Digit2')send({type:'conversion',choice:'two'})}
});
window.addEventListener('keyup',e=>{keys[e.code]=false});
setInterval(()=>{if(!screen.hidden&&connected)send({type:'input',keys:{left:!!(keys.KeyA||keys.ArrowLeft),right:!!(keys.KeyD||keys.ArrowRight),up:!!(keys.KeyW||keys.ArrowUp),down:!!(keys.KeyS||keys.ArrowDown),sprint:!!(keys.ShiftLeft||keys.ShiftRight)}})},50);
})();
