const TL_FRAMES = 96;
const TL_SOURCE = 'https://studiopartner.netflix.net/studio/subtitle-timing-guidelines';
const DRILLS = [
  {id:'audio-start',category:'Timing to audio',question:'Time this isolated subtitle to the audio.',instruction:'Set both edges using the waveform, then leave a natural reading tail.',audio:[[30,57]],cuts:[],initial:[24,68],ideal:[30,69],check:(s,e)=>audioInOk(s,30)&&e>=69&&e<=69&&e-s>=20,diagnose:audioStartDiagnosis,why:'The in-time should match the first audio frame or fall within the accepted 1–2-frame lead to keep the subtitle in sync. When there is no subtitle immediately after the event, extend the out-time by half a second (12 frames) after the audio ends to give viewers additional reading time.'},
  {id:'shot-start',category:'Shot change',question:'The audio begins just after the shot change.',instruction:'Time both edges to the shot change and the audio.',audio:[[32,60]],cuts:[24],initial:[32,70],ideal:[24,72],check:(s,e)=>s===24&&e===72&&e-s>=20,diagnose:shotStartDiagnosis,why:'When dialogue begins within half a second (12 frames) of a shot change, set the in-time to the first frame of the shot change instead of the first frame of audio.'},
  {id:'shot-end',category:'Shot change',question:'Tidy the subtitle before the shot change.',instruction:'The audio has ended. Fix the out-time.',audio:[[30,62]],cuts:[72],initial:[30,65],ideal:[30,70],check:(s,e)=>audioInOk(s,30)&&e===70&&e-s>=20,diagnose:shotEndDiagnosis,why:'If the dialogue ends before a shot change, set the out-time two frames before the shot change.'},
  {id:'minimum',waveSeed:4,category:'Minimum duration',question:'Time this isolated subtitle.',instruction:'Use the waveform and duration to set both edges.',audio:[[18,26]],cuts:[],initial:[18,33],ideal:[18,38],check:(s,e)=>audioInOk(s,30)&&e===69&&e-s>=20,diagnose:minimumDiagnosis,why:'The subtitle must last at least 20 frames. That minimum is mainly for one- or two-word subtitles; longer text should stay on screen longer when the audio and edit allow it.'},
  {id:'close-gap',waveSeed:9,category:'Gap between events',question:'Close the awkward little gap.',instruction:'There are 7 frames between subtitle A and subtitle B. Extend A to leave exactly a 2-frame gap.',audio:[[12,35],[42,70]],cuts:[],initial:[12,35],second:[42,82],ideal:[12,40],check:(s,e)=>audioInOk(s,26)&&55-e===2&&e-s>=20,diagnose:closeGapDiagnosis,why:'Start A on its first frame of audio at 00:00:16:02 or one or two frames before it. Close the seven-frame gap to two frames: B begins at 00:00:17:07, so A ends at 00:00:17:05.'},
  {id:'cross-in',waveSeed:15,category:'Dialogue across a shot change',question:'Audio begins just before the shot change.',instruction:'Set both edges: start 12 frames before the shot change (or on the new shot), then give the dialogue about half a second after it ends.',audio:[[34,66]],cuts:[40],initial:[34,73],ideal:[28,78],check:(s,e)=>(s===48||s===60)&&e>=89,diagnose:crossInDiagnosis,why:'When dialogue starts shortly before a shot change, either begin half a second before the cut or begin on the first frame of the new shot. This keeps the subtitle readable and aligned with the edit. When there is no subtitle immediately after the event, extend the out-time by half a second (12 frames) after the audio ends to give viewers additional reading time.'},
  {id:'cross-out',waveSeed:23,category:'Dialogue across a shot change',question:'The current out-time hangs just past the shot change.',instruction:'The audio crosses the shot change. Move the right edge to one of the two clean timing positions.',audio:[[16,52]],cuts:[48],initial:[16,53],ideal:[16,64],check:(s,e)=>audioInOk(s,44)&&(e===70||e>=84)&&e-s>=20,diagnose:crossOutDiagnosis,why:'When dialogue continues across a shot change, end either two frames before the cut or at least half a second after it, if reading speed allows. These choices keep the subtitle cleanly timed to both the audio and the edit.'}
];


// Revised drills derive grading and explanations from their displayed audio and cuts.
const REVISED_DRILLS = new Set(['minimum','close-gap','cross-in','cross-out']);
for(const d of DRILLS.filter(d=>REVISED_DRILLS.has(d.id))){
  d.check=(start,end)=>{const r=revisedAssessment(d,start,end);return r.inOk&&r.outOk&&r.durationOk};
  d.diagnose=(start,end)=>{const r=revisedAssessment(d,start,end);return r.inText+' '+r.outText+' '+r.durationText};
  if(d.id==='minimum')d.why='The subtitle must last at least 20 frames. This short audio lasts 8 frames; extending the out-time by 12 frames gives the subtitle a total duration of 20 frames when it starts on the first frame of audio.';
  if(d.id==='close-gap')d.why=`Start subtitle A on its first frame of audio at ${tc(d.audio[0][0])}, or within the accepted 1–2-frame lead. Subtitle B begins at ${tc(d.second[0])}; set the out-time of A to ${tc(d.second[0]-2)} to leave a two-frame gap.`;
  if(d.id==='cross-in'){
    d.instruction='Start 12 frames before the shot change or on the shot change, then extend the out-time by 12 frames after the audio ends.';
    d.why=`When dialogue begins shortly before a shot change, set the in-time to ${tc(d.cuts[0]-12)}, 12 frames before the shot change, or ${tc(d.cuts[0])}, on the shot change. Extend the out-time to ${tc(d.audio[0][1]+12)}, 12 frames after the audio ends.`;
  }
  if(d.id==='cross-out')d.why=`When dialogue continues across a shot change, end two frames before the shot change at ${tc(d.cuts[0]-2)}, or at least 12 frames after the shot change. For this drill, the later out-time can be ${tc(d.cuts[0]+12)}–${tc(d.audio[0][1]+12)}; this keeps the extension after audio within 12 frames.`;
}
function revisedAssessment(d,start,end){
  const [audioStart,audioEnd]=d.audio[0],cut=d.cuts[0],lead=audioStart-start;
  const duration=end-start;
  let inOk=audioInOk(start,audioStart),inText,outOk,outText;
  inText=start===audioStart?`The subtitle starts at ${tc(start)}, on the first frame of audio.`:inOk?`Setting the in-time to ${tc(start)} places the subtitle within the accepted 1–2-frame lead before the first frame of audio at ${tc(audioStart)}.`:`The subtitle starts at ${tc(start)}, which is ${Math.abs(lead)} frames ${lead>0?'before':'after'} the first frame of audio. Set the in-time to ${tc(audioStart-2)}–${tc(audioStart)}.`;
  if(d.id==='cross-in'){
    inOk=start===cut-12||start===cut;
    inText=inOk?`The subtitle starts at ${tc(start)}, ${start===cut?'aligning with the shot change':'12 frames before the shot change'}.`:`The subtitle starts at ${tc(start)}. Set the in-time to ${tc(cut-12)}, 12 frames before the shot change, or ${tc(cut)}, on the shot change.`;
  }
  const target=audioEnd+12,offset=end-audioEnd;
  outOk=end===target;
  outText=offset<0?`The subtitle ends at ${tc(end)}, ${-offset} frames before the audio ends at ${tc(audioEnd)}. Extend the out-time to ${tc(target)}.`:offset<12?`The subtitle remains on screen until ${tc(end)}, which is only ${offset} frames after the audio ends. Extend the out-time to ${tc(target)} to meet the recommended 12-frame extension.`:offset>12?`The subtitle remains on screen until ${tc(end)}, which is ${offset} frames after the audio ends, exceeding the recommended 12-frame extension by ${offset-12} frames. Set the out-time to ${tc(target)}.`:`Setting the out-time to ${tc(end)} keeps the subtitle on screen for 12 frames after the audio ends at ${tc(audioEnd)}.`;
  if(d.id==='close-gap'){
    const gap=d.second[0]-end;outOk=gap===2;
    outText=outOk?`The subtitle ends at ${tc(end)}, leaving a two-frame gap before subtitle B at ${tc(d.second[0])}.`:`The subtitle ends at ${tc(end)}, ${gap<0?'overlapping subtitle B by '+(-gap)+' frames':'leaving a '+gap+'-frame gap before subtitle B'}. Set the out-time to ${tc(d.second[0]-2)} to leave a two-frame gap.`;
  }
  if(d.id==='cross-out'){
    outOk=end===cut-2||(end>=cut+12&&end<=target);
    outText=outOk?(end===cut-2?`The subtitle ends at ${tc(end)}, two frames before the shot change.`:`The subtitle ends at ${tc(end)}, ${end-cut} frames after the shot change and ${offset} frames after the audio ends at ${tc(audioEnd)}.`):`The subtitle ends at ${tc(end)}. Set the out-time to ${tc(cut-2)}, two frames before the shot change, or ${tc(cut+12)}–${tc(target)}, at least 12 frames after the shot change without exceeding 12 frames after the audio ends.`;
  }
  return {inOk,inText,outOk,outText,durationOk:duration>=20,durationText:`${duration} frames (minimum: 20 frames).`};
}

function audioInOk(start,firstSound){return start>=firstSound-2&&start<=firstSound}

function audioStartDiagnosis(start,end){
  const difference=start-30;
  const placement=difference===0?'on the first frame of audio':`${Math.abs(difference)} frame${Math.abs(difference)===1?'':'s'} ${difference<0?'before':'after'} the first frame of audio`;
const outMessage=end<57?`Your out-time ${tc(end)} cuts off the audio.`:end<69?`The subtitle remains on screen until ${tc(end)}, which is only ${end-57} frames after the audio ends. Extend the out-time to 00:00:17:21 to meet the recommended 12-frame extension.`:end>69?`Your out-time ${tc(end)} is ${end-57} frames after audio ends; keep the extension to 12 frames or fewer.`:`Setting the out-time to ${tc(end)} keeps the subtitle on screen for 12 frames after the audio ends at ${tc(57)}.`;
  return `Your in-time ${tc(start)} is ${placement}. ${audioInOk(start,30)?'That is on or up to two frames before the first frame of audio.':'Start on the first frame of audio or one or two frames before it.'} ${outMessage} Duration: ${end-start} frames${end-start<20?' (below the 20-frame minimum).':'.'}`;
}

function timingFeedbackHeading(d,start,end){
  if(REVISED_DRILLS.has(d.id)){const r=revisedAssessment(d,start,end);return !r.inOk&&!r.outOk?'Check both edges.':!r.inOk?'Check the in-time.':!r.outOk?'Check the out-time.':!r.durationOk?'Check the duration.':'Nice timing.';}
  if(d.id==='shot-start'){
    const inOk=start===24,outOk=end===72;
    return !inOk&&!outOk?'Check both edges.':inOk?'Check the out-time.':'Check the in-time.';
  }
  if(d.id==='audio-start'){
    const inOk=audioInOk(start,30),outOk=end>=69&&end<=75;
    return !inOk&&!outOk?'Check both edges.':inOk?'Check the out-time.':'Check the in-time.';
  }
  if(d.id==='cross-in'){
    const inOk=start===48||start===60,outOk=end>=89;
    return !inOk&&!outOk?'Check both edges.':inOk?'Check the out-time.':'Check the in-time.';
  }
  if(d.id==='cross-out'){
    const inOk=audioInOk(start,44),outOk=end===70||end>=84;
    return !inOk&&!outOk?'Check both edges.':inOk?'Check the out-time.':'Check the in-time.';
  }
  if(['shot-end','minimum','close-gap'].includes(d.id)){
    const firstSound=d.id==='close-gap'?26:30;
    const inOk=audioInOk(start,firstSound);
    const outOk=d.id==='shot-end'?end===70:d.id==='minimum'?end===69:end===53;
    return !inOk&&!outOk?'Check both edges.':inOk?'Check the out-time.':'Check the in-time.';
  }
  if(end-start<20&&['shot-start','shot-end','close-gap','cross-out'].includes(d.id))return 'Check the duration.';
  return d.id==='shot-start'?'Check the in-time.':'Check the out-time.';
}

function crossInDiagnosis(start,end){
  const inMessage=start===48?`Your in-time ${tc(start)} is exactly 12 frames before the shot change. That part is right.`:start===60?`Your in-time ${tc(start)} is on the new shot. That part is right.`:`Your in-time ${tc(start)} is ${Math.abs(60-start)} frames ${start<60?'before':'after'} the shot change; use 00:00:17:00 (12 frames before) or 00:00:17:12 (on the shot change).`;
  const outMessage=end>=89?`Your out-time ${tc(end)} is ${end-77} frames after audio ends and ${end-60} frames after the shot change. That part is right.`:end>=77?`Your out-time ${tc(end)} is only ${end-77} frames after audio ends. Extend it to at least 00:00:18:17 for a half-second reading tail.`:`Your out-time ${tc(end)} comes before the audio ends at 00:00:18:05. Extend it to at least 00:00:18:17.`;
  return `${inMessage} ${outMessage}`;
}

function crossOutDiagnosis(start,end){
  const inMessage=audioInOk(start,44)?`Your in-time ${tc(start)} is on or up to two frames before the first frame of audio.`:`Your in-time ${tc(start)} is ${Math.abs(start-44)} frames ${start<44?'before':'after'} the first frame of audio; use 00:00:16:18 through 00:00:16:20.`;
  const outMessage=end===70||end>=84?`Your out-time ${tc(end)} fits a shot-change timing position.`:`Your out-time ${tc(end)} should be 00:00:17:22 (two frames before the shot change) or 00:00:18:12.`;
  return `${inMessage} ${outMessage}`;
}

function shotStartDiagnosis(start,end){
  const inMessage=start===24?`Your in-time ${tc(start)} starts on the shot change.`:`The subtitle starts at ${tc(start)}, ${Math.abs(start-24)} frames ${start<24?'before':'after'} the shot change. Adjust the in-time to 00:00:16:00 to align with the shot change.`;
  const outMessage=end<60?`Your out-time ${tc(end)} cuts off the audio.`:end<72?`The subtitle remains on screen until ${tc(end)}, which is only ${end-60} frames after the audio ends. Extend the out-time to 00:00:18:00 to meet the recommended 12-frame extension.`:end>78?`The subtitle remains on screen until ${tc(end)}, which is ${end-60} frames after the audio ends, exceeding the recommended 12-frame extension by ${end-72} frames.`:`Setting the out-time to ${tc(end)} keeps the subtitle on screen for ${end-60} frames after the audio ends at ${tc(60)}.`;
  return `${inMessage} ${outMessage}`;
}

function shotEndDiagnosis(start,end){
  const inMessage=audioInOk(start,30)?`Your in-time ${tc(start)} is on or up to two frames before the first frame of audio.`:`Your in-time ${tc(start)} is ${Math.abs(start-30)} frames ${start<30?'before':'after'} the first frame of audio; use 00:00:16:04 through 00:00:16:06.`;
  const outMessage=end===70?`Your out-time ${tc(end)} is two frames before the shot change.`:`The subtitle ends too early at ${tc(end)}. Set the out-time to 00:00:17:22, two frames before the shot change.`;
  return `${inMessage} ${outMessage}`;
}

function minimumDiagnosis(start,end){
  const inMessage=audioInOk(start,30)?`Your in-time ${tc(start)} is on or up to two frames before the first frame of audio.`:`Your in-time ${tc(start)} is ${Math.abs(start-30)} frames ${start<30?'before':'after'} the first frame of audio; use 00:00:16:04 through 00:00:16:06.`;
  const outMessage=end<57?`Your out-time ${tc(end)} cuts off audio.`:end<69?`The subtitle remains on screen until ${tc(end)}, which is only ${end-57} frames after the audio ends. Extend the out-time to 00:00:17:21 to meet the recommended 12-frame extension.`:end>69?`The subtitle remains on screen until ${tc(end)}, which is ${end-57} frames after the audio ends, exceeding the recommended 12-frame extension by ${end-69} frames.`:`Setting the out-time to ${tc(end)} keeps the subtitle on screen for 12 frames after the audio ends at 00:00:17:09.`;
  return `${inMessage} ${outMessage} Duration: ${end-start} frames${end-start<20?' (below the 20-frame minimum).':'.'}`;
}

function closeGapDiagnosis(start,end){
  const inMessage=audioInOk(start,26)?`Your in-time ${tc(start)} is on or up to two frames before A's first frame of audio.`:`Your in-time ${tc(start)} is ${Math.abs(start-26)} frames ${start<26?'before':'after'} A's first frame of audio; use 00:00:16:00 through 00:00:16:02.`;
  const gap=55-end;
  const outMessage=gap===2?`Your out-time ${tc(end)} leaves a two-frame gap to B.`:gap<0?`Your out-time ${tc(end)} overlaps B by ${-gap} frames; leave a two-frame gap.`:`Your out-time ${tc(end)} leaves a ${gap}-frame gap to B; make it two frames.`;
  return `${inMessage} ${outMessage}`;
}

function tlEdgeAssessment(d,start,end){
  if(REVISED_DRILLS.has(d.id))return revisedAssessment(d,start,end);
  const firstSound=d.audio[0][0],lastSound=d.audio[0][1],duration=end-start;
  let inOk,inText,outOk,outText;
  if(d.id==='shot-start'){
    inOk=start===24;
    inText=inOk?`The subtitle starts at ${tc(start)}, aligning with the shot change.`:`The subtitle starts at ${tc(start)}, ${Math.abs(start-24)} frames ${start<24?'before':'after'} the shot change. Adjust the in-time to ${tc(24)} to align with the shot change.`;
  }else if(d.id==='cross-in'){
    inOk=start===48||start===60;
    inText=inOk?`${tc(start)} is a valid shot-change placement.`:`The subtitle starts at ${tc(start)}, ${Math.abs(60-start)} frames ${start<60?'before':'after'} the shot change. The in-time should be ${tc(48)} or ${tc(60)}.`;
  }else{
    inOk=audioInOk(start,firstSound);
    const distance=Math.abs(start-firstSound);
    inText=inOk?(distance===0?`The subtitle starts at ${tc(start)}, on the first frame of audio.`:`Setting the in-time to ${tc(start)} places the subtitle within the accepted 1–2-frame lead before the first frame of audio at ${tc(firstSound)}.`):start<firstSound?`The subtitle starts at ${tc(start)}, which is ${distance} frames before the first frame of audio, exceeding the accepted 1–2-frame lead. The in-time should be ${tc(firstSound-2)}–${tc(firstSound)}.`:`The subtitle starts at ${tc(start)}, which is ${distance} frames after the first frame of audio. The in-time should be ${tc(firstSound-2)}–${tc(firstSound)}.`;
  }
  if(['audio-start','shot-start','minimum'].includes(d.id)){
    const min=lastSound+12,max=d.id==='audio-start'||d.id==='minimum'||d.id==='shot-start'?min:lastSound+18;
    outOk=end>=min&&end<=max;
    outText=end<lastSound?`${tc(end)} cuts off the audio at ${tc(lastSound)}.`:end<min?`The subtitle remains on screen until ${tc(end)}, which is only ${end-lastSound} frames after the audio ends. Extend the out-time to ${tc(min)} to meet the recommended 12-frame extension.`:end>max?`The subtitle remains on screen until ${tc(end)}, which is ${end-lastSound} frames after the audio ends, exceeding the recommended 12-frame extension by ${end-min} frames.`:`Setting the out-time to ${tc(end)} keeps the subtitle on screen for ${end-lastSound} frames after the audio ends at ${tc(lastSound)}.`;
  }else if(d.id==='shot-end'){
    outOk=end===70;
    outText=outOk?`${tc(end)} is two frames before the shot change.`:`The subtitle ends too early at ${tc(end)}. Set the out-time to ${tc(70)}, two frames before the shot change.`;
  }else if(d.id==='close-gap'){
    const gap=d.second[0]-end;
    outOk=gap===2;
    outText=outOk?`${tc(end)} leaves a two-frame gap to subtitle B.`:gap<0?`${tc(end)} overlaps subtitle B by ${-gap} frames. End A at ${tc(53)}.`:`${tc(end)} leaves a ${gap}-frame gap to B. End A at ${tc(53)}.`;
  }else if(d.id==='cross-in'){
    outOk=end>=89;
    outText=end<lastSound?`${tc(end)} cuts off audio at ${tc(lastSound)}.`:outOk?`Setting the out-time to ${tc(end)} keeps the subtitle on screen for ${end-lastSound} frames after the audio ends at ${tc(lastSound)}.`:`${tc(end)} leaves only ${end-lastSound} frames after audio. Extend to ${tc(89)}.`;
  }else{
    outOk=end===70||end>=84;
    outText=end===70?`${tc(end)} is two frames before the shot change.`:end>=84?`${tc(end)} is ${end-72} frames after the shot change.`:`${tc(end)} is too close to the shot change. The out-time should be ${tc(70)} or ${tc(84)}.`;
  }
  return {inOk,inText,outOk,outText,durationOk:duration>=20,durationText:`${duration} frames (minimum: 20 frames).`};
}

const tl = id => document.getElementById(id);
const timelineSaved = (()=>{try{return JSON.parse(localStorage.getItem('subtitle-timing-drills-v1')||'{}')||{}}catch{return {}}})();
const timelineMisses = new Map(Object.entries(timelineSaved.misses||{}).filter(([id,v])=>DRILLS.some(d=>d.id===id)&&Array.isArray(v)&&v.length===2));
const oldToTimeline = {'min-19':'minimum','audio-in':'audio-start','shot-in':'shot-start','shot-out':'shot-end','cross-in':'cross-in','cross-out':'cross-out','gap-seven':'close-gap'};
for(const [oldId,newId] of Object.entries(oldToTimeline))if(Object.hasOwn(saved.misses||{},oldId)&&!timelineMisses.has(newId))timelineMisses.set(newId,DRILLS.find(d=>d.id===newId).initial.slice());
let tlQueue=[],tlIndex=0,tlCorrect=0,tlAnswered=false,tlStart=0,tlEnd=0,tlView='question',tlPrevious='question',tlPointer=null;

function tlPersist(){try{localStorage.setItem('subtitle-timing-drills-v1',JSON.stringify({misses:Object.fromEntries(timelineMisses)}))}catch{} updateMissedCount()}
function tc(frame){const sec=15+Math.floor(frame/24);return `00:00:${String(sec).padStart(2,'0')}:${String(frame%24).padStart(2,'0')}`}
function frameRange(start,end){return start===end?tc(start):`${tc(start)}–${tc(end)}`}
function tlShow(view){tlView=view;for(const name of ['question','result','review'])tl(`timeline-${name}-view`).hidden=view!==name}
function timelineBegin(retry=false){
  setActiveMode('timeline'); show('timeline'); tlQueue=retry?DRILLS.filter(d=>timelineMisses.has(d.id)):DRILLS.slice();tlIndex=0;tlCorrect=0;
  if(!tlQueue.length){tlShow('result');tl('timeline-result-title').textContent='No missed drills.';tl('timeline-result-copy').textContent='Try a full set of timeline drills first.';tl('timeline-retry').hidden=true;return}
  tlShow('question');tlRender();
}
function tlRender(){
  tlHideTimecodeGuide();
  const d=tlQueue[tlIndex];tlAnswered=false;[tlStart,tlEnd]=d.initial;
  tl('timeline-mode-label').textContent='TIMELINE DRILL · 24 FPS';tl('timeline-progress-label').textContent=`${tlIndex+1} of ${tlQueue.length}`;
  const percent=Math.round(tlIndex/tlQueue.length*100);tl('timeline-progress-fill').style.width=`${percent}%`;tl('timeline-progress').setAttribute('aria-valuenow',percent);
  tl('timeline-category').textContent=d.category;tl('timeline-question').textContent=d.question;tl('timeline-instruction').textContent=d.instruction;
  tl('event-text').textContent=d.second?'SUBTITLE A':'SUBTITLE';tl('ideal-event').hidden=true;
  tl('second-event').hidden=!d.second;if(d.second){tl('second-event').style.left=`${d.second[0]/TL_FRAMES*100}%`;tl('second-event').style.width=`${(d.second[1]-d.second[0])/TL_FRAMES*100}%`;tl('second-event').textContent='SUBTITLE B'}
  tl('shot-layer').replaceChildren(...d.cuts.map(frame=>{const marker=document.createElement('div');marker.className='shot-marker';marker.style.left=`${frame/TL_FRAMES*100}%`;marker.innerHTML='<span>SHOT CHANGE</span>';return marker}));
  const ticks=Array.from({length:TL_FRAMES+1},(_,frame)=>{
    const mark=document.createElement('i');
    mark.className=`frame-tick ${frame%24===0?'major':frame%6===0?'quarter':'minor'}`;
    mark.style.left=`${frame/TL_FRAMES*100}%`;
    return mark;
  });
  const labels=[0,24,48,72,96].map(frame=>{const label=document.createElement('span');label.textContent=tc(frame);label.style.left=`${frame/TL_FRAMES*100}%`;return label});
  tl('ruler').replaceChildren(...ticks,...labels);
  for(const id of ['start-slider','end-slider','start-handle','end-handle'])tl(id).disabled=false;
  tl('event').classList.remove('locked');tl('check-timing').hidden=false;tl('timeline-feedback').hidden=true;tl('timeline-next').hidden=true;
  tl('timeline-next').textContent=tlIndex+1===tlQueue.length?'See results':'Next drill';tlUpdate();tlDrawWave();
}
function frameOffsetText(offset,reference='end'){
  if(reference==='start')return offset===0?'on the first frame of audio':`${Math.abs(offset)} frame${Math.abs(offset)===1?'':'s'} ${offset>0?'after':'before'} first frame of audio`;
  if(offset===0)return `0 frames · at audio ${reference}`;
  return `${offset>0?'+':'−'}${Math.abs(offset)} frame${Math.abs(offset)===1?'':'s'} ${offset>0?'after':'before'} audio ${reference}`;
}
function frameOffsetInfo(drill,frame,reference){
  const neighbor=reference==='end'?drill.second:drill.previous;
  const neighborFrame=neighbor?.[reference==='end'?0:1];
  if(Number.isFinite(neighborFrame)&&Math.abs(frame-neighborFrame)<=12){
    const offset=frame-neighborFrame,name=reference==='end'?'next subtitle':'previous subtitle';
    return {reference:'subtitle',text:offset===0?`at ${name}`:`${Math.abs(offset)} frame${Math.abs(offset)===1?'':'s'} ${offset>0?'after':'before'} ${name}`};
  }
  const nearest=(drill.cuts||[]).reduce((best,cut)=>best===null||Math.abs(frame-cut)<Math.abs(frame-best)?cut:best,null);
  if(nearest!==null&&Math.abs(frame-nearest)<=12){
    const offset=frame-nearest;
    return {reference:'shot',text:offset===0?'on the shot change':`${Math.abs(offset)} frame${Math.abs(offset)===1?'':'s'} ${offset>0?'after':'before'} shot change`};
  }
  return {reference:'audio',text:frameOffsetText(frame-drill.audio[0][reference==='start'?0:1],reference)};
}
function tlUpdateOffset(){
  for(const reference of ['start','end']){
  const badge=tl(reference==='start'?'frame-offset-start':'frame-offset');
  badge.hidden=!tl('show-frame-offset').checked||!tlPointer||!tlQueue[tlIndex]||(tlPointer.kind!=='move'&&tlPointer.kind!==reference);
  if(badge.hidden)continue;
  const frame=reference==='start'?tlStart:tlEnd;
  const offset=frameOffsetInfo(tlQueue[tlIndex],frame,reference);
  badge.textContent=offset.text;
  badge.dataset.reference=offset.reference;
  const track=tl('track'),editor=tl('editor');
  const edge=track.offsetLeft+track.clientWidth*frame/TL_FRAMES;
  const half=badge.offsetWidth/2;
  const center=Math.max(half+6,Math.min(editor.clientWidth-half-6,edge));
  badge.style.left=`${center}px`;
  badge.style.top=`${track.offsetTop+38+(tlPointer.kind==='move'&&reference==='end'?40:0)}px`;
  badge.style.setProperty('--pointer-x',`${Math.max(6,Math.min(badge.offsetWidth-6,edge-center+half))}px`);
  }
}
function tlUpdate(){
  tlUpdateOffset();
  tl('event').style.left=`${tlStart/TL_FRAMES*100}%`;tl('event').style.width=`${(tlEnd-tlStart)/TL_FRAMES*100}%`;
  tl('start-value').textContent=tc(tlStart);tl('end-value').textContent=tc(tlEnd);
  tl('duration-value').textContent=`${tlEnd-tlStart} frame${tlEnd-tlStart===1?'':'s'}`;
  const tooShort=tlEnd-tlStart<20;
  tl('event').classList.toggle('is-too-short',tooShort);
  tl('duration-value').classList.toggle('is-too-short',tooShort);
  tl('start-slider').value=tlStart;tl('end-slider').value=tlEnd;
  tl('start-slider').setAttribute('aria-valuetext',tc(tlStart));tl('end-slider').setAttribute('aria-valuetext',tc(tlEnd));
}
function tlSet(which,value){if(tlAnswered)return;const frame=Math.max(0,Math.min(TL_FRAMES,Math.round(value)));
  if(which==='start')tlStart=Math.min(frame,tlEnd-1);else if(which==='end')tlEnd=Math.max(frame,tlStart+1);tlUpdate()}
function tlDrawWave(){
  const wave=tl('waveform'),d=tlQueue[tlIndex];if(!d)return;
  // Fixed viewBox coordinates keep drawing independent of hidden/unfinished layout.
  wave.setAttribute('viewBox','0 0 960 188');
  wave.setAttribute('preserveAspectRatio','none');
  const paths={audio:[],quiet:[]};
  for(let x=0;x<960;x+=3){
    const frame=x/960*TL_FRAMES;
    const audio=d.audio.find(([a,b])=>frame>=a&&frame<=b);
    const taper=audio?Math.min(1,(frame-audio[0]+1)/5,(audio[1]-frame+1)/5):0;
    const waveX=d.waveSeed?frame*(7+d.waveSeed*.23)+d.waveSeed*19:x;
    const detail=Math.abs(Math.sin(waveX*.135)*Math.sin(waveX*.043+1.8))*.62+Math.abs(Math.sin(waveX*.37+.6))*.25;
    const height=audio?(9+detail*62)*Math.max(.24,taper):2+detail*5;
    paths[audio?'audio':'quiet'].push(`M${x},${94-height/2}v${height}`);
  }
  wave.replaceChildren(...['quiet','audio'].map(kind=>{
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',paths[kind].join(' '));path.setAttribute('stroke',kind==='audio'?'#83a9d4':'#536675');
    path.setAttribute('stroke-width','2.2');path.setAttribute('fill','none');return path;
  }));
}
function tlCheck(){if(tlAnswered)return;const d=tlQueue[tlIndex],success=d.check(tlStart,tlEnd);tlAnswered=true;
  if(success){tlCorrect++;timelineMisses.delete(d.id)}else timelineMisses.set(d.id,[tlStart,tlEnd]);tlPersist();
  for(const id of ['start-slider','end-slider','start-handle','end-handle'])tl(id).disabled=true;
  tl('event').classList.add('locked');tl('check-timing').hidden=true;
  if(!success){tl('ideal-event').style.left=`${d.ideal[0]/TL_FRAMES*100}%`;tl('ideal-event').style.width=`${(d.ideal[1]-d.ideal[0])/TL_FRAMES*100}%`;tl('ideal-event').hidden=false}
  const feedback=tl('timeline-feedback');feedback.className=`feedback timeline-feedback ${success?'correct':'incorrect'}`;
  const result=tlEdgeAssessment(d,tlStart,tlEnd);
  const heading=success?'Nice timing.':!result.inOk&&!result.outOk?'Check both edges.':!result.inOk?'Check the in-time.':!result.outOk?'Check the out-time.':'Check the duration.';
  const row=(label,ok,detail)=>`<div class="timing-assessment ${ok?'is-right':'is-wrong'}"><span class="timing-symbol" aria-hidden="true">${ok?'✓':'✕'}</span><div><strong>${label}: ${ok?'Correct':'Needs work'}</strong><p>${escapeHTML(detail)}</p></div></div>`;
  const durationRow=d.second
    ?row('Subtitle A duration',result.durationOk,result.durationText)+row('Subtitle B duration',d.second[1]-d.second[0]>=20,`${d.second[1]-d.second[0]} frames (minimum: 20 frames).`)
    :!result.durationOk||(result.inOk&&result.outOk)?row('Duration',result.durationOk,result.durationText):'';
  feedback.innerHTML=`<strong class="timing-feedback-title">${heading}</strong><div class="timing-assessments">${row('In-time',result.inOk,result.inText)}${row('Out-time',result.outOk,result.outText)}${durationRow}</div><div class="timing-rule"><span class="timing-info-icon" aria-hidden="true">i</span><div><strong>Why</strong><p>${escapeHTML(d.why)}</p>${!success?`<p class="ideal-note">${d.id==='shot-end'?'The ideal timing: set the in-time to 00:00:16:00 and the out-time to 00:00:18:00.':`The ideal timing: set the in-time to ${tc(d.ideal[0])} and the out-time to ${tc(d.ideal[1])}.`}</p>`:''}</div></div><a href="${TL_SOURCE}" target="_blank" rel="noopener noreferrer">Check Netflix timing guidelines</a>`;
  feedback.hidden=false;tl('timeline-next').hidden=false;tlLinkTimecodes();
}
function tlNext(){if(!tlAnswered)return;tlIndex++;if(tlIndex<tlQueue.length){tlRender();tl('timeline-question').focus()}else{
  tlShow('result');tl('timeline-progress-fill').style.width='100%';tl('timeline-progress').setAttribute('aria-valuenow',100);
  tl('timeline-result-title').textContent=`${tlCorrect} of ${tlQueue.length} timed well`;
  tl('timeline-result-copy').textContent=timelineMisses.size?`${timelineMisses.size} timing decision${timelineMisses.size===1?'':'s'} to review. Look at the example placements, then retry.`:'All clear. You can run the timeline drills again.';
  tl('timeline-retry').hidden=timelineMisses.size===0;tl('timeline-result-title').focus();
}}
function timelineReview(){tlPrevious=tlView;const list=tl('timeline-review-list');list.replaceChildren();
  for(const [id,attempt] of timelineMisses){const d=DRILLS.find(item=>item.id===id);if(!d)continue;const card=document.createElement('article');card.className='review-card';
    const tag=document.createElement('span');tag.className='category';tag.textContent=d.category;card.append(tag);
    const title=document.createElement('h3');title.textContent=d.question;card.append(title);
    const tried=document.createElement('p');tried.className='muted';tried.textContent=`Your event: ${frameRange(attempt[0],attempt[1])}`;card.append(tried);
    const ideal=document.createElement('p');ideal.textContent=`One valid placement: ${frameRange(d.ideal[0],d.ideal[1])}`;card.append(ideal);
    const why=document.createElement('p');why.textContent=d.why;card.append(why);list.append(card);
  }
  tlShow('review');tl('timeline-review-view').querySelector('h2').focus();
}
window.timelineTrainer={begin:timelineBegin,review:timelineReview,missCount:()=>timelineMisses.size};
tlPersist();

// Pointer movement is mapped to the frame ruler; sliders provide exact keyboard and touch input.
function frameAt(event){const rect=tl('track').getBoundingClientRect();return Math.max(0,Math.min(TL_FRAMES,Math.round((event.clientX-rect.left)/rect.width*TL_FRAMES)))}
function startDrag(kind,event){if(tlAnswered)return;event.preventDefault();event.stopPropagation();tlPointer={kind,origin:frameAt(event),start:tlStart,end:tlEnd};tlUpdateOffset();window.addEventListener('pointermove',dragMove);window.addEventListener('pointerup',endDrag,{once:true});window.addEventListener('pointercancel',endDrag,{once:true});window.addEventListener('blur',endDrag,{once:true})}
function dragMove(event){if(!tlPointer)return;const current=frameAt(event),delta=current-tlPointer.origin;
  if(tlPointer.kind==='move'){const length=tlPointer.end-tlPointer.start;tlStart=Math.max(0,Math.min(TL_FRAMES-length,tlPointer.start+delta));tlEnd=tlStart+length;tlUpdate()}
  else tlSet(tlPointer.kind,(tlPointer.kind==='start'?tlPointer.start:tlPointer.end)+delta);
}
function endDrag(){tlPointer=null;tlUpdateOffset();window.removeEventListener('pointermove',dragMove);window.removeEventListener('pointerup',endDrag);window.removeEventListener('pointercancel',endDrag);window.removeEventListener('blur',endDrag)}
tl('show-frame-offset').checked=false;
tl('show-frame-offset').addEventListener('change',tlUpdateOffset);
tl('start-handle').addEventListener('pointerdown',event=>startDrag('start',event));tl('end-handle').addEventListener('pointerdown',event=>startDrag('end',event));
tl('event').addEventListener('pointerdown',event=>{if(event.target.closest('.event-handle'))return;startDrag('move',event)});
tl('start-slider').addEventListener('input',event=>tlSet('start',event.target.value));tl('end-slider').addEventListener('input',event=>tlSet('end',event.target.value));
tl('check-timing').addEventListener('click',tlCheck);tl('timeline-next').addEventListener('click',tlNext);
tl('timeline-retry').addEventListener('click',()=>timelineBegin(true));tl('timeline-restart').addEventListener('click',()=>timelineBegin());
tl('timeline-review-retry').addEventListener('click',()=>timelineBegin(true));tl('timeline-back').addEventListener('click',()=>tlShow(tlPrevious));
tl('timeline-tab').addEventListener('click',()=>timelineBegin());tl('rules-tab').addEventListener('click',()=>begin());
tl('timeline-question').tabIndex=-1;tl('timeline-result-title').tabIndex=-1;tl('timeline-review-view').querySelector('h2').tabIndex=-1;
window.addEventListener('resize',()=>{if(activeMode==='timeline'&&tlView==='question'){tlDrawWave();tlUpdateOffset()}});

let tlGuideTarget=null;
function timecodeFrame(value){
  const [h,m,s,f]=value.split(':').map(Number);
  return ((h*60+m)*60+s-15)*24+f;
}
function tlHideTimecodeGuide(){
  if(tlGuideTarget)tlGuideTarget.classList.remove('is-guided');
  tlGuideTarget=null;
  const guide=tl('timecode-guide');if(guide)guide.hidden=true;
}
function tlShowTimecodeGuide(target){
  tlHideTimecodeGuide();if(!target)return;
  const frame=Number(target.dataset.frame);
  if(!Number.isFinite(frame)||frame<0||frame>TL_FRAMES)return;
  tlGuideTarget=target;target.classList.add('is-guided');
  const guide=tl('timecode-guide'),track=tl('track'),ruler=tl('ruler');
  const trackRect=track.getBoundingClientRect(),editorRect=tl('editor').getBoundingClientRect();
  const x=trackRect.left-editorRect.left-tl('editor').clientLeft+trackRect.width*frame/TL_FRAMES;
  guide.hidden=false;guide.style.left=x+'px';guide.style.top=ruler.offsetTop+'px';
  guide.style.height=(track.offsetTop+track.clientHeight-ruler.offsetTop)+'px';
  const label=guide.firstElementChild;label.textContent=target.textContent;
  const half=label.offsetWidth/2,editor=tl('editor');
  const center=Math.max(half+4,Math.min(editor.clientWidth-half-4,x));
  label.style.left=(center-x)+'px';
}
function tlLinkTimecodes(){
  tlHideTimecodeGuide();
  const feedback=tl('timeline-feedback');
  const walker=document.createTreeWalker(feedback,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    const text=node.nodeValue,re=/\b\d{2}:\d{2}:\d{2}:\d{2}\b/g;
    const matches=[...text.matchAll(re)];if(!matches.length)continue;
    const fragment=document.createDocumentFragment();let from=0;
    for(const match of matches){
      fragment.append(document.createTextNode(text.slice(from,match.index)));
      const frame=timecodeFrame(match[0]);
      if(frame>=0&&frame<=TL_FRAMES){
        const button=document.createElement('button');button.type='button';button.className='feedback-timecode';
        button.dataset.frame=frame;button.textContent=match[0];
        button.setAttribute('aria-label','Show '+match[0]+' on the timeline');
        button.addEventListener('pointerenter',()=>tlShowTimecodeGuide(button));
        button.addEventListener('focus',()=>tlShowTimecodeGuide(button));
        for(const name of ['pointerleave','blur'])button.addEventListener(name,()=>{if(tlGuideTarget===button)tlHideTimecodeGuide()});
        button.addEventListener('keydown',event=>{if(event.key==='Escape')tlHideTimecodeGuide()});
        fragment.append(button);
      }else fragment.append(document.createTextNode(match[0]));
      from=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(from)));node.replaceWith(fragment);
  }
}
const timecodeGuide=document.createElement('div');timecodeGuide.id='timecode-guide';timecodeGuide.hidden=true;
timecodeGuide.setAttribute('aria-hidden','true');timecodeGuide.append(document.createElement('span'));tl('editor').append(timecodeGuide);
window.addEventListener('blur',tlHideTimecodeGuide);
window.addEventListener('resize',()=>{if(tlGuideTarget)tlShowTimecodeGuide(tlGuideTarget)});

timelineBegin();
