import { useState, useEffect, useRef } from 'react';
import { Block } from './classes/BlockClass';

function App() {
  let [emptyDot, setEmptyDot] = useState('-');
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

  // клавиатура
  useEffect(() => {
    function keydown(event) {
      if (event.code === 'Space') {
        console.debug('пробел');
        if (
          block.rotateStops.every((e) => gameField[e[0]][e[1]] === emptyDot)
        ) {
          setPrevDotsCoordinates(block.dotsCoordinates);
          block.rotate();
          setRenderState((prev) => !prev);
        }
      } else if (event.code === 'ArrowLeft') {
        console.debug('влево');
        if (block.leftStops.every((e) => gameField[e[0]][e[1]] === emptyDot)) {
          setPrevDotsCoordinates(block.dotsCoordinates);
          block.moveLeft();
          setRenderState((prev) => !prev);
        }
      } else if (event.code === 'ArrowRight') {
        console.debug('вправо');
        if (block.rightStops.every((e) => gameField[e[0]][e[1]] === emptyDot)) {
          setPrevDotsCoordinates(block.dotsCoordinates);
          block.moveRight();
          setRenderState((prev) => !prev);
        }
      } else if (event.code === 'ArrowDown') {
        if (
          block.bottomStops.every((e) => gameField[e[0]][e[1]] === emptyDot)
        ) {
          setPrevDotsCoordinates(block.dotsCoordinates);
          block.moveDown();
          setRenderState((prev) => !prev);
        }
      }
    }
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
    };
  }, [block]);

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
            setRenderState((prev) => !prev);
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
              cleanAndOffsetFieldLines();
              setRenderState((prev) => !prev);
              setBlock(nextBlock);
              setRenderState((prev) => !prev);
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
  }, [gameIsStarted, renderState]);

  function randomFigure() {
    return ['I', 'Z', 'S', 'T', 'O', 'L', 'J'][Math.floor(Math.random() * 7)];
  }

  function start() {
    if (!gameIsStarted) {
      setGameIsStarted(true);
    } else if (gameIsStarted || gameIsOver) {
      setGameIsStarted(false);
      setTimeout(() => {
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
        setBlock(new Block(startPosition, randomFigure()));
        setPrevDotsCoordinates([]);
        setRenderState(true);
        setScore(0);
      }, 0);
    }
  }

  function down() {
    console.log('down');
    setPrevDotsCoordinates(block.dotsCoordinates);
    block.moveDown();
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
    console.log('сжигание линий');
    setGameField((prev) => {
      let field = prev
        .map((line) =>
          line.slice(1, -1).every((dot) => dot === filledDot)
            ? (setScore((prev) => prev + 150), console.log('+150'), false)
            : line
        )
        .filter(Boolean);
      while (field.length < 25) {
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
          <p>score:{score}</p>
          <p>next figure:{nextBlock.type}</p>
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
                      classNameTerms(lineIndex, pixelIndex)
                        ? 'line_pixel-visible_text'
                        : 'line_pixel-invisible_text'
                    }
                  >
                    {classNameTerms(lineIndex, pixelIndex) ? pixel : ''}
                    {/* второй pixel замениьть на '' */}
                  </p>
                </div>
              ))}
            </div>
          ))}
          {/* <button
            onClick={() =>
              setSpeed((prevSpeed) => (prevSpeed > 0.3 ? prevSpeed - 0.2 : 0.2))
            }
          >
            faster
          </button>
          <button onClick={() => setSpeed((prevSpeed) => prevSpeed + 0.2)}>
            slower
          </button> */}
          <button
            onClick={(e) => {
              e.target.blur();
              start();
            }}
          >
            {gameIsStarted ? 'reboot' : 'start'}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
