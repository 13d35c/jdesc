const SOURCES = {
  timing: { label: 'Netflix timing guidelines', url: 'https://studiopartner.netflix.net/studio/subtitle-timing-guidelines' },
  general: { label: 'General requirements', url: 'https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements' }
};

// The wording and examples are original practice scenarios, not excerpts from the guides.
const QUESTIONS = [
  {id:'min-19', topic:'Duration', question:'A one-word subtitle lasts 19 frames in a 24 fps file. What do you do?', scene:'Dialogue: "Oo." · event length: 19 frames', choices:['Leave it; a short word can be shorter than the minimum.','Extend it to at least 20 frames, if the surrounding timing allows.','Make every subtitle exactly 24 frames.'], answer:1, why:'20 frames is the minimum at 24 fps, even for a one-word event. Check the next event and any nearby shot change before extending.', source:'timing'},
  {id:'min-long', topic:'Duration', question:'A long two-line subtitle lasts exactly 20 frames. Is that a good target?', scene:'Two full lines · 24 fps · no nearby event blocks an extension', choices:['Yes. Every event should aim for 20 frames.','No. Give longer text more time when possible; 20 frames is best reserved for one or two words.','No. Delete a line regardless of meaning.'], answer:1, why:'20 frames is a floor, not a comfortable reading target for two full lines. Extend the out-time where the shot and audio allow.', source:'timing'},
  {id:'min-convert', topic:'Duration', question:'At 24 fps, what is the 20-frame minimum in seconds?', scene:'20 frames ÷ 24 frames per second', choices:['About 0.67 seconds','About 0.83 seconds','Exactly 1 second'], answer:1, why:'20 ÷ 24 = 0.833 seconds (5/6 second). The timing article says "4/5 sec" in parentheses, but its 20-frame rule and the general guide agree on 5/6 second.', source:'general'},
  {id:'max-duration', topic:'Duration', question:'A single subtitle event runs for 7.4 seconds. What is the issue?', scene:'One event · 7.4 seconds on-screen', choices:['It exceeds the 7-second maximum.','It is fine whenever the shot is long.','It only matters for one-line subtitles.'], answer:0, why:'The general maximum is 7 seconds per event. Re-time or segment the text while keeping it readable and in sync.', source:'general'},
  {id:'audio-in', topic:'Audio & sync', question:'The audio starts at frame 100. There is no shot change nearby. Which in-time is the best starting point?', scene:'First audible frame: 100 · no nearby shot change', choices:['Frame 100, or frame 98–99 just before it.','Frame 88, to give more reading time.','Frame 112, after the speaker finishes the phrase.'], answer:0, why:'Start on the first audible frame or one to two frames before it in this practice scenario. A nearby shot change can change the best in-time.', source:'timing'},
  {id:'audio-out', topic:'Audio & sync', question:'Audio ends, with no following subtitle or nearby shot change. Where should the subtitle ideally go out?', scene:'Audio ends at 00:01:12:00 · clear screen afterward', choices:['Exactly when the audio stops.','Roughly half a second or more after the audio stops, if it still looks natural.','Two seconds before the audio stops.'], answer:1, why:'Let it stay around half a second after audio so viewers can finish reading. Watch back for a lingering effect.', source:'timing'},
  {id:'audio-vs-shot', topic:'Audio & sync', question:'The half-second extension after audio would carry this subtitle across a shot change. The audio itself ends before the shot change. Where should you set the subtitle’s out-time?', scene:'Audio ends · shot change follows shortly · no dialogue across shot change', choices:['End two frames before the shot change.','Let the subtitle hang halfway into the next shot every time.','End on the exact last audio frame.'], answer:0, why:'Prefer a clean out-time two frames before the shot change when the dialogue does not cross it. Adjust wording or reading speed if needed.', source:'timing'},
  {id:'shot-in', topic:'Shot changes', question:'A new shot begins at frame 200. The line starts 8 frames into that shot. Where should its subtitle start?', scene:'Shot starts: 200 · audio starts: 208 · 24 fps', choices:['At frame 200, the first frame of the new shot.','At frame 208, always exactly on the audio.','At frame 188, before the new shot.'], answer:0, why:'When audio starts on a shot change or within half a second after it (12 frames at 24 fps), bring the in-time to the shot change.', source:'timing'},
  {id:'shot-out', topic:'Shot changes', question:'Your current out-time is 7 frames before a shot change. The dialogue has ended. Where should you usually move it?', scene:'24 fps · out-time 7 frames before shot change', choices:['Leave a 7-frame gap before the shot change.','Extend to two frames before the shot change.','Carry it 7 frames into the next shot.'], answer:1, why:'An out-time within half a second of a shot change can be extended to two frames before the shot change, as long as it does not linger awkwardly.', source:'timing'},
  {id:'cross-in', topic:'Shot changes', question:'Audio begins 9 frames before a shot change and continues into the next shot. Which in-time choices fit the guide?', scene:'24 fps · dialogue starts 9 frames before shot change', choices:['Start 9 frames before the shot change and keep that in-time.','Start at least 12 frames before the shot change, or start on the first frame of the new shot.','Start 5 frames after the shot change.'], answer:1, why:'For dialogue crossing a shot change, an in-time before it needs at least half a second of lead. Bring it forward to 12 frames before, or move it to the new shot.', source:'timing'},
  {id:'cross-out', topic:'Shot changes', question:'Dialogue crosses a shot change. If reading speed allows, where can the subtitle end?', scene:'24 fps · spoken line continues across a shot change', choices:['Five frames after the shot change.','Two frames before the shot change, or at least 12 frames after it.','Only on the shot change itself.'], answer:1, why:'Avoid a brief subtitle tail just after the shot change. For dialogue crossing it, aim for two frames before or at least half a second after.', source:'timing'},
  {id:'scene-cross', topic:'Shot changes', question:'A subtitle runs into a completely new scene, but its dialogue belongs only to the previous scene. What is the call?', scene:'End of scene A → unrelated scene B', choices:['Let it cross because shot changes are always allowed.','Keep it in scene A; scene changes generally must not be crossed.','Move all the text to scene B.'], answer:1, why:'A scene change is stricter than an ordinary shot change. The stated exception is audio that begins before the change and continues in the next scene.', source:'timing'},
  {id:'gap-seven', topic:'Gaps & rhythm', question:'Two consecutive subtitles have a 7-frame gap in a 24 fps file. What should you aim for?', scene:'Event A ends · 7 empty frames · event B begins', choices:['Close it to a 2-frame gap, if timing permits.','Leave 7 frames because any gap is fine.','Make the events overlap.'], answer:0, why:'At 24 fps, gaps of 3–11 frames should normally be closed to two frames by extending the earlier event, while respecting shot changes and audio.', source:'timing'},
  {id:'gap-twelve', topic:'Gaps & rhythm', question:'Two subtitles have a 12-frame gap at 24 fps. Is that gap in the preferred pattern?', scene:'12 frames = half a second at 24 fps', choices:['Yes. A half-second gap is allowed.','No. Every gap must be exactly two frames.','No. Make them overlap by two frames.'], answer:0, why:'The preferred gaps are two frames or at least half a second. Twelve frames meets the half-second threshold at 24 fps.', source:'timing'},
  {id:'gap-extended', topic:'Gaps & rhythm', question:'The first subtitle already stays half a second after audio. Extending it more would close a short gap. What should you consider?', scene:'Event A already extended after audio · small gap to B', choices:['Stretch A as far as needed regardless of lingering.','Try re-segmenting or merging, or leave a half-second gap if possible.','Delete B without checking the dialogue.'], answer:1, why:'Avoid extending a subtitle further when it already lingers half a second after audio. Re-segmentation or a merge may make the rhythm cleaner.', source:'timing'},
  {id:'borrow', topic:'Gaps & rhythm', question:'One subtitle event feels rushed, while its neighbor has plenty of time. Which edit can help?', scene:'Event A: dense and fast · event B: short and spacious', choices:['Merge or re-segment the neighbors to borrow time, then check sync and formatting.','Ignore the pace if both events meet the minimum.','Move the rushed text before a visible punchline.'], answer:0, why:'Borrowing time can even out reading speed. Watch the merged event for speaker formatting, shot timing, and spoilers.', source:'timing'},
  {id:'fps-twentyfour', topic:'Frames', question:'At 24 fps, how many frames are half a second, and what is the minimum gap?', scene:'Content: 24 fps', choices:['12 frames; the subtitle gap minimum is 2 frames.','15 frames; the gap minimum is 3 frames.','24 frames; the gap minimum is 12 frames.'], answer:0, why:'Half a second is 12 frames at 24 fps. The minimum gap between events is two frames.', source:'timing'},
  {id:'position-bottom', topic:'Position & text', question:'A location card fills the bottom of the screen while dialogue is spoken. Where should the subtitle go?', scene:'On-screen text along the bottom · top area clear', choices:['Center-justified at the top.','Over the location card at the bottom.','Left-justified in the middle.'], answer:0, why:'Use top or bottom, centered. Moving to the top avoids covering important bottom text.', source:'general'},
  {id:'position-both', topic:'Position & text', question:'A headline fills the top of the screen, and a speaker label sits at the bottom. A subtitle would overlap text in either position. How do you choose?', scene:'Top: long headline · bottom: short speaker label · dialogue continues', choices:['Always top, regardless of readability.','Use the top or bottom position where the subtitle is easier to read.','Place the subtitle in the middle.'], answer:1, why:'When both positions have on-screen text, choose the top or bottom area that makes the subtitle easier to read. Check how much text each position would cover.', source:'general'},
  {id:'one-line', topic:'Position & text', question:'A subtitle fits comfortably on one line. How many lines should you use?', scene:'"Babalik ako bukas." · comfortably within the line limit', choices:['One line.','Two lines so the screen looks balanced.','Three lines to slow down reading.'], answer:0, why:'Usually keep a subtitle on one line unless it exceeds the line limit. The general maximum is two lines.', source:'general'},
  {id:'line-break', topic:'Position & text', question:'Which break keeps the words together most naturally?', scene:'Text to split: "Hahanapin ko ang lumang bahay bago dumilim."', choices:['Hahanapin ko ang / lumang bahay bago dumilim.','Hahanapin ko ang lumang bahay / bago dumilim.','Hahanapin ko ang lumang / bahay bago dumilim.'], answer:1, why:'Break before the conjunction "bago" here and keep "ang lumang bahay" together. Avoid splitting an article or adjective from its noun.', source:'general'},
  {id:'two-lines', topic:'Position & text', question:'A dialogue subtitle occupies three lines, even though each line fits its limit. What still needs fixing?', scene:'Three visible subtitle lines · no speaker change', choices:['Nothing; only the per-line character count matters.','Reduce or re-segment to a maximum of two lines.','Move the third line to the top of the screen at the same time.'], answer:1, why:'The general limit is two lines per subtitle event. Staying within the per-line limit does not permit a third line.', source:'general'},
  {id:'fn-fade', topic:'On-screen text', question:'On-screen text fades in and out. Where do you initially time its forced narrative?', scene:'On-screen text fades in → holds → fades out', choices:['Halfway through each fade, then watch it back for sync.','Only after the on-screen text has completely appeared, ending after it vanishes.','To the spoken dialogue rather than the on-screen text.'], answer:0, why:'For a fading on-screen text FN, aim around the midpoint of the fades and check the result on playback.', source:'timing'},
  {id:'fn-cut', topic:'On-screen text', question:'A sign stays visible for an entire shot and disappears at the shot change. Where should its forced narrative end?', scene:'Sign present through shot · next shot has no sign', choices:['Two frames before the shot change.','Half a second into the next shot.','When unrelated dialogue finishes.'], answer:0, why:'For on-screen text lasting the whole shot, set the FN out-time two frames before the shot change, within duration limits.', source:'timing'},
  {id:'spoiler', topic:'Audio & sync', question:"A joke's punchline begins in the next shot, after a visible reaction. What must your early in-time avoid?", scene:'Setup → reaction shot → punchline', choices:['Revealing the punchline before viewers reach the moment.','A two-frame gap.','Using a one-line subtitle.'], answer:0, why:'Do not show a punchline or major plot point early when the reaction matters. Sync to the reveal and watch the sequence back.', source:'timing'}
];

const ABSTRACT_FRAME_IDS = new Set(['min-19','audio-in','shot-in','shot-out','cross-in','cross-out','gap-seven']);
const RULE_QUESTIONS = QUESTIONS.filter(q => !ABSTRACT_FRAME_IDS.has(q.id));
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const saved = (() => { try { const data = JSON.parse(localStorage.getItem('subtitle-timing-lab-v1') || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } })();
const misses = new Map(Object.entries(saved.misses || {}).filter(([id, choice]) => RULE_QUESTIONS.some(q => q.id === id) && Number.isInteger(choice)));
let queue = [], index = 0, correct = 0, answered = false, sessionMode = 'all', currentView = 'timeline', previousView = 'practice', activeMode='timeline', activeGuide='timing';

function persist() { try { localStorage.setItem('subtitle-timing-lab-v1', JSON.stringify({misses:Object.fromEntries(misses)})); } catch {} updateMissedCount(); }
function guideMisses() { return RULE_QUESTIONS.filter(q=>q.source===activeGuide&&misses.has(q.id)); }
function updateMissedCount() { const count=activeMode==='timeline' ? (window.timelineTrainer?.missCount() || 0) : guideMisses().length; $('missed-count').textContent = count; $('mistakes-button').disabled = count === 0; $('retry-button').disabled = guideMisses().length === 0; $('review-retry-button').disabled = guideMisses().length === 0; }
function setActiveMode(mode) { activeMode=mode; document.body.dataset.mode=mode; $('timeline-tab').setAttribute('aria-selected',String(mode==='timeline')); $('rules-tab').setAttribute('aria-selected',String(mode==='rules')); updateMissedCount(); }
function show(view) { currentView=view; for (const name of ['timeline','practice','result','review']) $(name).hidden = view !== name; }
function topicName() { return $('topic').value === 'all' ? 'All topics' : $('topic').value; }
function fillTopics() {
  $('topic').replaceChildren(new Option('All topics','all'));
  for (const topic of [...new Set(RULE_QUESTIONS.filter(q=>q.source===activeGuide).map(q=>q.topic))]) $('topic').add(new Option(topic,topic));
}
function selectGuide(guide) {
  if(activeGuide===guide)return;
  activeGuide=guide;document.body.dataset.guide=guide;
  $('timing-guide-tab').setAttribute('aria-selected',String(guide==='timing'));
  $('general-guide-tab').setAttribute('aria-selected',String(guide==='general'));
  $('timing-modes').hidden=guide==='general';
  $('guide-heading').textContent=guide==='timing'?'Time the subtitle.':'Shape the subtitle.';
  $('guide-intro').textContent=guide==='timing'?'24 fps practice. See the audio and the edit, then make your timing call.':'Practice duration, line treatment, and positioning from the general requirements.';
  fillTopics();
  if(guide==='timing')window.timelineTrainer.begin();else begin('all');
}
function begin(mode = 'all') {
  setActiveMode('rules');
  sessionMode = mode;
  const selected = RULE_QUESTIONS.filter(q => q.source===activeGuide && (mode === 'retry' ? misses.has(q.id) : $('topic').value === 'all' || q.topic === $('topic').value));
  queue = selected.slice();
  for (let i=queue.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [queue[i],queue[j]]=[queue[j],queue[i]]; }
  index = 0; correct = 0; answered = false;
  if (!queue.length) { show('result'); $('result-title').textContent='Nothing to retry yet.'; $('result-copy').textContent='Answer some scenarios first. Missed concepts will collect here.'; $('retry-button').hidden=true; return; }
  $('retry-button').hidden=false; show('practice'); render();
}
function render() {
  const q = queue[index]; answered = false;
  $('mode-label').textContent = sessionMode === 'retry' ? 'RETRY MISSED CONCEPTS' : `${activeGuide==='timing'?'TIMING GUIDELINES':'GENERAL REQUIREMENTS'} · ${topicName().toUpperCase()}`;
  $('progress-label').textContent = `${index+1} of ${queue.length}`;
  const percent = Math.round(index / queue.length * 100);
  $('progress-fill').style.width = `${percent}%`;
  $('progress-track').setAttribute('aria-valuenow', String(percent));
  $('category').textContent=q.topic;
  $('question').textContent=q.question;
  $('scene').textContent=q.scene;
  $('answers').replaceChildren(...q.choices.map((choice, i) => {
    const button=document.createElement('button'); button.type='button'; button.className='option';
    button.innerHTML=`<span class="option-key">${i+1}</span><span>${escapeHTML(choice)}</span>`;
    button.addEventListener('click',()=>choose(i)); return button;
  }));
  $('feedback').hidden=true; $('next-button').hidden=true;
  $('next-button').textContent = index+1===queue.length ? 'See results' : 'Next question';
}
function choose(choice) {
  if (answered) return;
  answered=true;
  const q=queue[index], success=choice===q.answer;
  if (success) { correct++; misses.delete(q.id); } else misses.set(q.id,choice);
  persist();
  [...$('answers').children].forEach((button,i)=>{ button.disabled=true; if(i===q.answer) button.classList.add('is-correct'); else if(i===choice) button.classList.add('is-wrong'); });
  const source=SOURCES[q.source], feedback=$('feedback');
  feedback.className=`feedback ${success?'correct':'incorrect'}`;
  feedback.innerHTML=`<strong>${success?'You got it.':'Not quite.'}</strong><p>${escapeHTML(q.why)}</p><a href="${source.url}" target="_blank" rel="noopener noreferrer">Check ${escapeHTML(source.label)}</a>`;
  feedback.hidden=false; $('next-button').hidden=false;
}
function advance() { if (!answered) return; index++; if(index < queue.length) { render(); $('question').focus(); } else finish(); }
function finish() {
  show('result'); $('progress-fill').style.width='100%'; $('progress-track').setAttribute('aria-valuenow','100');
  $('result-title').textContent=`${correct} of ${queue.length} right`;
  const missed=guideMisses().length;
  $('result-copy').textContent=missed ? `${missed} concept${missed===1?'':'s'} to review in this guide. Read the explanations, then retry those questions.` : 'All clear. You can practice another topic or run this guide again.';
  $('retry-button').hidden = missed===0; $('result-title').focus();
}
function review() {
  previousView=currentView;
  const list=$('review-list'); list.replaceChildren();
  for (const [id, wrong] of misses) {
    const q=RULE_QUESTIONS.find(item=>item.id===id); if(!q) continue;
    if(q.source!==activeGuide)continue;
    const card=document.createElement('article'); card.className='review-card';
    const source=SOURCES[q.source];
    card.innerHTML=`<span class="category">${escapeHTML(q.topic)}</span><h3>${escapeHTML(q.question)}</h3><p class="muted">Your answer: ${escapeHTML(q.choices[wrong] || 'Unknown')}</p><p><strong>Best answer:</strong> ${escapeHTML(q.choices[q.answer])}</p><p>${escapeHTML(q.why)}</p><a href="${source.url}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)}</a>`;
    list.append(card);
  }
  show('review'); $('review').querySelector('h2').focus();
}

$('timing-guide-tab').addEventListener('click',()=>selectGuide('timing'));
$('general-guide-tab').addEventListener('click',()=>selectGuide('general'));
fillTopics();
$('topic').addEventListener('change',()=>begin('all'));
$('mistakes-button').addEventListener('click',()=>activeMode==='timeline'?window.timelineTrainer.review():review());
$('back-button').addEventListener('click',()=>show(previousView));
$('next-button').addEventListener('click',advance);
$('retry-button').addEventListener('click',()=>begin('retry'));
$('review-retry-button').addEventListener('click',()=>begin('retry'));
$('restart-button').addEventListener('click',()=>{ $('topic').value='all'; begin('all'); });
document.addEventListener('keydown', event=>{
  if (activeMode!=='rules' || currentView!=='practice' || ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!answered && /^[1-4]$/.test(event.key)) { const option=$('answers').children[Number(event.key)-1]; if(option) { event.preventDefault(); option.click(); } }
  else if(answered && event.key==='Enter' && document.activeElement.tagName!=='A') { event.preventDefault(); advance(); }
});
$('question').tabIndex=-1; $('result-title').tabIndex=-1; $('review').querySelector('h2').tabIndex=-1;
updateMissedCount(); begin();
