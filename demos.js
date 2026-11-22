// Keep the handoff in the destination URL so it also works in a new tab.
const arrival = new URLSearchParams(location.hash.slice(1));
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const players = new Map();
const visibility = new Map();
let foreground;

function activate(video) {
  if (foreground === video) return;
  const previous = foreground;
  foreground = video;
  players.get(previous)?.(false);
  players.get(video)?.(true);
}

const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) visibility.set(entry.target, entry.intersectionRatio);
  let best = foreground;
  for (const [video, ratio] of visibility) {
    if (ratio > (visibility.get(best) || 0)) best = video;
  }
  activate(visibility.get(best) > 0 ? best : undefined);
}, { threshold: [0, .01, .1, .25, .5, .75, .9, 1] }) : null;

for (const video of document.querySelectorAll('video[data-demo]')) {
  const key = video.dataset.demo;
  const button = document.querySelector(`button[data-demo-toggle][aria-controls="${video.id}"]`);
  const links = document.querySelectorAll(`a[data-demo-link="${key}"]`);
  const continuing = arrival.get('demo') === key;
  const startTime = continuing ? Number(arrival.get('t')) : 0;
  let wantsPlayback = continuing ? arrival.get('play') === '1' : !motionPreference.matches;
  let visible = !observer && players.size === 0;
  let ready = false;

  function updateButton() {
    if (button) button.textContent = video.paused ? 'Video abspielen' : 'Video pausieren';
  }

  function syncPlayback() {
    if (!ready) return;
    if (visible && wantsPlayback && !document.hidden) {
      video.play().catch(updateButton);
    } else {
      video.pause();
    }
  }

  function initialize() {
    if (ready) return;
    if (Number.isFinite(startTime) && startTime > 0 && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = startTime % video.duration;
    }
    ready = true;
    syncPlayback();
  }

  video.muted = true;
  if (video.controls) {
    video.addEventListener('play', () => {
      wantsPlayback = true;
      activate(video);
    });
    video.addEventListener('pause', () => {
      if (visible && !document.hidden) wantsPlayback = false;
    });
  }
  const caption = video.closest('figure')?.querySelector('[data-demo-caption]');
  const track = video.textTracks[0];
  if (caption && track) {
    function showScene() {
      const cue = track.activeCues?.[0];
      if (cue) caption.textContent = cue.text;
    }
    function selectCaptionMode() {
      const fullscreen = document.fullscreenElement === video || video.webkitDisplayingFullscreen;
      track.mode = fullscreen ? 'showing' : 'hidden';
      showScene();
    }
    track.addEventListener('cuechange', showScene);
    video.querySelector('track')?.addEventListener('load', showScene);
    document.addEventListener('fullscreenchange', selectCaptionMode);
    video.addEventListener('webkitbeginfullscreen', selectCaptionMode);
    video.addEventListener('webkitendfullscreen', selectCaptionMode);
    selectCaptionMode();
  }
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      wantsPlayback = video.paused;
      syncPlayback();
    });
    video.addEventListener('play', updateButton);
    video.addEventListener('pause', updateButton);
    updateButton();
  }
  video.addEventListener('loadedmetadata', initialize, { once: true });
  if (video.readyState >= 1) initialize();
  players.set(video, active => {
    visible = active;
    syncPlayback();
  });
  observer?.observe(video);
  document.addEventListener('visibilitychange', syncPlayback);
  motionPreference.addEventListener('change', () => {
    wantsPlayback = !motionPreference.matches;
    syncPlayback();
  });

  for (const link of links) {
    function setDestinationTime() {
      const destination = new URL(link.href);
      destination.hash = new URLSearchParams({
        demo: key,
        t: video.currentTime.toFixed(3),
        play: wantsPlayback ? '1' : '0'
      }).toString();
      link.href = destination.href;
    }
    link.addEventListener('click', setDestinationTime);
    link.addEventListener('auxclick', setDestinationTime);
    link.addEventListener('contextmenu', setDestinationTime);
  }
}
