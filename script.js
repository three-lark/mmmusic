const audioPlayer = document.getElementById('audio');
let vinyl = document.getElementById('vinyl');
let vinylArt = document.getElementById('vinylArt');
const indicator = document.getElementById('indicator');
let currentAudio = null;

function playAudio(element) {
    const songPath = element.dataset.song;
    const artPath = element.dataset.art || null; // optional per-track artwork

    // If clicking the same song that's currently selected -> toggle play/pause
    if (currentAudio === element) {
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
        return;
    }

    // Remove active from all boxes
    document.querySelectorAll('.textbox').forEach(t => t.classList.remove('active'));

    // Set the new source and play
    audioPlayer.src = songPath;
    audioPlayer.play().catch(err => {
        // autoplay might be blocked by browser policies; user can click to allow
        console.warn('Playback failed:', err);
    });

    // Mark the clicked box active
    element.classList.add('active');
    currentAudio = element;

    // Move the sliding indicator to the clicked element
    moveIndicatorTo(element);

    // Swap vinyl artwork with slide animation
    swapVinylArtwork(artPath);
}

function swapVinylArtwork(artPath) {
    const wrap = document.querySelector('.vinyl-wrap');
    if (!wrap || !vinyl) {
        // fallback: set background directly
        if (vinylArt && artPath) {
            vinylArt.style.backgroundImage = `url('${artPath}')`;
            vinylArt.textContent = '';
        }
        return;
    }

    // clone current vinyl panel to create a new incoming one
    const oldVinyl = vinyl;
    const oldArt = vinylArt;
    const newVinyl = oldVinyl.cloneNode(true);

    // remove ids from the clone to avoid duplicates, we'll reassign after swap
    newVinyl.removeAttribute('id');
    const newArt = newVinyl.querySelector('.vinyl-art');
    if (newArt) newArt.removeAttribute('id');

    // set the artwork on the incoming vinyl
    if (artPath && newArt) {
        newArt.style.backgroundImage = `url('${artPath}')`;
        newArt.textContent = '';
    } else if (newArt) {
        newArt.style.backgroundImage = '';
        newArt.textContent = '';
    }

    // make sure the clone doesn't carry over transient classes
    newVinyl.classList.remove('incoming', 'slide-in', 'slide-out', 'playing');

    // prepare incoming vinyl off-screen to the left
    newVinyl.classList.add('incoming');
    wrap.appendChild(newVinyl);

    // ensure click toggles on the new artwork as well
    const newArtNode = newVinyl.querySelector('.vinyl-art');
    if (newArtNode) {
        newArtNode.addEventListener('click', () => {
            if (!currentAudio) return;
            if (audioPlayer.paused) audioPlayer.play();
            else audioPlayer.pause();
        });
    }

    // force layout so transitions will run
    // eslint-disable-next-line no-unused-expressions
    newVinyl.getBoundingClientRect();

    // animate: old slides out to the right, new slides in to center
    // stop spinning the outgoing copy first so it doesn't rotate while sliding
    oldVinyl.classList.remove('playing');
    oldVinyl.classList.add('slide-out');
    newVinyl.classList.add('slide-in');

    // when the incoming vinyl finishes its transform transition, remove the old one and reassign refs
    const onTransitionEnd = (e) => {
        if (e.propertyName !== 'transform') return;
        // remove old vinyl element
        try { oldVinyl.remove(); } catch (err) {}

        // make the new one the main vinyl and ensure it has id and references
        newVinyl.id = 'vinyl';
        const artEl = newVinyl.querySelector('.vinyl-art');
        if (artEl) artEl.id = 'vinylArt';

        // update module-level refs
        vinyl = document.getElementById('vinyl');
        vinylArt = document.getElementById('vinylArt');

        // if audio is playing, ensure the vinyl spins
        if (!audioPlayer.paused) vinyl.classList.add('playing');
        // clean up any transient classes from the new main vinyl
        newVinyl.classList.remove('incoming', 'slide-in', 'slide-out');
        newVinyl.removeEventListener('transitionend', onTransitionEnd);
    };

    newVinyl.addEventListener('transitionend', onTransitionEnd);
}

// Audio event listeners to toggle vinyl spinning and handle ended state
audioPlayer.addEventListener('play', () => {
    if (vinyl) vinyl.classList.add('playing');
});

audioPlayer.addEventListener('pause', () => {
    if (vinyl) vinyl.classList.remove('playing');
});

audioPlayer.addEventListener('ended', () => {
    if (vinyl) vinyl.classList.remove('playing');
    if (currentAudio) currentAudio.classList.remove('active');
    currentAudio = null;
    // hide indicator when nothing is active
    if (indicator) {
        indicator.style.height = '0px';
        indicator.style.opacity = '0';
    }
});

// Optional: allow clicking on artwork to toggle play/pause
if (vinylArt) {
    vinylArt.addEventListener('click', () => {
        if (!currentAudio) return;
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
    });
}

function moveIndicatorTo(el) {
    if (!indicator) return;
    const container = el.parentElement; // .selectors
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const top = elRect.top - containerRect.top + container.scrollTop;
    const height = elRect.height;

    // apply values; CSS transition will animate
    indicator.style.top = `${top}px`;
    indicator.style.height = `${height}px`;
    // make indicator visible
    indicator.style.opacity = '1';
}