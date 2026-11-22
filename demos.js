// Keep the handoff in the destination URL so it also works in a new tab.
const arrival = new URLSearchParams(location.hash.slice(1));
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

for (const video of document.querySelectorAll('video[data-demo]')) {
  const key = video.dataset.demo;
  const button = document.querySelector(`button[data-demo-toggle][aria-controls="${video.id}"]`);
  const links = document.querySelectorAll(`a[data-demo-link="${key}"]`);
  const continuing = arrival.get('demo') === key;
  const startTime = continuing ? Number(arrival.get('t')) : 0;
  let wantsPlayback = continuing ? arrival.get('play') === '1' : !motionPreference.matches;
  let visible = !('IntersectionObserver' in window);
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
    video.addEventListener('play', () => { wantsPlayback = true; });
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
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(video);
  }
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
