import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Disc3, Music2, X } from 'lucide-react';
import { finalSurprise, memories } from './data/memories.js';
import { musicSelections } from './data/music.js';

function Photo({ memory, className = '', onClick }) {
  const [failedImage, setFailedImage] = useState('');
  const imagePath = memory?.image;
  const imageFailed = failedImage === imagePath;

  return (
    <button className={`photo ${className}`} onClick={onClick} type="button" aria-label={memory?.caption || 'Open photograph'}>
      {imagePath && !imageFailed
        ? <img
            src={imagePath}
            alt={memory.caption || 'A memory'}
            onError={(event) => {
              const requestedUrl = event.currentTarget.currentSrc || imagePath;
              console.error(`Unable to load memory photo "${imagePath}" (requested URL: ${requestedUrl}). Check that the file exists under public and that its filename casing matches.`, event);
              setFailedImage(imagePath);
            }}
          />
        : <span className="photo-placeholder"><span className="placeholder-rose">✿</span><span>Your photograph<br />will live here</span></span>}
    </button>
  );
}

function Envelope({ onOpen }) {
  const [isOpening, setIsOpening] = useState(false);
  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(onOpen, 850);
  };
  return (
    <section className={`opening ${isOpening ? 'is-opening' : ''}`} aria-label="Birthday card">
      <div className="opening-glow" />
      <div className="opening-rose" aria-hidden="true">🌹</div>
      <div className="envelope-wrap">
        <div className="envelope">
          <div className="letter" />
          <div className="envelope-flap" />
          <div className="seal">✦</div>
        </div>
      </div>
      <h1>Happy Birthday <span className="heart">♥</span></h1>
      <button className="button button-gold" onClick={handleOpen} disabled={isOpening}>Open Your Gift <ArrowRight size={16} /></button>
    </section>
  );
}

function GiftCard({ memory, index, onOpen, large = false }) {
  const [isOpening, setIsOpening] = useState(false);
  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(() => {
      setIsOpening(false);
      onOpen();
    }, large ? 600 : 460);
  };
  return (
    <button className={`gift-card ${large ? 'gift-large' : ''} ${isOpening ? 'gift-opening' : ''}`} onClick={handleOpen} type="button" aria-label={`Open gift ${index + 1}`} disabled={isOpening}>
      <span className="gift-number">{String(index + 1).padStart(2, '0')}</span>
      <span className="gift-box" aria-hidden="true">
        <span className="gift-lid"><span className="gift-bow">✦</span></span>
        <span className="gift-body"><span className="gift-ribbon" /></span>
      </span>
      <span className="gift-caption">{memory?.caption || 'A little memory'}</span>
    </button>
  );
}

function RecordArt() {
  return <div className="record-art" aria-hidden="true"><div className="record"><div className="record-label"><Disc3 size={31} strokeWidth={1} /></div></div><span className="record-arm" /></div>;
}

let spotifyIframeApiPromise;

function loadSpotifyIframeApi() {
  if (spotifyIframeApiPromise) return spotifyIframeApiPromise;

  spotifyIframeApiPromise = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    script.onerror = () => reject(new Error('Spotify player could not load. Check your connection and try again.'));
    document.head.appendChild(script);
  }).catch((error) => {
    spotifyIframeApiPromise = null;
    throw error;
  });

  return spotifyIframeApiPromise;
}

function SpotifyPlayer({ selection, onPlaybackChange }) {
  const playerRef = useRef(null);
  const [playerError, setPlayerError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    let controller;
    setPlayerError('');
    onPlaybackChange(false);

    if (!selection?.url) {
      return () => {
        isCurrent = false;
      };
    }

    loadSpotifyIframeApi()
      .then((iframeApi) => {
        if (!isCurrent || !playerRef.current) return;
        iframeApi.createController(playerRef.current, { url: selection.url, width: '100%', height: 152 }, (embedController) => {
          if (!isCurrent) {
            embedController.destroy();
            return;
          }
          controller = embedController;
          controller.addListener('playback_update', (event) => {
            onPlaybackChange(!event.data.isPaused);
          });
        });
      })
      .catch((error) => {
        if (isCurrent) setPlayerError(error.message);
      });

    return () => {
      isCurrent = false;
      onPlaybackChange(false);
      controller?.destroy();
    };
  }, [selection?.url, onPlaybackChange]);

  if (!selection?.url) {
    return (
      <div className="player-placeholder">
        <Music2 size={21} strokeWidth={1.3} />
        <p>Add a Spotify link in <code>src/data/music.js</code> to embed a record here.<br /><a href={`https://open.spotify.com/search/${encodeURIComponent(`${selection?.artist || ''} ${selection?.title || ''}`)}`} target="_blank" rel="noreferrer">Find this voice on Spotify ↗</a></p>
      </div>
    );
  }
  let embedUrl;
  try {
    const parsed = new URL(selection.url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const kind = segments[0];
    const id = segments[1];
    if (parsed.hostname !== 'open.spotify.com' || !['track', 'album', 'playlist', 'episode', 'show'].includes(kind) || !id) {
      throw new Error('Use a Spotify track, album, playlist, show, or episode URL.');
    }
    embedUrl = `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`;
  } catch (error) {
    return <div className="player-placeholder">{error.message}</div>;
  }
  if (playerError) return <div className="player-placeholder" role="status">{playerError}</div>;
  return <div className="spotify-embed" ref={playerRef} aria-label={`Spotify player: ${selection.title}`} data-embed-url={embedUrl} />;
}

function PhotoModal({ memory, onClose, isFinal = false }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`memory-modal ${isFinal ? 'final-modal' : ''}`} role="dialog" aria-modal="true" aria-label="A birthday memory">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close photograph"><X size={19} /></button>
        <div className="modal-photo-mat"><Photo memory={memory} className="modal-photo" /></div>
        {isFinal ? <p className="modal-birthday">Happy Birthday <span className="heart">♥</span></p> : (memory?.caption || memory?.date) && <p className="modal-caption">{memory.caption}{memory.caption && memory.date ? ' · ' : ''}{memory.date}</p>}
      </div>
      {isFinal && <span className="modal-sparkle" aria-hidden="true">✦</span>}
    </div>
  );
}

function App() {
  const [opened, setOpened] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [finalOpen, setFinalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const updatePlayback = useCallback((playing) => setIsPlaying(playing), []);

  const closeModal = () => {
    setSelectedMemory(null);
    setFinalOpen(false);
    setActivePhoto(null);
  };
  const revealPhoto = (memory, index) => setSelectedMemory({ memory, index });
  const galleryMemories = memories;
  const finalMemory = finalSurprise;
  const shownMusic = musicSelections[selectedTrack] || musicSelections[0];

  return (
    <main>
      {!opened ? <Envelope onOpen={() => setOpened(true)} /> : (
        <div className="experience">
          <header className="topbar">
            <a className="wordmark" href="#top" aria-label="Birthday home"><span className="wordmark-mark">✦</span></a>
            <nav aria-label="Main navigation"><a href="#gifts">Gifts</a><a href="#music">Music</a><a href="#memories">Memories</a></nav>
            <span className="topbar-note">Made with love <span className="heart">♥</span></span>
          </header>

          <section className="hero" id="top">
            <div className="hero-copy">
              <h1>For your<br /><em>beautiful</em> day.</h1>
              <p>A beautiful twenty-first, wrapped in music and memories.</p>
              <a className="text-link" href="#gifts">Wander in <ArrowDown size={15} /></a>
            </div>
            <div className="hero-stilllife">
              <div className="halo" />
              <div className="hero-vase"><span>🌹</span></div>
              <div className="hero-record"><RecordArt /></div>
              <span className="hero-sparkle sparkle-a">✦</span><span className="hero-sparkle sparkle-b">✧</span>
            </div>
          </section>

          <section className="gift-section section-wrap" id="gifts">
            <div className="section-heading">
              <div><span className="eyebrow">01 / A few little things</span><h2>Unwrap a <em>memory</em></h2></div>
            </div>
            <div className="gift-grid">
              {memories.slice(0, 6).map((memory, index) => <GiftCard key={`${memory.image}-${index}`} memory={memory} index={index} onOpen={() => revealPhoto(memory, index)} />)}
            </div>
          </section>

          <section className="music-section" id="music">
            <div className="music-inner section-wrap">
              <div className="music-copy">
                <span className="eyebrow">02 / The listening room</span>
                <h2>Let the records<br /><em>turn slowly.</em></h2>
                <div className="track-list">
                  {musicSelections.map((track, index) => (
                    <button key={`${track.artist}-${index}`} className={`track-row ${selectedTrack === index ? 'is-selected' : ''}`} onClick={() => setSelectedTrack(index)}>
                      <span className="track-index">{String(index + 1).padStart(2, '0')}</span><span className="track-info"><strong>{track.artist}</strong><small>{track.title}</small></span><span className="track-indicator">{selectedTrack === index ? '♫' : '↗'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="music-object">
                <div className={`music-record ${isPlaying ? 'is-playing' : ''}`} aria-label={isPlaying ? 'Vinyl record spinning' : 'Vinyl record stopped'}>
                  <RecordArt />
                </div>
                <div className="gramophone" aria-hidden="true"><div className="horn"><div /></div><div className="horn-stem" /><div className="gramophone-base"><span>✦</span></div></div>
              </div>
              <div className="player-card">
                <div className="player-heading"><span>NOW PLAYING</span><span className="player-eq"><i /><i /><i /><i /></span></div>
                <p>{shownMusic?.artist || 'A ghazal for the evening'}</p>
                <small>{shownMusic?.title || 'Select a record above'}</small>
                <SpotifyPlayer selection={shownMusic} onPlaybackChange={updatePlayback} />
                <span className="player-footnote">Spotify · playback controls are yours</span>
              </div>
            </div>
          </section>

          <section className="gallery-section section-wrap" id="memories">
            <div className="section-heading">
              <div><span className="eyebrow">03 / Kept close</span><h2>Little <em>moments.</em></h2></div>
            </div>
            <div className="gallery-grid">
              {galleryMemories.map((memory, index) => <div className={`gallery-item gallery-item-${index % 5}`} key={`${memory.image}-gallery-${index}`}><Photo memory={memory} onClick={() => setActivePhoto(memory)} /><span className="gallery-number">{String(index + 1).padStart(2, '0')}</span></div>)}
            </div>
          </section>

          <section className="final-section">
            <div className="final-ornament" aria-hidden="true">✦</div>
            <span className="eyebrow">A little more, before you go</span>
            <h2>One last <em>surprise.</em></h2>
            <GiftCard memory={finalMemory} index={Math.min(memories.length, 6)} large onOpen={() => setFinalOpen(true)} />
          </section>

          <footer><span>Happy Birthday <span className="heart">♥</span></span><span>With all my love</span></footer>
        </div>
      )}

      {selectedMemory && <PhotoModal memory={selectedMemory.memory} onClose={closeModal} />}
      {activePhoto && <PhotoModal memory={activePhoto} onClose={closeModal} />}
      {finalOpen && <PhotoModal memory={finalMemory} onClose={closeModal} isFinal />}
      <div className="grain" aria-hidden="true" />
    </main>
  );
}

export default App;
