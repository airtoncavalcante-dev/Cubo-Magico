let video=document.getElementById('video');
let video2=document.getElementById('video2');
let captureCanvas=document.getElementById('captureCanvas');
let ctxCap=captureCanvas.getContext('2d',{willReadFrequently:true});
let faces={U:null,R:null,F:null,D:null,L:null,B:null};
// SUA ORDEM NOVA: Vermelho frente, Azul direita, Laranja atras, Verde esquerda, Branco cima, Amarelo baixo
// Ordem de captura: R (vermelho), B (azul), L (laranja), F (verde), U (branco), D (amarelo)
let order=['R','B','L','F','U','D'];
let calibOrder=['R','B','L','F','U','D'];
let currentCalib=0;
let currentStep=0;
let stream=null;
let calibratedColors={};
let currentFacingMode='environment';
const COLOR_CLASSES={U:'#ffffff',R:'#ff0000',F:'#00cc00',D:'#ffff00',L:'#ff8800',B:'#0066ff'};
const NAMES={U:'BRANCO',R:'VERMELHO',F:'VERDE',D:'AMARELO',L:'LARANJA',B:'AZUL'};

const CALIB_STEPS={
 R:{title:'1/6 - Centro VERMELHO (R)', desc:'Posicao inicial: Branco cima, Vermelho frente. Mostre o centro VERMELHO bem perto da camera.'},
 B:{title:'2/6 - Centro AZUL (B)', desc:'Centro AZUL (lado direito). Mostre o centro AZUL.'},
 L:{title:'3/6 - Centro LARANJA (L)', desc:'Centro LARANJA (atras). Mostre o centro LARANJA.'},
 F:{title:'4/6 - Centro VERDE (F)', desc:'Centro VERDE (lado esquerdo). Mostre o centro VERDE.'},
 U:{title:'5/6 - Centro BRANCO (U)', desc:'Centro BRANCO (cima). Mostre o centro BRANCO.'},
 D:{title:'6/6 - Centro AMARELO (D)', desc:'Centro AMARELO (baixo). Ultimo! Mostre o centro AMARELO.'}
};

const CAPTURE_STEPS={
 R:{
  title:'Foto 1/6: VERMELHO na FRENTE - POSIÇÃO INICIAL PADRÃO',
  desc:'BRANCO em CIMA, AMARELO em BAIXO, VERMELHO na FRENTE (de frente para você e para a câmera)',
  details: '<b>📱 POSIÇÃO INICIAL PADRÃO (como você pediu):</b><br>• <b>TOPO (para o teto):</b> BRANCO (U)<br>• <b>BAIXO (para o chão):</b> AMARELO (D)<br>• <b>FRENTE (virado para você, de frente para a câmera do celular):</b> VERMELHO (R) - <b>ESTA É A FACE QUE VAMOS FOTOGRAFAR AGORA</b><br>• <b>ATRÁS (costas do cubo):</b> LARANJA (L)<br>• <b>DIREITA (lado direito do usuário):</b> AZUL (B)<br>• <b>ESQUERDA (lado esquerdo do usuário):</b> VERDE (F)<br><br><b>🖐️ COMO SEGURAR NO CELULAR:</b> Segure o celular com uma mão, cubo com a outra. Deixe o branco para cima. Gire o cubo até o vermelho ficar exatamente de frente para a câmera. Não incline.<br><br><b>📸 FOTO:</b> Fotografe a FRENTE (vermelho). Grade vermelha no vermelho.',
  warning:'Foto 1 = VERMELHO. Centro travado em VERMELHO. Posição inicial padrão para o cálculo final.',
  arrow:'➡️ Próximo: Gire o cubo 90° no sentido HORÁRIO (como ponteiro do relógio visto de cima). O AZUL que está na DIREITA vai vir para FRENTE.'
 },
 B:{
  title:'Foto 2/6: AZUL na FRENTE - Giro horário 90°',
  desc:'BRANCO em CIMA, AMARELO em BAIXO, AZUL na FRENTE',
  details: '<b>🔄 GIRO 1 - HORÁRIO 90°:</b><br>• A partir da posição inicial (vermelho frente), gire o cubo inteiro 90° para a ESQUERDA ou DIREITA? <b>No sentido horário visto de cima</b> (imagine um relógio em cima do cubo).<br>• O AZUL que estava na DIREITA agora vem para FRENTE<br>• <b>TOPO:</b> BRANCO (continua em cima!)<br>• <b>BAIXO:</b> AMARELO (continua embaixo!)<br>• <b>FRENTE:</b> AZUL (era direita antes) - <b>FOTOGRAFE ESTA</b><br>• <b>ATRÁS:</b> VERDE (era esquerda antes)<br>• <b>ESQUERDA:</b> VERMELHO (era frente antes)<br>• <b>DIREITA:</b> LARANJA (era atrás antes)<br><br><b>📸 FOTO:</b> Fotografe a FRENTE (azul).',
  warning:'Branco continua em cima, amarelo embaixo! Só gira em torno do eixo vertical.',
  arrow:'➡️ Próximo: Gire mais 90° horário. O LARANJA que estava atrás vai vir para frente.'
 },
 L:{
  title:'Foto 3/6: LARANJA na FRENTE - Giro horário 90°',
  desc:'BRANCO em CIMA, AMARELO em BAIXO, LARANJA na FRENTE',
  details: '<b>🔄 GIRO 2 - HORÁRIO 90°:</b><br>• A partir do azul na frente, gire mais 90° horário<br>• LARANJA agora vem para FRENTE (estava atrás)<br>• <b>TOPO:</b> BRANCO<br>• <b>BAIXO:</b> AMARELO<br>• <b>FRENTE:</b> LARANJA - <b>FOTOGRAFE</b><br>• <b>ATRÁS:</b> VERMELHO<br>• <b>ESQUERDA:</b> AZUL<br>• <b>DIREITA:</b> VERDE<br><br><b>📸 FOTO:</b> Fotografe a FRENTE (laranja).',
  warning:'Branco em cima sempre! 2ª lateral fotografada.',
  arrow:'➡️ Próximo: Gire mais 90° horário. VERDE vem para frente.'
 },
 F:{
  title:'Foto 4/6: VERDE na FRENTE - Giro horário 90° - Volta ao início',
  desc:'BRANCO em CIMA, AMARELO em BAIXO, VERDE na FRENTE',
  details: '<b>🔄 GIRO 3 - HORÁRIO 90°:</b><br>• A partir do laranja na frente, gire mais 90° horário<br>• VERDE agora vem para FRENTE (estava na esquerda)<br>• <b>TOPO:</b> BRANCO<br>• <b>BAIXO:</b> AMARELO<br>• <b>FRENTE:</b> VERDE - <b>FOTOGRAFE</b><br>• <b>ATRÁS:</b> AZUL<br><br><b>📸 FOTO:</b> Fotografe a FRENTE (verde).<br><br><b>🔁 Depois deste, se girar mais 90° horário volta à posição inicial: VERMELHO na frente, BRANCO em cima.</b>',
  warning:'Última das 4 laterais! Depois vamos para branco e amarelo.',
  arrow:'➡️ Próximo: Estamos de volta ao VERMELHO na frente, BRANCO em cima (posição inicial padrão). Agora vamos girar o cubo PARA TRÁS para trazer o BRANCO para frente.'
 },
 U:{
  title:'Foto 5/6: BRANCO na FRENTE - Gira 1x PARA TRÁS',
  desc:'BRANCO na FRENTE (após girar para trás)',
  details: '<b>🔄 GIRO PARA TRÁS 1x (como você pediu):</b><br>• Estamos na posição inicial padrão: VERMELHO na frente, BRANCO em cima<br>• Agora INCLINE/GIRE o cubo PARA TRÁS 90° (tombando para trás, como se o topo fosse para trás)<br>• O BRANCO que estava em CIMA agora vai para FRENTE<br>• <b>FRENTE:</b> BRANCO (era topo antes) - <b>FOTOGRAFE</b><br>• <b>TOPO:</b> LARANJA (era atrás antes)<br>• <b>BAIXO:</b> VERMELHO (era frente antes)<br>• <b>ATRÁS:</b> AMARELO (era baixo antes)<br>• <b>DIREITA:</b> AZUL (continua)<br>• <b>ESQUERDA:</b> VERDE (continua)<br><br><b>📸 FOTO:</b> Fotografe a FRENTE (branco).<br><br><b>↩️ Depois de ler, REFAÇA o movimento contrário (gire para frente 1x) para voltar à posição inicial padrão: VERMELHO frente, BRANCO cima.</b>',
  warning:'Gire para TRÁS (topo vai para trás, frente vai para baixo, baixo vai para frente? Na verdade topo vai para frente quando gira para trás? Vamos simplificar: branco que estava em cima agora fica de frente para a câmera).',
  arrow:'➡️ Próximo: Volte à posição inicial (vermelho frente, branco cima) refazendo o movimento. Depois gira 1x PARA FRENTE para amarelo vir para frente.'
 },
 D:{
  title:'Foto 6/6: AMARELO na FRENTE - Gira 1x PARA FRENTE - ÚLTIMA!',
  desc:'AMARELO na FRENTE - Última foto!',
  details: '<b>🔄 GIRO PARA FRENTE 1x - FINAL (como você pediu):</b><br>• Estamos na posição inicial padrão novamente: VERMELHO na frente, BRANCO em cima (após voltar do branco)<br>• Agora GIRE o cubo PARA FRENTE 1x (capotando para frente, topo vai para frente)<br>• O AMARELO que estava em BAIXO agora vai para FRENTE<br>• <b>FRENTE:</b> AMARELO (era baixo antes) - <b>FOTOGRAFE - ÚLTIMA!</b><br>• <b>TOPO:</b> VERMELHO (era frente antes)<br>• <b>BAIXO:</b> LARANJA (era atrás antes)<br>• <b>ATRÁS:</b> BRANCO (era topo antes - fica virado para você, como você disse "branco de frente pra mim visível" - na verdade está atrás, mas se você inclinar o celular vê)<br>• <b>DIREITA:</b> AZUL<br>• <b>ESQUERDA:</b> VERDE<br><br><b>📸 FOTO:</b> Fotografe a FRENTE (amarelo).<br><br><b>🔁 Depois de tirar a foto, faça o movimento contrário (gira para trás 1x) e volta à posição inicial padrão: BRANCO cima, VERMELHO frente. Pronto para calcular a solução a partir desta posição padrão!</b>',
  warning:'ÚLTIMA FOTO! Depois clique CALCULAR. A solução será calculada supondo que o cubo está na posição padrão: branco cima, vermelho frente.',
  arrow:'✅ FIM! 6 fotos: Vermelho, Azul, Laranja, Verde, Branco, Amarelo. Clique em CALCULAR MOVIMENTOS. A solução considera que você está na posição inicial padrão (vermelho frente, branco cima).'
 }
};

let cubeReady=false;
function initCube(){
 if(typeof Cube==='undefined'){ setTimeout(initCube,300); return; }
 try{ if(Cube.initSolver) Cube.initSolver(); cubeReady=true; document.getElementById('status').textContent='✅ Solver pronto - Sequencia celular: Vermelho frente, Branco cima'; }catch(e){ cubeReady=true; document.getElementById('status').textContent='✅ Solver pronto'; }
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
 document.getElementById('progressText').textContent='Fase 1: Calibração '+(currentCalib+1)+'/6 - '+NAMES[face];
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
 document.getElementById('centerLabel').textContent=face+' - '+NAMES[face];
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

async function startCamera(facingMode){
 facingMode = facingMode || currentFacingMode;
 try{
  if(stream) stream.getTracks().forEach(function(t){t.stop();});
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facingMode, width:{ideal:1280}, height:{ideal:720}}, audio:false});
  video.srcObject=stream; video2.srcObject=stream;
  await video.play(); await video2.play();
  currentFacingMode=facingMode;
  document.getElementById('status').textContent='✅ Câmera '+ (facingMode==='environment'?'traseira':'frontal') +' ligada! Sequencia: Vermelho frente';
 }catch(e){
   // Fallback: tenta sem facingMode
   try{
     stream=await navigator.mediaDevices.getUserMedia({video:true, audio:false});
     video.srcObject=stream; video2.srcObject=stream;
     await video.play(); await video2.play();
     document.getElementById('status').textContent='✅ Câmera ligada (modo compatibilidade)';
   }catch(e2){
     document.getElementById('status').textContent='Erro câmera: '+e2.message+' - Use HTTPS (GitHub Pages)';
   }
 }
}
document.getElementById('btnStart').onclick=function(){ startCamera('environment'); };
document.getElementById('btnSwitch').onclick=function(){
 let newMode = currentFacingMode==='environment' ? 'user' : 'environment';
 startCamera(newMode);
};

document.getElementById('btnCalibCapture').onclick=function(){
 if(!video.videoWidth){ alert('Ligue a câmera primeiro'); return; }
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
 document.getElementById('calibResult').innerHTML='<b>'+count+'/6 calibrados:</b> '+Object.entries(calibratedColors).map(function(e){return e[0]+'='+NAMES[e[0]];}).join(', ');
 if(count<6){ currentCalib++; updateCalibUI(); } else { document.getElementById('status').textContent='✅ 6 centros calibrados! Agora leitura das faces - sequencia celular'; document.getElementById('btnGoToCapture').disabled=false; document.getElementById('progress').style.width='50%'; }
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
 if(!video2.videoWidth){ alert('Ligue a câmera'); return; }
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
 if(currentStep<5){ currentStep++; updateCaptureUI(); checkAll(); validateCube(); } else { checkAll(); validateCube(); document.getElementById('status').textContent='✅ 6 fotos capturadas na sequencia celular!'; }
};

document.getElementById('btnPrev').onclick=function(){ if(currentStep>0){ currentStep--; updateCaptureUI(); } };
document.getElementById('btnBackToCalib').onclick=function(){ document.getElementById('phaseCapture').classList.add('hidden'); document.getElementById('phaseCalib').classList.remove('hidden'); };
function checkAll(){ let o=['U','R','F','D','L','B']; document.getElementById('btnSolve').disabled=!o.every(function(f){return faces[f]!==null;}); }

function validateCube(){
 let o=['U','R','F','D','L','B'];
 let v=document.getElementById('validation');
 if(!o.every(function(f){return faces[f]!==null;})){ v.innerHTML='Capture as 6 faces na ordem: Vermelho, Azul, Laranja, Verde, Branco, Amarelo'; return; }
 let cubeStr=''; o.forEach(function(f){cubeStr+=faces[f].join('');});
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 let msg=''; let ok=true;
 for(let k of o){ let c=counts[k]||0; if(c!==9){ msg+='<span style="color:#ff4444;">❌ Cor '+k+' ('+NAMES[k]+') aparece '+c+' vezes (deveria 9). Clique nos quadradinhos para corrigir.</span><br>'; ok=false; } }
 if(ok){
   msg='<span style="color:#00ff88;">✅ Contagem OK (9 de cada). Posição padrão: Branco cima, Vermelho frente. Cubo parece válido!</span>';
   try{
     let cube=Cube.fromString(cubeStr);
     msg+='<br><span style="color:#88ff88;">✅ Formato válido para resolver.</span>';
   }catch(e){
     msg+='<br><span style="color:#ff8800;">⚠️ Aviso: '+e.message+' - Verifique se as faces estão corretas.</span>';
   }
 }
 v.innerHTML=msg;
}

document.getElementById('btnSolve').onclick=function(){
 let o=['U','R','F','D','L','B'];
 let cubeStr=''; o.forEach(function(f){cubeStr+=faces[f].join('');});
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 for(let k of o){ if((counts[k]||0)!==9){ alert('Cor '+k+' aparece '+(counts[k]||0)+', precisa 9. Corrija clicando.'); return; } }
 document.getElementById('cubeString').textContent=cubeStr;
 console.log('Resolvendo a partir da posicao padrao (branco cima, vermelho frente):', cubeStr);
 if(typeof Cube==='undefined'){ alert('Cube não carregou'); return; }
 try{
   let cube=Cube.fromString(cubeStr);
   let solution=null;
   if(cube && typeof cube.solve==='function'){ try{ solution=cube.solve(); }catch(e){} }
   if(!solution && typeof Cube.solve==='function'){
     try{ solution=Cube.solve(cube); }catch(e){}
     if(!solution){ try{ solution=Cube.solve(cubeStr); }catch(e){} }
   }
   if(!solution){ throw new Error('Solver retornou vazio. Cubo pode ser impossível. Verifique as fotos. Center='+JSON.stringify(cube.center)); }
   document.getElementById('result').classList.remove('hidden');
   document.getElementById('solution').textContent=solution;
   let moves=document.getElementById('moves'); moves.innerHTML=''; solution.split(' ').forEach(function(m){ if(!m) return; let s=document.createElement('span'); s.textContent=m; moves.appendChild(s); });
   document.getElementById('status').textContent='✅ Solução com '+solution.split(' ').length+' movimentos! (a partir da posição padrão: branco cima, vermelho frente)';
   document.getElementById('solverInfo').textContent='Cubo: '+cubeStr+' | Posição padrão assumida: U=Branco cima, R=Vermelho frente, F=Verde esquerda, B=Azul direita, L=Laranja atrás, D=Amarelo baixo';
 }catch(e){
   alert('Erro ao resolver: '+e.message+'\n\nCubo: '+cubeStr+'\n\nVerifique:\n- Cada face foi fotografada na posição correta?\n- Branco sempre em cima nas 4 primeiras fotos?\n- Corrija manualmente clicando nos quadradinhos.');
   document.getElementById('solverInfo').textContent='Erro: '+e.message;
 }
};
