const boardPlayer = document.querySelector('#board-video');
const boardTitle = document.querySelector('#board-title');
const boardDescription = document.querySelector('#board-description');
let selectedBoard;

// Without JavaScript the thumbnail links open the MP4 files directly.
for (const link of document.querySelectorAll('.board-option')) {
  const button = document.createElement('button');
  const url = link.href;
  const description = link.dataset.description;
  const current = link.getAttribute('aria-current') === 'true';
  button.type = 'button';
  button.className = link.className;
  button.setAttribute('aria-controls', boardPlayer.id);
  button.setAttribute('aria-pressed', String(current));
  button.append(...link.childNodes);
  link.replaceWith(button);
  if (current) selectedBoard = button;

  button.addEventListener('click', event => {
    if (button !== selectedBoard) {
      selectedBoard.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-pressed', 'true');
      selectedBoard = button;
      boardTitle.textContent = button.querySelector('span').textContent;
      boardDescription.textContent = description;
      boardPlayer.poster = button.querySelector('img').src;
      boardPlayer.src = url;
    }
    boardPlayer.play().catch(() => {
      // Native controls remain available when a browser restricts playback.
    });
    if (event.detail > 0 && boardPlayer.getBoundingClientRect().bottom <= 0) {
      boardPlayer.scrollIntoView({ block: 'start' });
    }
  });
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  boardPlayer.play().catch(() => {
    // Some browsers require a tap on the play control.
  });
}
