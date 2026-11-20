(() => {
  const video = document.getElementById('bestellvideo');
  const button = document.querySelector('.video-toggle');
  if (!video || !button) return;

  const updateButton = () => {
    button.textContent = video.paused ? 'Video abspielen' : 'Video pausieren';
  };
  const play = () => {
    const result = video.play();
    if (result && typeof result.catch === 'function') result.catch(updateButton);
  };

  video.muted = true;
  button.hidden = false;
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  button.addEventListener('click', () => {
    if (video.paused) play();
    else video.pause();
  });
  updateButton();
  play();
})();
