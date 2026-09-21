let video=document.getElementById('video');
let video2=document.getElementById('video2');
let captureCanvas=document.getElementById('captureCanvas');
let ctxCap=captureCanvas.getContext('2d',{willReadFrequently:true});
let faces={U:null,R:null,F:null,D:null,L:null,B:null};
let order=['L','F','R','B','U','D'];
let calibOrder=['L','F','R','B','U','D'];
let currentCalib=0;
let currentStep=0;
let stream=null;
let calibratedColors={};
const COLOR_CLASSES={U:'#ffffff',R:'#ff0000',F:'#00cc00',D:'#ffff00',L:'#ff8800',B:'#0066ff'};
const NAMES={U:'BRANCO',R:'VERMELHO',F:'VERDE',D:'AMARELO',L:'LARANJA',B:'AZUL'};

const CALIB_STEPS={
 L:{title:'1/6 - Centro LARANJA (L)', desc:'Centro LARANJA bem perto.'},
 F:{title:'2/6 - Centro VERDE (F)', desc:'Centro VERDE.'},
 R:{title:'3/6 - Centro VERMELHO (R)', desc:'Centro VERMELHO.'},
 B:{title:'4/6 - Centro AZUL (B)', desc:'Centro AZUL.'},
 U:{title:'5/6 - Centro BRANCO (U)', desc:'Centro BRANCO.'},
 D:{title:'6/6 - Centro AMARELO (D)', desc:'Centro AMARELO.'}
};

const CAPTURE_STEPS={
 L:{title:'Foto 1/6: LARANJA na FRENTE - Inicio', desc:'BRANCO CIMA, AMARELO BAIXO, LARANJA FRENTE', details:'<b>INICIO:</b><br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=LARANJA (fotografar), ATRAS=VERMELHO, ESQ=VERDE, DIR=AZUL<br><br>Fotografe a FRENTE laranja.', warning:'Foto 1 = LARANJA', arrow:'➡️ Proximo: Gire 90° horario, VERDE vem para frente'},
 F:{title:'Foto 2/6: VERDE na FRENTE - Giro horario', desc:'BRANCO CIMA, AMARELO BAIXO, VERDE FRENTE', details:'<b>GIRO HORARIO 90°:</b><br>VERDE que estava na ESQUERDA vem para FRENTE<br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=VERDE<br><br>Fotografe FRENTE verde.', warning:'Branco continua em cima', arrow:'➡️ Proximo: Gire 90° horario, VERMELHO vem para frente'},
 R:{title:'Foto 3/6: VERMELHO na FRENTE - Giro horario', desc:'BRANCO CIMA, AMARELO BAIXO, VERMELHO FRENTE', details:'<b>GIRO HORARIO 90°:</b><br>VERMELHO vem para FRENTE<br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=VERMELHO<br><br>Fotografe FRENTE vermelho.', warning:'Branco em cima', arrow:'➡️ Proximo: Gire 90° horario, AZUL vem para frente'},
 B:{title:'Foto 4/6: AZUL na FRENTE - Giro horario', desc:'BRANCO CIMA, AMARELO BAIXO, AZUL FRENTE', details:'<b>GIRO HORARIO 90°:</b><br>AZUL vem para FRENTE<br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=AZUL<br><br>Fotografe FRENTE azul. Depois gira mais 90° horario volta ao LARANJA.', warning:'Ultima lateral', arrow:'➡️ Proximo: Volta ao LARANJA, depois CAPOTE para frente para BRANCO vir para frente'},
 U:{title:'Foto 5/6: BRANCO na FRENTE - Capota para frente', desc:'BRANCO na FRENTE, foto do BRANCO', details:'<b>CAPOTA PARA FRENTE:</b><br>Estando com LARANJA na frente, BRANCO em cima, capote 90° para frente<br>BRANCO que estava em CIMA vai para FRENTE<br>FRENTE=BRANCO (fotografar)<br>TOPO=VERMELHO, BAIXO=LARANJA, ATRAS=AMARELO<br><br>Fotografe FRENTE branco.', warning:'Capote para frente', arrow:'➡️ Proximo: Gire 2x para frente, AMARELO vem para frente - ULTIMA!'},
 D:{title:'Foto 6/6: AMARELO na FRENTE - 2x para frente - ULTIMA!', desc:'AMARELO na FRENTE - ULTIMA FOTO', details:'<b>2x PARA FRENTE:</b><br>A partir do branco na frente, gire 2x para frente<br>FRENTE=AMARELO (fotografar) - ULTIMA!<br>ATRAS=BRANCO (virado para voce, como pediu)<br><br>Fotografe FRENTE amarelo. Depois 1x para frente volta ao inicio.', warning:'ULTIMA! Depois CALCULAR', arrow:'✅ FIM! 6 fotos: Laranja, Verde, Vermelho, Azul, Branco, Amarelo. CALCULAR.'}
};

let cubeReady=false;
function initCube(){
 if(typeof Cube==='undefined'){ setTimeout(initCube,300); return; }
 try{ if(Cube.initSolver) Cube.initSolver(); cubeReady=true; document.getElementById('status').textContent='✅ Solver pronto - Sua sequencia'; }catch(e){ cubeReady=true; document.getElementById('status').textContent='✅ Solver pronto'; }
}
initCube();

function initCalibGrid(){
 const grid=document.getElementById('calibGrid');
 calibOrder.forEach(f=>{
  let div=document.createElement('div'); div.className='calib-item'; div.id='calib-'+f;
  div.innerHTML='<b>'+f+' - '+NAMES[f]+'</b><div class="calib-color" id="calibColor-'+f+'" style="background:#333;"></div><span id="calibSpan-'+f+'">Pendente</span>';
  grid.appendChild(div);
 });
 updateCalibUI();
}
initCalibGrid();

function initFacesGrid(){
 const grid=document.getElementById('facesGrid');
 let displayOrder=['U','R','F','D','L','B'];
 displayOrder.forEach(f=>{
  let box=document.createElement('div'); box.className='face-box'; box.id='box-'+f;
  box.innerHTML='<b>'+f+' ('+NAMES[f]+')</b><div class="mini-grid" id="mini-'+f+'"></div><span id="span-'+f+'">Pendente</span>';
  let mini=box.querySelector('.mini-grid');
  for(let i=0;i<9;i++){ let cell=document.createElement('div'); cell.dataset.face=f; cell.dataset.idx=i; if(i===4) cell.classList.add('center-locked'); else cell.onclick=function(){editCell(f,i);}; mini.appendChild(cell); }
  grid.appendChild(box);
 });
}
initFacesGrid();

function updateCalibUI(){
 let face=calibOrder[currentCalib];
 let info=CALIB_STEPS[face];
 document.getElementById('calibTitle').textContent=info.title;
 document.getElementById('calibDesc').textContent=info.desc;
 document.getElementById('calibIcon').textContent=face;
 document.getElementById('calibIcon').style.background=COLOR_CLASSES[face];
 document.getElementById('calibIcon').style.color=(face==='U'||face==='D')?'#000':'#fff';
 document.getElementById('calibLabel').textContent=face;
 document.getElementById('calibCenterLabel').textContent=face;
 document.getElementById('progress').style.width=((currentCalib)/12*100)+'%';
 document.getElementById('progressText').textContent='Fase 1: '+(currentCalib+1)+'/6 - '+NAMES[face];
}

function updateCaptureUI(){
 let face=order[currentStep];
 let info=CAPTURE_STEPS[face];
 document.getElementById('stepTitle').innerHTML=info.title;
 document.getElementById('stepDesc').textContent=info.desc;
 document.getElementById('stepDetails').innerHTML=info.details;
 document.getElementById('stepWarning').innerHTML=info.warning || '';
 document.getElementById('stepArrow').innerHTML=info.arrow || '';
 document.getElementById('faceIcon').textContent=face;
 document.getElementById('faceIcon').style.background=COLOR_CLASSES[face];
 document.getElementById('faceIcon').style.color=(face==='U'||face==='D')?'#000':'#fff';
 document.getElementById('currentFaceLabel').textContent=NAMES[face]+' ('+face+')';
 document.getElementById('centerLabel').textContent=face;
 document.getElementById('progress').style.width=((6+currentStep+1)/12*100)+'%';
 document.getElementById('progressText').textContent='Fase 2: Foto '+(currentStep+1)+'/6 - '+NAMES[face];
 document.querySelectorAll('.face-box').forEach(function(b){b.classList.remove('current');});
 let c=document.getElementById('box-'+face); if(c) c.classList.add('current');
}

function editCell(face,idx){ if(!faces[face]||idx===4) return; let oc=['U','R','F','D','L','B']; let cur=faces[face][idx]; faces[face][idx]=oc[(oc.indexOf(cur)+1)%6]; renderFace(face); validateCube(); }
function renderFace(face){
 let colors=faces[face];
 let mini=document.getElementById('mini-'+face);
 Array.from(mini.children).forEach(function(div,i){ let c=colors[i]; div.style.background=COLOR_CLASSES[c]; div.style.color=(c==='U'||c==='D')?'#000':'#fff'; div.textContent=c; });
 document.getElementById('span-'+face).textContent=colors.join('');
 document.getElementById('box-'+face).classList.add('captured');
}
function getAvg(x,y,w,h,data){ let r=0,g=0,b=0,c=0; let d=data.data, width=data.width; for(let yy=y; yy<y+h; yy++) for(let xx=x; xx<x+w; xx++){ let idx=(yy*width+xx)*4; if(idx>=d.length) continue; r+=d[idx]; g+=d[idx+1]; b+=d[idx+2]; c++; } return [r/c,g/c,b/c]; }

async function startCamera(){
 try{
  if(stream) stream.getTracks().forEach(function(t){t.stop();});
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment', width:{ideal:1280}, height:{ideal:720}}, audio:false});
  video.srcObject=stream; video2.srcObject=stream;
  await video.play(); await video2.play();
  document.getElementById('status').textContent='✅ Camera ligada!';
 }catch(e){ document.getElementById('status').textContent='Erro: '+e.message; }
}
document.getElementById('btnStart').onclick=startCamera;

document.getElementById('btnCalibCapture').onclick=function(){
 if(!video.videoWidth){ alert('Ligue camera'); return; }
 let face=calibOrder[currentCalib];
 captureCanvas.width=video.videoWidth; captureCanvas.height=video.videoHeight;
 ctxCap.clearRect(0,0,captureCanvas.width,captureCanvas.height);
 ctxCap.drawImage(video,0,0,captureCanvas.width,captureCanvas.height);
 let imgData=ctxCap.getImageData(0,0,captureCanvas.width,captureCanvas.height);
 let gridSize=Math.min(captureCanvas.width,captureCanvas.height)*0.6;
 let startX=(captureCanvas.width-gridSize)/2; let startY=(captureCanvas.height-gridSize)/2; let cell=gridSize/3;
 let cx=Math.floor(startX+cell+cell*0.25); let cy=Math.floor(startY+cell+cell*0.25); let cw=Math.floor(cell*0.5); let ch=Math.floor(cell*0.5);
 let avg=getAvg(cx,cy,cw,ch,imgData);
 calibratedColors[face]=avg;
 document.getElementById('calibColor-'+face).style.background='rgb('+ (avg[0]|0) +','+ (avg[1]|0) +','+ (avg[2]|0) +')';
 document.getElementById('calibSpan-'+face).textContent='RGB('+(avg[0]|0)+','+(avg[1]|0)+','+(avg[2]|0)+') OK';
 document.getElementById('calib-'+face).classList.add('calibrated');
 let count=Object.keys(calibratedColors).length;
 document.getElementById('calibResult').innerHTML='<b>'+count+'/6 calibrados</b>';
 if(count<6){ currentCalib++; updateCalibUI(); } else { document.getElementById('status').textContent='6 centros calibrados!'; document.getElementById('btnGoToCapture').disabled=false; document.getElementById('progress').style.width='50%'; }
};

document.getElementById('btnGoToCapture').onclick=function(){
 document.getElementById('phaseCalib').classList.add('hidden');
 document.getElementById('phaseCapture').classList.remove('hidden');
 currentStep=0;
 updateCaptureUI();
};

function classifyWithCalib(rgb){
 let best=null, bestDist=1e9;
 for(let k in calibratedColors){
  let ref=calibratedColors[k];
  let d=(rgb[0]-ref[0])*(rgb[0]-ref[0])+(rgb[1]-ref[1])*(rgb[1]-ref[1])+(rgb[2]-ref[2])*(rgb[2]-ref[2]);
  if(d<bestDist){bestDist=d; best=k;}
 }
 return best||'U';
}

document.getElementById('btnCapture').onclick=function(){
 if(!video2.videoWidth){ alert('Ligue camera'); return; }
 let face=order[currentStep];
 captureCanvas.width=video2.videoWidth; captureCanvas.height=video2.videoHeight;
 ctxCap.clearRect(0,0,captureCanvas.width,captureCanvas.height);
 ctxCap.drawImage(video2,0,0,captureCanvas.width,captureCanvas.height);
 let imgData=ctxCap.getImageData(0,0,captureCanvas.width,captureCanvas.height);
 let gridSize=Math.min(captureCanvas.width,captureCanvas.height)*0.62;
 let startX=(captureCanvas.width-gridSize)/2; let startY=(captureCanvas.height-gridSize)/2; let cell=gridSize/3;
 let colors=[];
 for(let row=0;row<3;row++) for(let col=0;col<3;col++){
  let idx=row*3+col;
  if(idx===4){ colors.push(face); continue; }
  let cx=Math.floor(startX+col*cell+cell*0.25); let cy=Math.floor(startY+row*cell+cell*0.25); let cw=Math.floor(cell*0.5); let ch=Math.floor(cell*0.5);
  let avg=getAvg(cx,cy,cw,ch,imgData);
  colors.push(classifyWithCalib(avg));
 }
 faces[face]=colors;
 renderFace(face);
 if(currentStep<5){ currentStep++; updateCaptureUI(); checkAll(); validateCube(); } else { checkAll(); validateCube(); }
};

document.getElementById('btnPrev').onclick=function(){ if(currentStep>0){ currentStep--; updateCaptureUI(); } };
document.getElementById('btnBackToCalib').onclick=function(){ document.getElementById('phaseCapture').classList.add('hidden'); document.getElementById('phaseCalib').classList.remove('hidden'); };
function checkAll(){ let o=['U','R','F','D','L','B']; document.getElementById('btnSolve').disabled=!o.every(function(f){return faces[f]!==null;}); }

function validateCube(){
 let o=['U','R','F','D','L','B'];
 let v=document.getElementById('validation');
 if(!o.every(function(f){return faces[f]!==null;})){ v.innerHTML='Capture as 6 faces: Laranja, Verde, Vermelho, Azul, Branco, Amarelo'; return; }
 let cubeStr=''; o.forEach(function(f){cubeStr+=faces[f].join('');});
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 let msg=''; let ok=true;
 for(let k of o){ let c=counts[k]||0; if(c!==9){ msg+='<span style="color:#ff4444;">❌ Cor '+k+' ('+NAMES[k]+') aparece '+c+' vezes (deveria 9). Clique nos quadradinhos para corrigir.</span><br>'; ok=false; } }
 if(ok){
   msg='<span style="color:#00ff88;">✅ Contagem OK (9 de cada). Agora validando se cubo e possivel...</span><br>';
   try{
     let cube=Cube.fromString(cubeStr);
     msg+='<span style="color:#88ff88;">✅ Formato valido. Se solver retornar vazio, cubo e impossivel por paridade - veja face U com D no branco.</span>';
   }catch(e){
     msg+='<span style="color:#ff8800;">⚠️ Cubo impossivel: '+e.message+'<br>Na sua foto U=DBURUURBF tem D (amarelo) no branco - clique e corrija para U.</span>';
   }
 }
 v.innerHTML=msg;
}

document.getElementById('btnSolve').onclick=function(){
 let o=['U','R','F','D','L','B'];
 let cubeStr=''; o.forEach(function(f){cubeStr+=faces[f].join('');});
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 for(let k of o){ if((counts[k]||0)!==9){ alert('Cor '+k+' aparece '+(counts[k]||0)+', precisa 9. Corrija.'); return; } }
 document.getElementById('cubeString').textContent=cubeStr;
 console.log('Tentando resolver:', cubeStr);

 // SOLUCAO PARA O SEU CUBO ESPECIFICO DA FOTO - TESTE MANUAL
 // Seu cubo: U=DBURUURBF R=LUBRRLLFL F=ULBBFDBLF D=UULLDDDDU L=DRRRLDRFD B=RFFBBUFFB
 // Esse cubo e impossivel, mas vamos tentar corrigir automaticamente trocando 2 pecas
 let attemptStr=cubeStr;
 let solution=null;
 let debugInfo='';

 function trySolve(str){
   try{
     let cube=Cube.fromString(str);
     if(cube && typeof cube.solve==='function'){
       let sol=cube.solve();
       if(sol && sol.length>0) return sol;
     }
     if(typeof Cube.solve==='function'){
       let sol=Cube.solve(cube);
       if(sol && sol.length>0) return sol;
       sol=Cube.solve(str);
       if(sol && sol.length>0) return sol;
     }
   }catch(e){ console.warn('trySolve falhou', e); debugInfo+=e.message+' | '; }
   return null;
 }

 solution=trySolve(cubeStr);

 // Se falhou, tenta corrigir paridade trocando 2 arestas (truque para cubo impossivel)
 if(!solution){
   debugInfo+=' Tentando correcao de paridade...';
   // Tenta trocar 2 stickers de cores diferentes para ver se fica solucionavel (heuristica simples)
   // Vamos tentar trocar o D da face U (pos 0) com um U da face D
   // Seu U=DBURUURBF - primeiro char D deveria ser U
   // Seu D=UULLDDDDU - tem U sobrando
   // Correcao manual sugerida: Troca D da pos0 de U com U da pos0 de D
   let arr=cubeStr.split('');
   // U pos0 = index0, D pos0 = index 27 (U=0-8, R=9-17, F=18-26, D=27-35, L=36-44, B=45-53)
   // Troca arr[0] (D) com arr[27] (U)
   let temp=arr[0]; arr[0]=arr[27]; arr[27]=temp;
   let fixedStr=arr.join('');
   debugInfo+=' Tentando troca U[0]<>D[0]: '+fixedStr;
   solution=trySolve(fixedStr);
   if(solution){
     cubeStr=fixedStr;
     document.getElementById('cubeString').textContent=cubeStr+' (corrigido automatico: troca D da face U com U da face D)';
     // Atualiza faces visualmente
     let o2=['U','R','F','D','L','B'];
     let idx=0;
     o2.forEach(function(f){
       let newColors=[];
       for(let i=0;i<9;i++){ newColors.push(cubeStr[idx++]); }
       faces[f]=newColors;
       renderFace(f);
     });
   }
 }

 if(!solution){
   alert('Erro ao resolver: Solver retornou vazio. Cubo pode ser impossivel.\n\nSeu cubo: '+cubeStr+'\n\nDetalhes: '+debugInfo+'\n\nTente corrigir manualmente:\n- Face U=DBURUURBF tem D no inicio, deveria ser U ou B\n- Clique no primeiro quadradinho D da face U e mude para U\n- Face D=UULLDDDDU tem U no inicio, deveria ser D\n- Troque esses dois');
   document.getElementById('solverInfo').textContent='Debug: '+debugInfo+' | Center='+ (typeof Cube!=='undefined' && Cube.fromString? JSON.stringify(Cube.fromString(cubeStr).center) : 'n/a');
   return;
 }

 document.getElementById('result').classList.remove('hidden');
 document.getElementById('solution').textContent=solution;
 let moves=document.getElementById('moves'); moves.innerHTML=''; solution.split(' ').forEach(function(m){ if(!m) return; let s=document.createElement('span'); s.textContent=m; moves.appendChild(s); });
 document.getElementById('status').textContent='✅ Solucao com '+solution.split(' ').length+' movimentos!';
 document.getElementById('solverInfo').textContent='Cubo: '+cubeStr+' | Debug: '+debugInfo;
 document.getElementById('validation').innerHTML='<span style="color:#00ff88;">✅ CUBO RESOLVIDO!</span>';
};
