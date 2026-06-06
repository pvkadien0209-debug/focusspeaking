'use client';

function playAudio(filename, onPlay, onEnd) {
  let link = '/audio/';
  if (filename.includes('_')) {
    link += filename.split('_')[0] + '/';
  } else if (filename.startsWith('B')) {
    link += 'T1A1/';
  }
  const audio = new Audio(`${link}${filename}.mp3`);
  audio.addEventListener('play', onPlay);
  audio.addEventListener('ended', () => { onEnd(); audio.remove(); });
  audio.addEventListener('error', () => { onEnd(); audio.remove(); });
  audio.play().catch(onEnd);
}

function disableSTT() {
  document.getElementById('sttStopBTN')?.click();
}
function enableSTT() {
  setTimeout(() => {
    document.getElementById('sttStartBTN')?.click();
  }, 350);
}

export default function ReadMessageMp3(audioArr) {
  if (!Array.isArray(audioArr) || !audioArr.length) return;
  const idx = Math.floor(Math.random() * audioArr.length);
  const { id, st } = audioArr[idx];

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    const el = document.getElementById('aw01Textcontent');
    if (el) el.textContent = st;
  } else {
    if (id) playAudio(id, disableSTT, enableSTT);
  }
}
