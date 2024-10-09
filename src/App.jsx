import { useState, useEffect, useRef } from 'react';
import { Block } from '@classes/BlockClass';
import soundLeft from '@sounds/left.mp3';
import soundRight from '@sounds/right.mp3';
import soundDown from '@sounds/down.mp3';
import soundRotate from '@sounds/rotate.mp3';
import soundLine from '@sounds/line.mp3';

function App() {
  let [emptyDot, setEmptyDot] = useState('.');
  let [filledDot, setFilledDot] = useState('X');
  let [gameIsStarted, setGameIsStarted] = useState(false);
  let [speed, setSpeed] = useState(0.2);
  let requestRef = useRef(null);
  let lastFrameRef = useRef(null);
  let [gameField, setGameField] = useState([
    ...Array(24)
      .fill()
      .map((m) => ['G', ...Array(10).fill(emptyDot), 'G']),
    ...Array(1)
      .fill()
      .map((m) => Array(12).fill('G')),
  ]);
  const startPosition = [2, 5];
  let [nextBlock, setNextBlock] = useState(
    new Block(startPosition, randomFigure())
  );
  let [block, setBlock] = useState(new Block(startPosition, randomFigure()));
  let [prevDotsCoordinates, setPrevDotsCoordinates] = useState([]);
  let [renderState, setRenderState] = useState(true);
  let [score, setScore] = useState(0);
  let [gameIsOver, setGameIsOver] = useState(false);
  let [playIndex, setPlayIndex] = useState(null);
  let audioFiles = [soundLeft, soundRight, soundDown, soundRotate, soundLine];

  useEffect(() => {
    if (playIndex !== null) {
      const audio = new Audio(audioFiles[playIndex]);

      function handleEnded() {
        setPlayIndex(null);
      }

      audio.addEventListener('ended', handleEnded);
      audio.play();

      return () => {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          setPlayIndex(null);
          audio.removeEventListener('ended', handleEnded);
        }, 2000);
      };
    }
  }, [playIndex]);

  // клавиатура
  useEffect(() => {
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
    };
  }, [block, gameIsStarted]);

  function keydown(event) {
    if (event.code === 'Space') {
      console.debug('пробел');
      if (block.rotateStops.every((e) => gameField[e[0]][e[1]] === emptyDot)) {
        setPlayIndex(3);
        rotate();
      }
    } else if (event.code === 'ArrowLeft') {
      console.debug('влево');
      if (block.leftStops.every((e) => gameField[e[0]][e[1]] === emptyDot)) {
        setPlayIndex(0);
        left();
      }
    } else if (event.code === 'ArrowRight') {
      console.debug('вправо');
      if (block.rightStops.every((e) => gameField[e[0]][e[1]] === emptyDot)) {
        setPlayIndex(1);
        right();
      }
    } else if (event.code === 'ArrowDown') {
      if (block.bottomStops.every((e) => gameField[e[0]][e[1]] === emptyDot)) {
        setPlayIndex(2);
        down();
      }
    } else if (event.code === 'Enter') {
      console.debug('старт клавиаткра');
      setPlayIndex(0);
      setGameIsOver(false);
      start();
    }
  }

  // game loop
  useEffect(() => {
    function gameLoop(timestamp) {
      if (gameIsStarted) {
        if (lastFrameRef.current === null) {
          lastFrameRef.current = timestamp;
          render();
        } else if (timestamp - lastFrameRef.current > speed * 1000) {
          console.debug('такт');
          lastFrameRef.current = timestamp;
          if (
            block.bottomStops.every((e) => gameField[e[0]][e[1]] === emptyDot)
          ) {
            down();
          } else {
            if (block.dotsCoordinates.some((e) => e[0] === 3)) {
              console.debug('game over');
              setGameField((prev) =>
                prev.map((m, i) =>
                  i != 14
                    ? m
                    : [m[0], m[1], ...'GAMEOVER'.split(''), m[10], m[11]]
                )
              );
              setGameIsOver(true);
              return () => cancelAnimationFrame(requestRef.current);
            } else {
              setPlayIndex(1);
              cleanAndOffsetFieldLines();
              setBlock(nextBlock);
              setPrevDotsCoordinates([]);
              setNextBlock(new Block(startPosition, randomFigure()));
            }
          }
        }
        requestRef.current = requestAnimationFrame(gameLoop);
      }
    }
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [nextBlock, speed, gameIsStarted]);

  // render
  useEffect(() => {
    if (gameIsStarted) {
      render();
    }
    return () => {};
  }, [gameIsStarted, renderState, block]);

  function randomFigure() {
    return ['I', 'Z', 'S', 'T', 'O', 'L', 'J'][Math.floor(Math.random() * 7)];
  }

  function start() {
    if (!gameIsStarted) {
      setGameIsStarted(true);
    } else if (gameIsStarted || gameIsOver) {
      setGameIsStarted(false);
      setTimeout(() => resetGame());
    }
  }

  function resetGame() {
    setSpeed(0.2);
    requestRef.current = null;
    lastFrameRef.current = null;
    setGameField([
      ...Array(24)
        .fill()
        .map((m) => ['G', ...Array(10).fill(emptyDot), 'G']),
      ...Array(1)
        .fill()
        .map((m) => Array(12).fill('G')),
    ]);
    setGameIsStarted(false);
    setNextBlock(new Block(startPosition, randomFigure()));
    setPrevDotsCoordinates([]);
    setScore(0);
    setBlock(new Block(startPosition, randomFigure()));
  }

  function down() {
    console.debug('down');
    setPrevDotsCoordinates(block.dotsCoordinates);
    setRenderState((prev) => !prev);
    block.moveDown();
  }
  function left() {
    console.debug('left');
    setPrevDotsCoordinates(block.dotsCoordinates);
    setRenderState((prev) => !prev);
    block.moveLeft();
  }
  function right() {
    console.debug('right');
    setPrevDotsCoordinates(block.dotsCoordinates);
    setRenderState((prev) => !prev);
    block.moveRight();
  }
  function rotate() {
    console.debug('rotate');
    setPrevDotsCoordinates(block.dotsCoordinates);
    setRenderState((prev) => !prev);
    block.rotate();
  }

  function render() {
    console.debug('render');
    setGameField((prevField) => {
      let mem = prevField.map((line) => [...line]);
      prevDotsCoordinates.forEach((e) => (mem[e[0]][e[1]] = emptyDot));
      block.dotsCoordinates.forEach((e) => (mem[e[0]][e[1]] = filledDot));
      return mem;
    });
  }

  // сжигание линий
  function cleanAndOffsetFieldLines() {
    console.debug('сжигание линий');
    setGameField((prev) => {
      let field = prev
        .map((line) =>
          line.slice(1, -1).every((dot) => dot === filledDot)
            ? (setScore((prev) => prev + 150), console.debug('+150'), false)
            : line
        )
        .filter(Boolean);
      while (field.length < 25) {
        setPlayIndex(4);
        field.unshift(['G', ...Array(10).fill(emptyDot), 'G']);
      }
      return field;
    });
  }

  function classNameTerms(li, pi) {
    return li >= 4 && li < 24 && pi > 0 && pi < 11;
  }

  return (
    <>
      <div className='game'>
        <div className='display'>
          {gameField.map((line, lineIndex) => (
            <div key={`line-key-${lineIndex}`} className='line'>
              {line.map((pixel, pixelIndex) => (
                <div
                  key={`pixel-key-${pixelIndex}`}
                  className={
                    classNameTerms(lineIndex, pixelIndex)
                      ? 'line_pixel-visible'
                      : 'line_pixel-invisible'
                  }
                >
                  <p
                    className={
                      gameIsOver
                        ? 'line_pixel_visible_red'
                        : 'line_pixel_visible_green'
                    }
                  >
                    {classNameTerms(lineIndex, pixelIndex) ? pixel : ''}
                  </p>
                </div>
              ))}
            </div>
          ))}
          <br />
        </div>
        <div className='scoreSection'>
          <p>score:{score}</p>
          <p>next figure:{nextBlock.type}</p>
          {gameIsStarted
            ? "press 'Enter' for reboot"
            : "press 'Enter' for start"}
          {/* <br />
          <br />
          <div className='buttonSection'>
            <button
              onClick={(e) => {
                e.target.blur();
                keydown({ code: 'Space' });
              }}
            >
              rotate
            </button>
          </div>
          <br />
          <div className='buttonSection'>
            <button
              onClick={() => {
                e.target.blur();
                keydown({ code: 'ArrowLeft' });
              }}
            >
              left
            </button>
            <button
              onClick={() => {
                e.target.blur();
                keydown({ code: 'ArrowDown' });
              }}
            >
              down
            </button>
            <button
              onClick={() => {
                e.target.blur();
                keydown({ code: 'ArrowRight' });
              }}
            >
              right
            </button>
          </div>
          <br />
          <div className='buttonSection'>
            <button
              onClick={() => {
                e.target.blur();
                keydown({ code: 'Enter' });
              }}
            >
              reset
            </button> 
          </div> */}
        </div>
      </div>
    </>
  );
}

export default App;
