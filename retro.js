(()=>{
'use strict';
const $=id=>document.getElementById(id);
const intro=$('retroIntro'),menu=$('retroMenu'),setup=$('setup'),game=$('game');
const ic=$('introCanvas'),mc=$('menuCanvas'),ctx=ic.getContext('2d'),bg=mc.getContext('2d');
let introStart=performance.now(),mode='intro',impact=false,shake=0,particles=[],audio=null,soundEnabled=true;
setup.hidden=true;
function tone(freq,duration,type='square',volume=.045){
 if(!soundEnabled)return;
 try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
 const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,audio.currentTime);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}catch{}
}
function field(c,t){
 c.fillStyle='#071525';c.fillRect(0,0,960,540);
 c.fillStyle='#182d43';c.fillRect(0,0,960,100);c.fillRect(0,470,960,70);
 for(let row=0;row<3;row++)for(let i=0;i<100;i++){let x=i*12+(row%2)*6,y=16+row*24;c.fillStyle=['#d8c25a','#9db1ca','#8c5262','#e3e3e3'][(i*7+row*3)%4];c.fillRect(x,y,5,5)}
 c.fillStyle='#1e7048';c.fillRect(0,100,960,370);
 for(let x=-100+(t*58)%100;x<1060;x+=100){c.fillStyle=(Math.floor(x/100)%2)?'#226c45':'#287b4e';c.fillRect(x,100,100,370);c.strokeStyle='#d7e5c9b8';c.lineWidth=3;c.beginPath();c.moveTo(x,100);c.lineTo(x,470);c.stroke()}
 for(let i=0;i<12;i++){let x=(i*90+t*58)%1060-50;c.fillStyle='#f4f1db';c.fillRect(x,215,3,22);c.fillRect(x,350,3,22)}
 c.fillStyle='#ffffff35';c.fillRect(0,98,960,4);c.fillRect(0,470,960,4);
 for(let y=0;y<540;y+=5){c.fillStyle='#00000012';c.fillRect(0,y,960,1)}
}
function player(c,x,y,uniform,step,dir=1,lean=0){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir,1);c.rotate(lean);
 const swing=Math.sin(step)*13;
 c.fillStyle='#07101c88';c.fillRect(-19,45,40,7);
 c.fillStyle='#131827';c.fillRect(-13,12,10,25+swing*.25);c.fillRect(6,12,10,25-swing*.25);
 c.fillStyle='#f7f7f7';c.fillRect(-14,31+swing*.25,12,9);c.fillRect(6,31-swing*.25,12,9);
 c.fillStyle='#111';c.fillRect(-17,39+swing*.25,16,7);c.fillRect(5,39-swing*.25,17,7);
 c.fillStyle=uniform;c.fillRect(-21,-20,42,37);c.fillStyle='#fff';c.fillRect(-4,-14,8,17);
 c.fillStyle='#f2bd88';c.fillRect(-29,-13,10,25+swing*.25);c.fillRect(19,-13,10,25-swing*.25);
 c.fillStyle=uniform;c.fillRect(-18,-41,36,22);c.fillStyle='#fff';c.fillRect(-18,-31,36,5);
 c.fillStyle='#0c1b2a';c.fillRect(9,-34,13,5);c.fillRect(-15,-45,30,4);
 c.restore();
}
function sparks(c,x,y){for(let i=0;i<36;i++){let a=i*Math.PI*2/36,r=14+Math.random()*100;c.fillStyle=i%3===0?'#fff':i%2?'#ffcf53':'#ed5b42';c.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,7,7)}}
function renderIntro(now){
 const t=(now-introStart)/1000;ctx.save();field(ctx,t);
 const approach=Math.min(1,Math.max(0,(t-2)/2)),hit=t>=4.25;
 let rx=hit?480:200+Math.min(t,4.25)*64,dx=hit?516:1040-approach*520;
 if(t>2.6&&t<4.25)rx+=Math.sin(t*10)*11;
 if(hit){shake=t<4.75?12:0;ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake)}
 if(t<5.1){player(ctx,rx,290,'#bb3434',t*17,1,hit?-.8:0);if(t>2)player(ctx,dx,290,'#275ab6',t*19,-1,hit?.6:0);
 if(t<4.25){ctx.fillStyle='#ad8d56';ctx.fillRect(rx+27,269,15,10);for(let i=0;i<5;i++){ctx.fillStyle='#a6cc6b';ctx.fillRect(rx-24-i*16,337+Math.sin(t*12+i)*9,5,5)}}
 else{ctx.fillStyle='#bb793b';ctx.fillRect(470+(t-4.25)*100,220-(t-4.25)*110,16,9);if(!impact){impact=true;tone(75,.3,'sawtooth',.18);setTimeout(()=>tone(380,.35,'square',.06),150)}if(t<4.65)sparks(ctx,495,278)}
 }
 ctx.restore();
 if(t>=4.25){$('introOverlay').hidden=false;if(t>=7.2&&mode==='intro')showMenu()}
 if(t<4.25)$('introOverlay').hidden=true;
}
function showMenu(){mode='menu';intro.hidden=true;menu.hidden=false;setup.hidden=true;game.hidden=true}
function showSetup(){mode='setup';intro.hidden=true;menu.hidden=true;setup.hidden=false;game.hidden=true}
function replay(){mode='intro';impact=false;introStart=performance.now();intro.hidden=false;menu.hidden=true;setup.hidden=true;$('introOverlay').hidden=true}
$('skipIntro').onclick=showMenu;$('enterMenu').onclick=showMenu;$('menuQuick').onclick=showSetup;$('menuReplay').onclick=replay;
$('menuSettings').onclick=()=>{const d=$('settingsDialog');if(!d.open)d.showModal()};
$('menuHelp').onclick=()=>alert('QUICK PLAY: Pick teams and press Kick Off. Select a play, press Enter to snap. WASD/Arrows move, Shift sprint, 1–5 pass, E switch defenders, Space tackle, Tab playbook, P pause.');
$('restart').addEventListener('click',()=>{mode='menu';setup.hidden=true;game.hidden=true;menu.hidden=false});
window.addEventListener('keydown',e=>{if(mode==='intro'&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();showMenu()}else if(mode==='menu'&&e.code==='Enter'){e.preventDefault();showSetup()}},true);
function frame(now){if(mode==='intro')renderIntro(now);if(mode==='menu')field(bg,now/1000);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
})();
